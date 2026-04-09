import React from "react";
import { useSettings } from "@/hooks/useSettings";
import { calculateLevel } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Trophy, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export const PumpLevelCard = ({ variant = "default" }: { variant?: "default" | "compact" }) => {
  const { settings } = useSettings();
  
  // @ts-ignore - total_xp exists after migration
  const levelInfo = calculateLevel(settings?.total_xp || 0);

  if (variant === "compact") {
    return (
      <Link to="/pump-rank" className="group flex items-center gap-3 bg-card/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-3 hover:bg-primary/5 transition-all active:scale-95 shadow-sm">
        <div className="flex h-10 w-fit px-2 items-center justify-center rounded-xl bg-primary/20 text-primary group-hover:scale-110 transition-transform">
          <span className="text-xs font-black italic tracking-tighter whitespace-nowrap pr-0.5">Lvl {levelInfo.level}</span>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">{levelInfo.rankTitle}</span>
            <span className="text-[9px] font-bold text-muted-foreground">{Math.round(levelInfo.progress)}%</span>
          </div>
          <Progress value={levelInfo.progress} className="h-1.5" />
        </div>
      </Link>
    );
  }

  return (
    <Link to="/pump-rank" className="block group">
      <div className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-2 border-primary/10 rounded-[2rem] p-5 shadow-xl transition-all hover:border-primary/30 hover:shadow-primary/5 active:scale-[0.98]">
        {/* Background Accent */}
        <div className="absolute -right-4 -top-4 text-primary/5 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform">
          <Trophy size={140} />
        </div>

        <div className="relative flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-primary tracking-[0.2em] uppercase">{levelInfo.rankTitle}</span>
            </div>
            <h3 className="text-2xl font-black italic text-foreground tracking-tight">PUMP LEVEL {levelInfo.level}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-primary-foreground transform group-hover:rotate-12 transition-transform">
            <Trophy size={20} strokeWidth={3} />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            <span>Progress to Next Rank</span>
            <span className="text-primary">{levelInfo.xpInLevel} / {levelInfo.xpTarget} XP</span>
          </div>
          <Progress value={levelInfo.progress} className="h-3 rounded-full bg-primary/10" />
        </div>

        <div className="mt-4 flex items-center justify-center text-[9px] font-black uppercase text-primary/50 tracking-[0.3em] group-hover:text-primary/100 transition-colors">
          View Rank Details <ChevronRight size={10} className="ml-1" />
        </div>
      </div>
    </Link>
  );
};
