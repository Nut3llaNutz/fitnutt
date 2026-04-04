import React, { useState, useEffect, useCallback } from "react";
import { Nut3lla } from "./Nut3lla";
import { useSettings } from "@/hooks/useSettings";

const NUT3LLA_TIPS = [
  "Don't skip leg day. Seriously.",
  "Check those macros! We lean bulking, not dirty bulking.",
  "Drink water. Right now. Do it.",
  "Another rep, another step closer to looking like me.",
  "You logged your meals today? Because Abs are made in the kitchen.",
  "Creatine in the system? You're basically half-god now.",
  "Rest days are just as important as pull days. Stay frosty.",
  "If the bar ain't bending, you're just pretending. Go log your meals!"
];

// Random interval between 2 to 5 minutes
const getRandomInterval = () => Math.floor(Math.random() * (300000 - 120000) + 120000);

export const Nut3llaTips = () => {
  const { settings } = useSettings();
  const [activeTip, setActiveTip] = useState<string | null>(null);

  const popRandomTip = useCallback(() => {
    // Suppress tips if the tutorial overlay is currently showing
    if (document.getElementById("tutorial-overlay")) return;

    const randomTip = NUT3LLA_TIPS[Math.floor(Math.random() * NUT3LLA_TIPS.length)];
    setActiveTip(randomTip);
    
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
        }, getRandomInterval());
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
      onClose={() => setActiveTip(null)}
      className="z-[200]" // ensure it's atop everything mostly
    />
  );
};
