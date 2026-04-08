export interface LevelInfo {
  level: number;
  xpInLevel: number;
  xpTarget: number;
  progress: number;
  totalXp: number;
  rankTitle: string;
}

const XP_BASE = 500;

export const calculateLevel = (totalXp: number): LevelInfo => {
  let level = 1;
  let xpForNextLevel = XP_BASE;
  let accumulatedXp = 0;

  while (totalXp >= accumulatedXp + xpForNextLevel) {
    accumulatedXp += xpForNextLevel;
    level++;
    xpForNextLevel = level * XP_BASE;
  }

  const xpInLevel = totalXp - accumulatedXp;
  const progress = Math.min(100, (xpInLevel / xpForNextLevel) * 100);

  return {
    level,
    xpInLevel,
    xpTarget: xpForNextLevel,
    progress,
    totalXp,
    rankTitle: getRankTitle(level)
  };
};

export const getRankTitle = (level: number): string => {
  if (level >= 50) return "GOD OF IRON";
  if (level >= 40) return "TITAN";
  if (level >= 30) return "GENETIC FREAK";
  if (level >= 20) return "IRON LEGEND";
  if (level >= 15) return "MASS BUILDER";
  if (level >= 10) return "PUMP APPRENTICE";
  if (level >= 5) return "IRON INITIATE";
  return "GYM NOVICE";
};

export const XP_REWARDS = {
  LOG_FOOD: 20,
  LOG_SUPPLEMENT: 10,
  COMPLETE_EXERCISE: 50,
  DAILY_GOAL_MET: 100
};

export const calculateXpForLevelJump = (currentXp: number, jumps: number): number => {
  const current = calculateLevel(currentXp);
  const targetLevel = current.level + jumps;
  
  let targetTotalXp = 0;
  let level = 1;
  while (level < targetLevel) {
    targetTotalXp += level * XP_BASE;
    level++;
  }
  
  return Math.max(0, targetTotalXp - currentXp);
};
