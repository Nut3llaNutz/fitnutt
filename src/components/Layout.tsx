import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  BookOpen,
  Apple,
  Dumbbell,
  Settings,
  ScanBarcode,
  CalendarDays,
  Share2,
  Copy,
  Image as ImageIcon,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { AnimatedLogo } from "./AnimatedLogo";
import { Nut3llaTips } from "./Nut3llaTips";
import { supabase } from "@/integrations/supabase/client";
import { TutorialFlow } from "./TutorialFlow";
import { useTutorial } from "@/contexts/TutorialContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useMealEntries } from "@/hooks/useMealEntries";
import { useSettings, Supplement } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { ShareProgressCard } from "./ShareProgressCard";
import { calculateLevel, calculateXpForLevelJump } from "@/lib/gamification";
import { Nut3lla } from "./Nut3lla";
import { useDate } from "@/contexts/DateContext";

const leftNav = [
  { path: "/", icon: Home, label: "Home", tour: "nav-diary" },
  { path: "/foods", icon: Apple, label: "Fuel", tour: "nav-foods" },
];

const rightNav = [
  { path: "/schedule", icon: CalendarDays, label: "Schedule" },
  { path: "/profile", icon: Settings, label: "Settings" },
];

export const Layout = ({ children }: { children: ReactNode }) => {
  const { currentDate: globalDate } = useDate();
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { isActive, completeTutorial } = useTutorial();
  const { user, isGuest } = useAuth();
  const { toast } = useToast();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [easterEggMessage, setEasterEggMessage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const displayDate = globalDate || new Date().toISOString().split("T")[0];
  const { log } = useDailyLog(displayDate);
  const { entries } = useMealEntries(log?.id);
  const { settings } = useSettings();

  // Pre-load logo as Base64 to prevent iOS Safari from missing it during capture

  useEffect(() => {
    const preloadLogo = async () => {
      try {
        const response = await fetch("/fitnutt-logo.png");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Logo preload failed:", err);
      }
    };
    preloadLogo();
  }, []);

  // Guest Session Tracking
  useEffect(() => {
    if (isGuest) {
      const trackGuest = async () => {
        let fingerprint = localStorage.getItem("fitnutt_guest_id");
        if (!fingerprint) {
          fingerprint = crypto.randomUUID();
          localStorage.setItem("fitnutt_guest_id", fingerprint);
        }

        // Use a session-length key to only ping once per browser load
        const sessionPinged = sessionStorage.getItem("guest_ping_done");
        if (!sessionPinged) {
          await supabase.rpc("track_guest_session", {
            p_fingerprint: fingerprint,
          });
          sessionStorage.setItem("guest_ping_done", "true");
        }
      };
      trackGuest();
    }
  }, [isGuest]);

  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories || 0) * entry.quantity,
      protein: acc.protein + (entry.protein || 0) * entry.quantity,
      carbs: acc.carbs + (entry.carbs || 0) * entry.quantity,
      fats: acc.fats + (entry.fats || 0) * entry.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

  const { data: recentLogs } = useQuery({
    queryKey: ["recent_logs_streak", user?.id],
    enabled: !!settings,
    queryFn: async () => {
      const { data, error } =
        await import("@/integrations/supabase/client").then(
          (m) =>
            m.supabase
              .from("daily_logs")
              .select(
                "date, creatine_taken, whey_taken, supplements_taken, meal_entries(id)",
              )
              .order("date", { ascending: false })
              .limit(60), // Fetch more to ensure we find enough active days
        );
      if (error) throw error;
      return data;
    },
  });

  const streak = (() => {
    if (!recentLogs || recentLogs.length === 0) return 0;

    // Filter for days that actually have activity
    const activeLogs = recentLogs.filter((log: any) => {
      const hasSupps =
        log.creatine_taken ||
        log.whey_taken ||
        (log.supplements_taken &&
          Object.keys(log.supplements_taken).length > 0);
      const hasMeals = log.meal_entries && log.meal_entries.length > 0;
      return hasSupps || hasMeals;
    });

    if (activeLogs.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if the most recent activity was today or yesterday
    const lastActiveDate = new Date(activeLogs[0].date);
    lastActiveDate.setHours(0, 0, 0, 0);
    const diffDaysFromToday = Math.floor(
      (today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If no activity today OR yesterday, streak is dead
    if (diffDaysFromToday > 1) return 0;

    let count = 1; // We have at least one active day (today or yesterday)
    for (let i = 0; i < activeLogs.length - 1; i++) {
      const curr = new Date(activeLogs[i].date);
      const prev = new Date(activeLogs[i + 1].date);
      curr.setHours(0, 0, 0, 0);
      prev.setHours(0, 0, 0, 0);

      const diff = Math.floor(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );
      // If the gap between active days is exactly 1 day, the streak continues
      if (diff === 1) count++;
      else break;
    }
    return count;
  })();

  const targets = {
    calories: settings?.calorie_target || 2750,
    protein: settings?.protein_target || 100,
    carbs: settings?.carb_target || 400,
    fats: settings?.fat_target || 70,
  };

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    // Ensure all images in the card are loaded and decoded
    const images = Array.from(cardRef.current.querySelectorAll("img"));
    await Promise.all(
      images.map(async (img) => {
        if (img.complete) return;
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }),
    );

    // Final small delay to ensure any layout shifts or lazy-loaded fonts stabilized
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // Use dynamic import so it works whether installed locally OR pulling from CDN
      const module = await import(/* @vite-ignore */ "html-to-image").catch(
        async () => {
          // Fallback for CDN if local node_modules is still syncing
          return await import(
            /* @vite-ignore */ "https://esm.sh/html-to-image@1.11.11"
          );
        },
      );

      const toPngLocal = (module as any).toPng;

      // iOS Safari "Warm up" - The first call often fails to render images properly
      // By calling it once and ignoring the result, we force the browser to paint the buffer.
      try {
        await toPngLocal(cardRef.current, { cacheBust: true });
      } catch (e) {
        // Silently ignore warmup errors
      }

      const dataUrl = await toPngLocal(cardRef.current, {
        width: 1080,
        height: 1920,
        pixelRatio: 1, // Keep it exactly 1080x1920
        style: {
          transform: "scale(1)",
        },
        cacheBust: true,
      });

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `fitnutt-progress-${displayDate}.png`, {
          type: "image/png",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "My FitNutt Progress",
            text: `Just hit my macros for ${displayDate === new Date().toISOString().split("T")[0] ? "today" : displayDate}. Join the grind! 💪🏻 #FitNutt`,
          });
        } else {
          // Fallback if file sharing isn't supported on this specific mobile browser
          const link = document.createElement("a");
          link.download = `fitnutt-progress-${displayDate}.png`;
          link.href = dataUrl;
          link.click();
          toast({
            title: "Image Saved!",
            description: "Check your photo gallery to share!",
          });
        }
      } else {
        // Direct download for desktop
        const link = document.createElement("a");
        link.download = `fitnutt-progress-${displayDate}.png`;
        link.href = dataUrl;
        link.click();
        toast({
          title: "Story Card Ready!",
          description: "Image downloaded to your device.",
        });
      }
    } catch (err: any) {
      // If the user cancelled the share (on mobile), common on iPhone, don't show an error
      if (err.name === "AbortError") {
        console.log("Share aborted by user");
        return;
      }

      console.error("Export error:", err);
      toast({
        title: "Export Error",
        description: "Could not generate image. Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsShareOpen(false);
    }
  };

  const handleInviteFriends = () => {
    const text = `Stop overcomplicating your fitness. Use FitNutt to track your fuel and training. 🚀

Join the pack: https://fitnutt.netlify.app

📲 How to install (PWA):
iOS - Share > Add to Homescreen
Android - Browser Menu > Add to Homescreen > Install`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      navigator.share({
        title: "Join FitNutt",
        text,
        // URL removed here as it's already in the 'text' string and many apps append it twice
      });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Invite info copied!" });
    }
    setIsShareOpen(false);
  };

  const { updateSettings, addXP } = useSettings();

  const handleLogoToggle = async () => {
    if (!settings || !user) return;

    const s = settings as any;
    const today = new Date().toISOString().split("T")[0];
    const lastDate = s.last_logo_tap_date;

    let newTaps = (s.logo_taps_count || 0) + 1;
    let newStreak = s.logo_tap_streak || 0;

    // Streak logic
    if (!lastDate) {
      newStreak = 1;
    } else if (lastDate !== today) {
      const last = new Date(lastDate);
      const now = new Date(today);
      const diffDays = Math.floor(
        (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const updates: any = {
      logo_taps_count: newTaps,
      last_logo_tap_date: today,
      logo_tap_streak: newStreak,
    };

    // Trigger 1: 5 Total Taps
    if (newTaps === 5 && !s.logo_easter_egg_triggered) {
      const xpBoost = calculateXpForLevelJump(s.total_xp || 0, 1);
      updates.total_xp = (s.total_xp || 0) + xpBoost;
      updates.logo_easter_egg_triggered = true;
      setEasterEggMessage(
        "LEZZGOO! I love that energy! You've been pumping that logo like a pro. Keep it up, you just jumped a LEVEL! 💪",
      );
    }
    // Trigger 2: 5 Day Streak
    else if (newStreak === 5 && !s.streak_easter_egg_triggered) {
      const xpBoost = calculateXpForLevelJump(s.total_xp || 0, 5);
      updates.total_xp = (s.total_xp || 0) + xpBoost;
      updates.streak_easter_egg_triggered = true;
      setEasterEggMessage(
        "UNREAL CONSISTENCY! 5 days of absolute dedication. You're a genetic freak! I'm jumping you 5 LEVELS ahead. Stay hungry! 🔥",
      );
    }

    updateSettings.mutate(updates);
  };

  return (
    <div className="h-svh overflow-hidden bg-background w-full relative">
      <div className="fixed inset-0 bg-background -z-[50]" />
      {isActive && <TutorialFlow onComplete={completeTutorial} />}
      {/* Glassy Top Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/60 backdrop-blur-xl border-b border-border/40 transition-all gpu-layer">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <AnimatedLogo className="h-8 w-8" onToggle={handleLogoToggle} />
            <span
              className="font-bold text-lg text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              FitNutt
            </span>
          </div>
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 -mr-2 text-muted-foreground hover:text-primary transition-colors"
            title="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Share Progress Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="w-[calc(100%-2.5rem)] max-w-[400px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Share Progress
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <button
              onClick={handleShareCard}
              disabled={isGenerating}
              className="w-full flex items-center justify-between p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-white/20 rounded-xl">
                  {isGenerating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-black uppercase text-[10px] tracking-widest opacity-70">
                    Story Style
                  </p>
                  <p className="font-bold text-sm">Generate Social Card</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 opacity-50" />
            </button>

            <button
              onClick={handleInviteFriends}
              className="w-full flex items-center justify-between p-4 bg-muted/30 rounded-2xl transition-all active:scale-95 border border-muted"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-muted rounded-xl">
                  <Copy className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">
                    Invite Pack
                  </p>
                  <p className="font-bold text-sm text-foreground">
                    Copy Invite Link
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Easter Egg Dialog */}
      <Dialog
        open={!!easterEggMessage}
        onOpenChange={(open) => !open && setEasterEggMessage(null)}
      >
        <DialogContent className="w-[calc(100%-2.5rem)] max-w-[420px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-transparent">
          <div className="bg-background/95 backdrop-blur-2xl p-8 relative">
            <Nut3lla
              message={easterEggMessage}
              position="center"
              isDismissible={false}
              className="w-full"
            />
            <div className="mt-8">
              <Button
                onClick={() => setEasterEggMessage(null)}
                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20"
              >
                LIGHT WEIGHT BABY! 🦾
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Off-screen Card for Generation */}
      <div
        className="fixed left-[-9999px] top-4 overflow-hidden"
        style={{ minWidth: "1080px", minHeight: "1920px" }}
      >
        {(() => {
          const levelInfo = calculateLevel((settings as any)?.total_xp || 0);
          return (
            <ShareProgressCard
              ref={cardRef}
              totals={totals}
              targets={targets}
              pumpLevel={levelInfo.level}
              rank={levelInfo.rankTitle}
              streak={streak}
              userName="Member"
              date={displayDate}
              logoUrl={logoDataUrl || "/fitnutt-logo.png"}
            />
          );
        })()}
      </div>

      {/* Main Content Area - This is where the scroll happens */}
      <main className="h-full overflow-y-auto w-full scroll-smooth">
        <div className="max-w-md mx-auto w-full px-4 pt-20 pb-[calc(8rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </main>

      {/* Global Motivational Tip Engine */}
      <Nut3llaTips />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-background pb-[env(safe-area-inset-bottom)] gpu-layer"
        style={{ filter: "drop-shadow(0 -4px 16px rgba(0, 0, 0, 0.1))" }}
      >
        <div className="max-w-md mx-auto relative grid grid-cols-5 py-2">
          {/* Curved notch extending up from the navbar seamlessly with a deep overlap to seal any sub-pixel gap */}
          <svg
            className="absolute left-0 w-full pointer-events-none z-10"
            style={{ top: "-22px" }}
            height="26"
            viewBox="0 0 100 26"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Solid fill matching the nav background perfectly with deep overlap */}
            <path
              d="M0,26 L0,21 L30,21 C40,21 40,1 50,1 C60,1 60,21 70,21 L100,21 L100,26 Z"
              fill="hsl(var(--background))"
            />
            {/* The sharp top border stroke */}
            <path
              d="M0,21 L30,21 C40,21 40,1 50,1 C60,1 60,21 70,21 L100,21"
              fill="none"
              stroke="hsl(var(--border) / 0.4)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {leftNav.map(({ path, icon: Icon, label, tour }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                data-tour={tour}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* Centre Scan Button */}
          <button
            onClick={() => navigate("/scan")}
            className="flex flex-col items-center justify-end pb-1 relative z-20"
            aria-label="Scan Barcode"
          >
            <div className="-mt-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-all active:scale-95 hover:brightness-110">
              <ScanBarcode className="h-6 w-6" />
            </div>
          </button>

          {rightNav.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            const isSettings = label === "Settings";
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors relative ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {isSettings && isGuest && (
                  <span className="absolute top-1 right-5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
