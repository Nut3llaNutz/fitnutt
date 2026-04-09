import React, { useState, useEffect, useCallback } from "react";
import { Nut3lla } from "./Nut3lla";
import { useSettings } from "@/hooks/useSettings";

const NUT3LLA_TIPS = [
  "Don't skip leg day. Seriously.",
  "Check those macros! We lean bulking, not dirty bulking.",
  "Drink water. Right now. Do it.",
  "Another rep, another step closer to looking like me.",
  "You logged your meals today? Because abs are made in the kitchen.",
  "Creatine in the system? You're basically half-god now.",
  "Rest days are just as important as pull days. Stay frosty.",
  "If the bar ain't bending, you're just pretending. Go log your meals!",
  "Winners train. Losers complain. Which one are you?",
  "Muscle is built in the gym, fed in the kitchen, and sculpted in your sleep.",
  "The only bad workout is the one that didn't happen. Get it done!",
  "Consistency beats intensity. Every. Single. Day.",
  "Stop waiting for Monday. Start today. The clock is ticking.",
  "Excuses don't build delts. Heavy presses do.",
  "Your future self will thank you for that extra set of squats.",
  "Don't let a bad day turn into a bad week. Get back on track!",
  "The harder you work, the luckier you get. Keep grinding.",
  "Motivation gets you started. Discipline keeps you going.",
  "Suffer the pain of discipline or suffer the pain of regret.",
  "Your mind will quit a thousand times before your body does. Push through.",
  "Focus on progress, not perfection. One meal at a time.",
  "The gym is my therapy. The results are just a bonus.",
  "Great things never came from comfort zones. Lift heavy!",
  "Be the person you've always wanted to look like. Log your food!",
  "No one ever drowned in sweat. Push harder!",
  "Small wins every day lead to massive results every year.",
  "Focus on the fuel. Treat your body like a Ferrari, not a trash can.",
  "Sweat is just your fat crying. Make it sob!",
  "The only person you should try to be better than is the person you were yesterday."
];

// Tips pop up every 1 minute
const TIP_INTERVAL = 60000;

export const Nut3llaTips = () => {
  const { settings } = useSettings();
  const [activeTip, setActiveTip] = useState<string | null>(null);
  const [hasDialog, setHasDialog] = useState(false);
  const lastIndex = React.useRef<number>(-1);

  // Check for active dialogs to shift position
  useEffect(() => {
    const checkDialog = () => {
      setHasDialog(!!document.querySelector('[role="dialog"]'));
    };
    const interval = setInterval(checkDialog, 500);
    return () => clearInterval(interval);
  }, []);

  const popRandomTip = useCallback(() => {
    // Suppress tips if the tutorial overlay or rank onboarding is showing
    if (document.getElementById("tutorial-overlay") || document.getElementById("rank-guest-popup")) return;

    let index;
    do {
      index = Math.floor(Math.random() * NUT3LLA_TIPS.length);
    } while (index === lastIndex.current);

    lastIndex.current = index;
    setActiveTip(NUT3LLA_TIPS[index]);
    
    // Auto-dismiss the bubble after 8 seconds
    setTimeout(() => {
      setActiveTip(null);
    }, 8000);
  }, []);

  useEffect(() => {
    // Only run if tips are enabled, or null (default true)
    if (settings && settings.nut3lla_tips_enabled !== false) {
      let timeoutId: NodeJS.Timeout;

      const scheduleNextTip = () => {
        timeoutId = setTimeout(() => {
          popRandomTip();
          scheduleNextTip(); // Reschedule infinitely
        }, TIP_INTERVAL);
      };

      scheduleNextTip();

      return () => clearTimeout(timeoutId);
    }
  }, [settings, popRandomTip]);

  if (!activeTip) return null;

  return (
    <Nut3lla 
      message={activeTip}
      position="bottom-right"
      variant="compact"
      onClose={() => setActiveTip(null)}
      className={`z-[200] transition-transform duration-500 ${hasDialog ? "translate-y-24" : "translate-y-0"}`}
    />
  );
};
