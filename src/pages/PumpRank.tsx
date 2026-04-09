import React from "react";
import { useSettings } from "@/hooks/useSettings";
import { calculateLevel, getRankTitle } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Flame, Shield, Award, Crown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Nut3llaPrompt } from "@/components/Nut3llaPrompt";
import { useState, useEffect } from "react";

const RANK_LEVELS = [
  { lv: 1, title: "GYM NOVICE", icon: Star, color: "text-muted-foreground" },
  { lv: 5, title: "IRON INITIATE", icon: Zap, color: "text-blue-400" },
  { lv: 10, title: "PUMP APPRENTICE", icon: Flame, color: "text-orange-400" },
  { lv: 15, title: "MASS BUILDER", icon: Shield, color: "text-purple-400" },
  { lv: 20, title: "IRON LEGEND", icon: Trophy, color: "text-yellow-400" },
  { lv: 30, title: "GENETIC FREAK", icon: Award, color: "text-red-400" },
  { lv: 40, title: "TITAN", icon: Crown, color: "text-indigo-400" },
  { lv: 50, title: "GOD OF IRON", icon: Crown, color: "text-primary" },
];

const PumpRank = () => {
  const { settings } = useSettings();
  const { isGuest } = useAuth();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  useEffect(() => {
    if (isGuest) {
      const timer = setTimeout(() => setShowGuestPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isGuest]);

  // @ts-ignore
  const levelInfo = calculateLevel(settings?.total_xp || 0);

  return (
    <div className="space-y-8 pb-12">
        <div className="flex items-center gap-4">
          <Link to="/" className="h-10 w-10 rounded-xl bg-card border border-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-black italic tracking-tight uppercase">Pump Rank</h1>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform rotate-12">
            <Trophy size={180} />
          </div>
          
          <div className="relative space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-black text-primary tracking-[0.3em] uppercase">Current Standing</span>
              <h2 className="text-5xl font-black italic text-foreground tracking-tighter leading-none">{levelInfo.rankTitle}</h2>
            </div>

            <div className="flex items-end gap-3">
              <span className="text-7xl font-black italic text-primary leading-none">LVL {levelInfo.level}</span>
              <div className="pb-2 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Discipline</p>
                <p className="text-sm font-bold text-foreground">{levelInfo.totalXp} XP EARNED</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-muted-foreground">Next Rank Progress</span>
                <span className="text-primary">{levelInfo.xpInLevel} / {levelInfo.xpTarget} XP</span>
              </div>
              <Progress value={levelInfo.progress} className="h-4 rounded-full bg-primary/10 shadow-inner" />
              <p className="text-[10px] text-center font-bold text-muted-foreground italic">"Intensity builds muscle, but consistency builds legends." — Nut3lla</p>
            </div>
          </div>
        </div>

        {/* XP Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Log Fuel", xp: "+20", desc: "Every meal logged counts." },
            { label: "Check Reps", xp: "+50", desc: "Complete daily playbook tasks." },
            { label: "Hit Targets", xp: "+100", desc: "Reach your daily calorie goal." },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-primary/5 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/20 transition-colors">
              <div>
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">{item.label}</p>
                <p className="text-[10px] font-medium text-muted-foreground/60">{item.desc}</p>
              </div>
              <span className="text-xl font-black italic text-primary group-hover:scale-110 transition-transform">{item.xp} XP</span>
            </div>
          ))}
        </div>

        {/* Rank Ladder */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground px-2">The Rank Ladder</h3>
          <div className="bg-card/50 backdrop-blur-xl border border-primary/5 rounded-[2rem] overflow-hidden">
            {RANK_LEVELS.map((rank, i) => {
              const isCurrent = levelInfo.level >= rank.lv && (i === RANK_LEVELS.length - 1 || levelInfo.level < RANK_LEVELS[i+1].lv);
              const isPassed = levelInfo.level >= rank.lv;

              return (
                <div key={i} className={`flex items-center gap-4 p-5 border-b border-primary/5 last:border-0 ${isCurrent ? "bg-primary/5" : ""}`}>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${isPassed ? "bg-primary/20 " + rank.color : "bg-muted/10 text-muted-foreground/30"}`}>
                    <rank.icon size={24} strokeWidth={isCurrent ? 3 : 2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black uppercase tracking-widest ${isPassed ? rank.color : "text-muted-foreground/30"}`}>{rank.title}</span>
                      {isCurrent && <span className="px-2 py-0.5 rounded-full bg-primary text-[8px] font-black text-primary-foreground uppercase animate-pulse">Active</span>}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground italic">Unlocks at Level {rank.lv}</p>
                  </div>
                  {isPassed && !isCurrent && <Star size={14} className="text-primary/30" />}
                </div>
              );
            })}
          </div>
        </div>
      
      {showGuestPrompt && (
        <div id="rank-guest-popup">
          <Nut3llaPrompt 
            title="Become a Legend"
            description="You can view the ladder as a guest, but to climb it and earn your spot in the GOD OF IRON rank, you must join the Protocol."
            actionText="Start Your Journey"
            onClose={() => setShowGuestPrompt(false)}
          />
        </div>
      )}
    </div>
  );
};

export default PumpRank;
