import React, { forwardRef } from "react";
import { Sunrise, Sun, Moon, Coffee, Trophy, Flame } from "lucide-react";

interface ShareProgressCardProps {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  pumpLevel: number;
  rank: string;
  streak: number;
  userName: string;
  date?: string;
  logoUrl?: string;
}

export const ShareProgressCard = forwardRef<HTMLDivElement, ShareProgressCardProps>(
  ({ totals, targets, pumpLevel, rank, streak, userName, date, logoUrl }, ref) => {
    const today = (date ? new Date(date + "T12:00:00") : new Date()).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const MacroCircle = ({ label, current, target, color, size = 300 }: any) => {
      const pct = Math.min((current / target) * 100, 100);
      const radius = size * 0.45;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (pct / 100) * circumference;

      return (
        <div className="flex flex-col items-center gap-6">
          <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 w-full h-full">
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={size * 0.08}
              />
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={current >= target ? "#22c55e" : color} strokeWidth={size * 0.08}
                strokeLinecap="round" strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black text-white">{Math.round(current)}</span>
              <span className="text-2xl font-bold text-white/40 uppercase tracking-widest">{label === "Calories" ? "KCAL" : "G"}</span>
            </div>
          </div>
          <span className="text-3xl font-black uppercase tracking-[0.3em] text-white/60">{label}</span>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className="relative bg-black flex flex-col items-center justify-between p-20 overflow-hidden"
        style={{
          width: "1080px",
          height: "1920px",
          fontFamily: "'Space Grotesk', sans-serif",
          background: "linear-gradient(180deg, #000 0%, #111 100%)",
        }}
      >
        {/* Background Accents */}
        <div className="absolute top-[-200px] left-[-200px] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[200px]" />

        {/* Top Branding */}
        <div className="w-full flex justify-between items-start z-10 gap-12">
          <div className="flex items-center gap-8 min-w-0">
            <img src={logoUrl || "/fitnutt-logo.png"} alt="Logo" className="h-[100px] w-auto shadow-2xl flex-shrink-0" />
            <div className="space-y-2 min-w-0">
              <h1 className="text-7xl font-black italic tracking-tighter text-white whitespace-nowrap">
                FIT<span className="text-primary">NUTT</span>
              </h1>
              <p className="text-2xl font-black uppercase tracking-[0.4em] text-white/40 whitespace-nowrap">{today}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-[28px] backdrop-blur-xl flex-shrink-0 self-center">
            <span className="text-2xl font-black text-white tracking-[0.2em] uppercase whitespace-nowrap">The Daily Grind</span>
          </div>
        </div>

        {/* Main Stats Area */}
        <div className="w-full space-y-24 z-10 flex flex-col items-center">
          <MacroCircle 
            label="Calories" current={totals.calories} target={targets.calories} 
            color="#EA5C1F" size={550} 
          />

          <div className="grid grid-cols-3 w-full gap-8">
            <MacroCircle label="Protein" current={totals.protein} target={targets.protein} color="#B45309" size={280} />
            <MacroCircle label="Carbs" current={totals.carbs} target={targets.carbs} color="#4B5563" size={280} />
            <MacroCircle label="Fats" current={totals.fats} target={targets.fats} color="#9CA3AF" size={280} />
          </div>
        </div>

        {/* Level Card */}
        <div className="w-full bg-white/5 border border-white/10 p-12 rounded-[50px] backdrop-blur-2xl z-10 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="h-28 w-28 bg-primary rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(234,92,31,0.5)]">
              <Trophy className="text-white" size={60} strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-black text-white uppercase italic">{rank}</h2>
              <p className="text-2xl font-bold text-white/40 uppercase tracking-[0.3em]">Pump Level {pumpLevel}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4 text-primary">
              <Flame size={40} fill="currentColor" />
              <span className="text-6xl font-black">{streak}</span>
            </div>
            <span className="text-xl font-bold text-white/30 uppercase tracking-widest">Day Streak</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center z-10 opacity-30">
          <p className="text-2xl font-black uppercase tracking-[0.8em] text-white">FITNUTT.NETLIFY.APP</p>
        </div>
      </div>
    );
  }
);

ShareProgressCard.displayName = "ShareProgressCard";
