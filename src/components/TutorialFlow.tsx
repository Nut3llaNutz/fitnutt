import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Nut3lla } from "./Nut3lla";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";
import { useTutorial } from "@/contexts/TutorialContext";
import { calculateMacros } from "@/lib/calories";

// ─── Chapter definitions ─────────────────────────────────────────────────────
interface Chapter {
  route: string;
  target?: string; // CSS selector for spotlight; undefined = no spotlight (center dim)
  title: string;
  message: string;
  nextLabel?: string;
}

const CHAPTERS: Chapter[] = [
  {
    route: "/",
    title: "YO! I'm Nut3lla. 💪",
    message:
      "Welcome to FitNutt — your personal shred coach. I literally never stop pumping iron. Let me show you around so you know exactly where everything lives.",
    nextLabel: "START TOUR",
  },
  {
    route: "/",
    target: '[data-tour="macro-rings"]',
    title: "Your Daily Rings 🔥",
    message:
      "These are your macro rings — Calories, Protein, Carbs, and Fats. Tap any ring to see a breakdown of exactly which foods are contributing.",
  },
  {
    route: "/",
    target: '[data-tour="meal-log"]',
    title: "The Diary 🍽️",
    message:
      "Your food diary. Breakfast, lunch, dinner, snacks — every meal logged here feeds into those rings in real time.",
  },
  {
    route: "/",
    target: '[data-tour="streak-btn"]',
    title: "Your Streak 🔥",
    message:
      "See that flame? That's your consistency streak. Log food or tick off supplements every day to keep it burning. Let it die and Nut3lla gets angry.",
  },
  {
    route: "/foods",
    target: '[data-tour="food-search"]',
    title: "The Food Library 🥗",
    message:
      "Search through 200+ preset foods — Chicken Tikka to Maggi. Add your own custom foods and track by any unit.",
  },
  {
    route: "/foods",
    target: '[data-tour="veg-filter"]',
    title: "Veg Mode 🌱",
    message:
      "Toggle this to filter only vegetarian options. FitNutt respects the diet — veg, non-veg, whatever you're about.",
  },
  {
    route: "/schedule",
    target: '[data-tour="schedule-workouts"]',
    title: "The Playbook 📋",
    message:
      "Plan your weekly workout splits and meal strategy. Structure is what separates the serious from the mediocre.",
  },
  {
    route: "/pump-rank",
    target: '[data-tour="rank-hero"]',
    title: "Pump Rank 🏆",
    message:
      "Every meal logged, every supplement ticked, every calorie target hit — earns XP. Level up from Gym Novice to GOD OF IRON.",
  },
  {
    // Final protocol form — no spotlight
    route: "/",
    title: "Your Protocol ⚡",
    message:
      "Tour done. Give me your stats and I'll calculate your exact calorie and macro targets in seconds.",
    nextLabel: "LET'S GO",
  },
];

const PROTOCOL_FORM_CHAPTER = CHAPTERS.length - 1;

// ─── Spotlight hook ───────────────────────────────────────────────────────────
const useSpotlight = (selector?: string) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>();
  const attemptsRef = useRef(0);

  useEffect(() => {
    setRect(null);
    attemptsRef.current = 0;
    if (!selector) return;

    const find = () => {
      const el = document.querySelector(selector);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else if (attemptsRef.current < 60) {
        attemptsRef.current++;
        rafRef.current = requestAnimationFrame(find);
      }
    };

    // Small delay so navigation/render settles first
    const t = setTimeout(() => {
      rafRef.current = requestAnimationFrame(find);
    }, 300);

    return () => {
      clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [selector]);

  return rect;
};

// ─── TutorialInvite — persistent guest bubble ─────────────────────────────────
export const TutorialInvite = () => {
  const { startTutorial, dismissInvite } = useTutorial();
  const [visible, setVisible] = useState(false);

  // Only appear after the splash screen has fully cleared (~2500ms + 500ms fade)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3200);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-[6.5rem] right-3 z-[180] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative flex items-end gap-2">
        {/* Speech bubble */}
        <div className="relative bg-popover/95 backdrop-blur-xl border-2 border-primary/20 rounded-2xl shadow-2xl shadow-black/30 p-3 w-[200px]">
          {/* X button on bubble corner */}
          <button
            onClick={dismissInvite}
            className="absolute -top-2.5 -right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-colors shadow-md"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="text-xs font-bold leading-snug text-popover-foreground mb-2">
            New here? Tap me for a quick tour! 👆
          </p>
          <Button
            size="sm"
            onClick={startTutorial}
            className="w-full font-black text-[10px] tracking-widest h-7 shadow-md shadow-primary/20"
          >
            START TOUR
          </Button>
          {/* Bubble tail pointing right toward logo */}
          <div className="absolute bottom-4 -right-[7px] w-3 h-3 bg-popover/95 border-r-2 border-b-2 border-primary/20 rotate-[-45deg]" />
        </div>

        {/* Small logo */}
        <div className="relative h-14 w-14 shrink-0 [filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.3))] pointer-events-none">
          <img
            src="/fitnutt-logo.png"
            alt=""
            className="absolute inset-0 h-14 w-14 animate-logo-pump-up"
          />
          <img
            src="/fitnutt-logo-down.png"
            alt=""
            className="absolute inset-0 h-14 w-14 animate-logo-pump-down"
          />
        </div>
      </div>
    </div>
  );
};

// ─── TutorialOverlay — the running tour ──────────────────────────────────────
export const TutorialOverlay = () => {
  const { chapter, nextChapter, completeTutorial } = useTutorial();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const currentChapter = CHAPTERS[chapter];
  const isLast = chapter === PROTOCOL_FORM_CHAPTER;

  // Spotlight — only look for target if not the last chapter
  const spotlightRect = useSpotlight(
    isLast ? undefined : currentChapter?.target,
  );

  // Navigate when chapter changes
  useEffect(() => {
    if (!currentChapter) return;
    navigate(currentChapter.route);
  }, [chapter]); // eslint-disable-line

  // Protocol form state
  const [weightKg, setWeightKg] = useState("75");
  const [heightCm, setHeightCm] = useState("175");
  const [age, setAge] = useState("22");
  const [gender, setGender] = useState("male");
  const [goal, setGoal] = useState("bulk");
  const [activity, setActivity] = useState("1.375");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (chapter < CHAPTERS.length - 1) nextChapter();
  };

  const handleSkip = () => completeTutorial();

  const handleSaveProtocol = async () => {
    if (!weightKg || !heightCm || !age) {
      toast({ title: "Fill in your stats first!", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({
        title: "Session Expired",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const targets = calculateMacros({
        gender,
        weight_kg: parseFloat(weightKg),
        height_cm: parseFloat(heightCm),
        age: parseInt(age),
        activity_level: parseFloat(activity),
        goal,
      });

      await supabase
        .from("user_settings")
        .update({
          calorie_target: targets.calories,
          protein_target: targets.protein,
          carb_target: targets.carbs,
          fat_target: targets.fats,
          gender,
          weight_kg: parseFloat(weightKg),
          height_cm: parseFloat(heightCm),
          age: parseInt(age),
          activity_level: parseFloat(activity),
          goal,
          nut3lla_tips_enabled: true,
          tutorial_completed: true,
        })
        .eq("user_id", user.id);

      toast({
        title: "Protocol locked in! 🔒",
        description: "Macro targets set.",
      });
      completeTutorial();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentChapter) return null;

  return (
    <div
      id="tutorial-overlay"
      className="fixed inset-0 z-[150] flex flex-col overflow-hidden pointer-events-none"
    >
      {/* ── Dimmed backdrop with spotlight cutout ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <filter id="tut-glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <mask id="tut-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - 10}
                y={spotlightRect.top - 10}
                width={spotlightRect.width + 20}
                height={spotlightRect.height + 20}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.78)"
          mask="url(#tut-mask)"
        />
        {/* Glowing border on spotlight */}
        {spotlightRect && (
          <rect
            x={spotlightRect.left - 10}
            y={spotlightRect.top - 10}
            width={spotlightRect.width + 20}
            height={spotlightRect.height + 20}
            rx="14"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            opacity="0.8"
            className="animate-pulse"
            style={{ filter: "url(#tut-glow)" }}
          />
        )}
      </svg>

      {/* ── Skip button — top right, above the overlay ── */}
      <div className="relative z-[161] flex justify-end px-5 pt-[4.8rem] pointer-events-auto">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all text-[11px] font-bold uppercase tracking-widest backdrop-blur-sm"
        >
          <X className="h-3 w-3" /> Skip Tour
        </button>
      </div>

      {/* ── Progress dots ── */}
      <div className="relative z-[161] flex justify-center gap-1.5 mt-2 pointer-events-none">
        {CHAPTERS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === chapter
                ? "w-5 bg-primary"
                : i < chapter
                  ? "w-1.5 bg-primary/50"
                  : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* ── Smart panel — flips to top if spotlight is in bottom half ── */}
      {(() => {
        const targetInBottomHalf = spotlightRect
          ? spotlightRect.top + spotlightRect.height / 2 >
            window.innerHeight * 0.5
          : false;
        const panelAtTop = targetInBottomHalf && !isLast;

        return (
          <div
            className={`absolute z-[160] w-full pointer-events-auto px-4 transition-all duration-300 ${
              panelAtTop
                ? "top-[8rem]" // below the skip/dots row
                : "bottom-[5.5rem]" // above nav bar
            }`}
          >
            {!isLast ? (
              /* ── Tour chapter bubble ── */
              <div className="max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Nut3lla
                  message={
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                          {currentChapter.title}
                        </p>
                        <p className="text-sm font-semibold leading-relaxed">
                          {currentChapter.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleNext}
                          size="sm"
                          className="flex-1 font-black h-9 text-xs tracking-widest shadow-lg shadow-primary/20"
                        >
                          {currentChapter.nextLabel || "NEXT ›"}
                        </Button>
                      </div>
                    </div>
                  }
                  position="center"
                  isDismissible={false}
                  className="w-full drop-shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                />
              </div>
            ) : (
              /* ── Protocol form (last chapter) ── */
              <div className="max-w-sm mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Nut3lla
                  message={
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                        {currentChapter.title}
                      </p>
                      <p className="text-sm font-semibold leading-relaxed">
                        {currentChapter.message}
                      </p>
                    </div>
                  }
                  position="center"
                  isDismissible={false}
                  className="w-full"
                />

                <div className="bg-card/95 backdrop-blur-xl border-2 border-primary/20 p-5 rounded-[1.75rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[55vh]">
                  <div className="space-y-3">
                    {/* Gender + Goal */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: "Gender",
                          value: gender,
                          onChange: setGender,
                          options: [
                            { v: "male", l: "Male" },
                            { v: "female", l: "Female" },
                          ],
                        },
                        {
                          label: "Goal",
                          value: goal,
                          onChange: setGoal,
                          options: [
                            { v: "bulk", l: "Bulk" },
                            { v: "cut", l: "Cut" },
                            { v: "maintain", l: "Maintain" },
                          ],
                        },
                      ].map(({ label, value, onChange, options }) => (
                        <div key={label} className="space-y-1">
                          <Label className="text-[9px] uppercase font-black text-muted-foreground/70">
                            {label}
                          </Label>
                          <Select value={value} onValueChange={onChange}>
                            <SelectTrigger className="h-9 bg-background/50 border-border/50 rounded-xl text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                              {options.map((o) => (
                                <SelectItem key={o.v} value={o.v}>
                                  {o.l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {/* Weight, Height, Age */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Weight",
                          value: weightKg,
                          onChange: setWeightKg,
                          unit: "kg",
                        },
                        {
                          label: "Height",
                          value: heightCm,
                          onChange: setHeightCm,
                          unit: "cm",
                        },
                        {
                          label: "Age",
                          value: age,
                          onChange: setAge,
                          unit: "yr",
                        },
                      ].map(({ label, value, onChange, unit }) => (
                        <div key={label} className="space-y-1">
                          <Label className="text-[9px] uppercase font-black text-muted-foreground/70">
                            {label}
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={value || ""}
                              onChange={(e) => onChange(e.target.value)}
                              className="h-9 bg-background/50 border-border/50 rounded-xl pr-6 text-sm"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground uppercase">
                              {unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Activity */}
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-black text-muted-foreground/70">
                        Activity Level
                      </Label>
                      <Select value={activity} onValueChange={setActivity}>
                        <SelectTrigger className="h-9 bg-background/50 border-border/50 rounded-xl text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                          <SelectItem value="1.2">
                            Sedentary (Desk job)
                          </SelectItem>
                          <SelectItem value="1.375">
                            Lightly Active (Gym 1–3x)
                          </SelectItem>
                          <SelectItem value="1.55">
                            Moderately Active (Gym 3–5x)
                          </SelectItem>
                          <SelectItem value="1.725">
                            Very Active (Gym 6–7x)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* CTAs */}
                    <div className="space-y-2 pt-1">
                      <Button
                        onClick={handleSaveProtocol}
                        disabled={isSubmitting}
                        className="w-full h-11 font-black text-sm tracking-widest rounded-xl shadow-xl shadow-primary/30"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          "SAVE PROTOCOL"
                        )}
                      </Button>
                      <button
                        onClick={handleSkip}
                        className="w-full text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors pt-1"
                      >
                        Skip for now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

// ─── Legacy export ────────────────────────────────────────────────────────────
export const TutorialFlow = ({ onComplete }: { onComplete: () => void }) => (
  <TutorialOverlay />
);
