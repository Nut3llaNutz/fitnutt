import { useEffect, useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { TutorialFlow } from "@/components/TutorialFlow";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useMealEntries } from "@/hooks/useMealEntries";
import { useSettings, Supplement } from "@/hooks/useSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Sunrise, Sun, Moon, Coffee } from "lucide-react";
import { PumpLevelCard } from "@/components/PumpLevelCard";

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
            stroke={current >= target ? "#22c55e" : color} strokeWidth="6" strokeLinecap="round"
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

const mealTypeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  breakfast: { label: "Breakfast", icon: Sunrise },
  lunch: { label: "Lunch", icon: Sun },
  dinner: { label: "Dinner", icon: Moon },
  snack: { label: "Snacks", icon: Coffee },
};

const Index = () => {
  const { log, isLoading: logLoading, toggleCustomSupplement } = useDailyLog();
  const { entries, isLoading: entriesLoading } = useMealEntries(log?.id);
  const { settings, isLoading: settingsLoading } = useSettings();

  const enabledSupplements = ((settings?.supplements as unknown as Supplement[]) || []).filter((s) => s.enabled);
  const supplementsTaken = ((log as any)?.supplements_taken as Record<string, boolean>) || {};

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

        <div className="flex justify-around" data-tour="macro-rings">
          <MacroRing label="Calories" current={totals.calories} target={targets.calories} color="hsl(var(--primary))" />
          <MacroRing label="Protein" current={totals.protein} target={targets.protein} color="hsl(18, 82%, 41%)" />
          <MacroRing label="Carbs" current={totals.carbs} target={targets.carbs} color="hsl(220, 13%, 38%)" />
          <MacroRing label="Fats" current={totals.fats} target={targets.fats} color="hsl(0, 0%, 60%)" />
        </div>

        <div className="px-1">
          <PumpLevelCard />
        </div>

        {enabledSupplements.length > 0 && (
          <div className="bg-card rounded-xl p-4 space-y-3 shadow-md border border-primary/5">
            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Supplements</h2>
            {enabledSupplements.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-card-foreground font-medium">{s.name}</span>
                <button
                  onClick={() => toggleCustomSupplement.mutate(s.id)}
                  className={`h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ease-out ${
                    supplementsTaken[s.id]
                      ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20"
                      : "bg-muted/30 border-muted-foreground/20 text-transparent scale-100"
                  }`}
                >
                  <Check strokeWidth={3.5} className={`h-4 w-4 transition-transform duration-300 ${supplementsTaken[s.id] ? "scale-100" : "scale-0"}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-[0.2em] px-1">Fuel Timeline</h2>
          {entriesLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : entries.length === 0 ? (
            <div className="bg-card/50 backdrop-blur-sm border border-dashed border-primary/20 rounded-2xl p-6 text-center">
              <p className="text-muted-foreground text-sm font-medium italic">No fuel logged yet. Time to eat! 🥩</p>
            </div>
          ) : (
            Object.entries(
              entries.reduce((acc: Record<string, typeof entries>, e) => {
                (acc[e.meal_type] = acc[e.meal_type] || []).push(e);
                return acc;
              }, {})
            ).map(([type, items]) => {
              const config = mealTypeConfig[type] || { label: type, icon: Coffee };
              const Icon = config.icon;
              
              return (
                <div key={type} className="bg-card rounded-2xl p-4 shadow-sm border border-primary/5 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="h-4 w-4" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">{config.label}</h3>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm border-l-2 border-primary/20 pl-3">
                        <span className="text-foreground font-medium">{(item as any).foods?.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">×{item.quantity}</span>
                          <span className="text-[11px] font-black italic text-primary/70">{Math.round(((item as any).foods?.calories || 0) * item.quantity)} KCAL</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
