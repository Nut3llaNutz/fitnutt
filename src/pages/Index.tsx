import { useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useMealEntries } from "@/hooks/useMealEntries";
import { useSettings, Supplement } from "@/hooks/useSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";

const MacroRing = ({ label, current, target, color }: { label: string; current: number; target: number; color: string }) => {
  const pct = Math.min((current / target) * 100, 100);
  const circumference = 2 * Math.PI * 36;
  const dashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashoffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-foreground">{Math.round(current)}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
};

const mealTypeLabels: Record<string, string> = {
  breakfast: "🌅 Breakfast",
  lunch: "☀️ Lunch",
  dinner: "🌙 Dinner",
  snack: "🍿 Snack",
};

const Index = () => {
  const { log, isLoading: logLoading, toggleCustomSupplement } = useDailyLog();
  const { entries, isLoading: entriesLoading } = useMealEntries(log?.id);
  const { settings, isLoading: settingsLoading } = useSettings();

  // Get the enabled supplements list and today's taken status
  const enabledSupplements = ((settings?.supplements as unknown as Supplement[]) || []).filter((s) => s.enabled);
  const supplementsTaken = ((log as any)?.supplements_taken as Record<string, boolean>) || {};

  // Client-side notification scheduling for supplement reminders
  const notifScheduledRef = useRef(false);
  useEffect(() => {
    if (!settings?.notification_time || Notification.permission !== "granted" || enabledSupplements.length === 0) return;
    if (notifScheduledRef.current) return;

    const [h, m] = settings.notification_time.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1); // schedule for tomorrow if already past

    const msUntil = target.getTime() - now.getTime();
    notifScheduledRef.current = true;

    const fireNotification = () => {
      const untaken = enabledSupplements.filter((s) => !supplementsTaken[s.id]);
      if (untaken.length === 0) return;
      const names = untaken.map((s) => s.name).join(", ");
      new Notification("FitNutt — Supplement Reminder 💊", {
        body: `Don't forget: ${names}`,
        icon: "/fitnutt-logo.png",
      });
    };

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      fireNotification();
      // Hourly follow-ups
      intervalId = setInterval(fireNotification, 60 * 60 * 1000);
    }, msUntil);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      notifScheduledRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.notification_time, settings?.supplements]);

  const totals = entries.reduce(
    (acc, entry) => {
      const food = (entry as any).foods;
      if (!food) return acc;
      return {
        calories: acc.calories + food.calories * entry.quantity,
        protein: acc.protein + food.protein * entry.quantity,
        carbs: acc.carbs + food.carbs * entry.quantity,
        fats: acc.fats + food.fats * entry.quantity,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const targets = {
    calories: settings?.calorie_target || 2750,
    protein: settings?.protein_target || 100,
    carbs: settings?.carb_target || 400,
    fats: settings?.fat_target || 70,
  };

  if (logLoading || settingsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex justify-around">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-20 rounded-full" />)}
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

        {/* Macro Rings */}
        <div className="flex justify-around">
          <MacroRing label="Calories" current={totals.calories} target={targets.calories} color="hsl(var(--primary))" />
          <MacroRing label="Protein" current={totals.protein} target={targets.protein} color="hsl(18, 82%, 41%)" />
          <MacroRing label="Carbs" current={totals.carbs} target={targets.carbs} color="hsl(220, 13%, 38%)" />
          <MacroRing label="Fats" current={totals.fats} target={targets.fats} color="hsl(0, 0%, 60%)" />
        </div>

        {/* Dynamic Supplements — only enabled ones show */}
        {enabledSupplements.length > 0 && (
          <div className="bg-card rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide">Supplements</h2>
            {enabledSupplements.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-card-foreground">{s.name}</span>
                <button
                  onClick={() => toggleCustomSupplement.mutate(s.id)}
                  className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-out ${
                    supplementsTaken[s.id]
                      ? "bg-primary border-primary text-primary-foreground scale-110"
                      : "bg-transparent border-input text-transparent scale-100"
                  }`}
                >
                  <Check strokeWidth={3.5} className={`h-4 w-4 transition-transform duration-300 ${supplementsTaken[s.id] ? "scale-100" : "scale-0"}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Daily Timeline */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Today's Meals</h2>
          {entriesLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No meals logged yet. Head to the Diary to add some!</p>
          ) : (
            Object.entries(
              entries.reduce((acc: Record<string, typeof entries>, e) => {
                (acc[e.meal_type] = acc[e.meal_type] || []).push(e);
                return acc;
              }, {})
            ).map(([type, items]) => (
              <div key={type} className="bg-card rounded-xl p-3">
                <h3 className="text-xs font-semibold text-card-foreground mb-2">{mealTypeLabels[type] || type}</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-card-foreground">
                    <span>{(item as any).foods?.name}</span>
                    <span className="text-muted-foreground">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
