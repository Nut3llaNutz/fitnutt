import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Nut3llaProps {
  message?: React.ReactNode;
  position?: "center" | "bottom-right";
  onClose?: () => void;
  className?: string;
  isDismissible?: boolean;
}

export const Nut3lla = ({ 
  message, 
  position = "center", 
  onClose, 
  className = "",
  isDismissible = true 
}: Nut3llaProps) => {
  const [mounted, setMounted] = useState(false);

  // Smooth entrance animation
  useEffect(() => {
    setMounted(true);
  }, []);

  const positionClasses = {
    "center": "flex-col items-center text-center",
    "bottom-right": "flex-row items-end pb-4 pr-4 fixed bottom-0 right-0 z-50 transition-all duration-500 ease-out",
  };

  const bubbleClasses = {
    "center": "mb-4 max-w-[85vw] md:max-w-sm",
    "bottom-right": "mr-4 max-w-xs origin-bottom-right mb-12",
  };

  return (
    <div 
      className={`flex ${positionClasses[position]} ${className} ${
        position === 'bottom-right' 
          ? (mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0')
          : 'animate-in fade-in zoom-in-95'
      }`}
    >
      {message && (
        <div 
          className={`relative bg-popover text-popover-foreground border-2 border-primary/20 
            rounded-2xl p-4 shadow-xl shadow-primary/10 ${bubbleClasses[position]}`}
        >
          {isDismissible && onClose && (
            <button 
              onClick={onClose}
              className="absolute -top-3 -right-3 rounded-full bg-destructive text-destructive-foreground p-1 shadow-md hover:scale-110 transition-transform"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <div className="font-medium text-sm leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {message}
          </div>
          
          {/* Chat bubble tail pointer */}
          <div 
            className={`absolute w-3 h-3 bg-popover border-b-2 border-r-2 border-primary/20 transform rotate-45
              ${position === 'center' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : 'bottom-4 -right-1.5'}`} 
          />
        </div>
      )}

      <div className="relative h-24 w-24 shrink-0 pointer-events-none">
        <img
          src="/fitnutt-logo.png"
          alt="Nut3lla Up"
          className="absolute inset-0 animate-logo-pump-up h-24 w-24"
        />
        <img
          src="/fitnutt-logo-down.png"
          alt="Nut3lla Down"
          className="absolute inset-0 animate-logo-pump-down h-24 w-24"
        />
      </div>
    </div>
  );
};
