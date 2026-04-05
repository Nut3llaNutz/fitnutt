import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Nut3llaProps {
  message?: React.ReactNode;
  position?: "center" | "bottom-right";
  onClose?: () => void;
  className?: string;
  isDismissible?: boolean;
  variant?: "default" | "compact";
}

export const Nut3lla = ({ 
  message, 
  position = "center", 
  onClose, 
  className = "",
  isDismissible = true,
  variant = "default"
}: Nut3llaProps) => {
  const [mounted, setMounted] = useState(false);

  // Smooth entrance animation
  useEffect(() => {
    setMounted(true);
  }, []);

  const positionClasses = {
    "center": "flex-col items-center text-center",
    "bottom-right": "flex-row items-end pb-4 pr-4 fixed bottom-[80px] right-0 z-50 transition-all duration-500 ease-out sm:right-4",
  };

  const bubbleClasses = {
    "center": "mb-4 max-w-[85vw] md:max-w-sm",
    "bottom-right": variant === "compact" 
      ? "mr-3 max-w-[200px] mb-8" 
      : "mr-4 max-w-xs origin-bottom-right mb-12",
  };

  const logoSize = variant === "compact" ? "h-16 w-16" : "h-24 w-24";

  return (
    <div 
      className={`flex ${positionClasses[position]} ${className} ${
        position === 'bottom-right' 
          ? (mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-90')
          : 'animate-in fade-in zoom-in-95'
      }`}
    >
      {message && (
        <div 
          className={`relative bg-popover/90 backdrop-blur-xl text-popover-foreground border-2 border-primary/20 
            rounded-2xl shadow-2xl shadow-black/20 ${bubbleClasses[position]} ${
              variant === "compact" ? "p-3" : "p-4"
            }`}
        >
          {isDismissible && onClose && (
            <button 
              onClick={onClose}
              className="absolute -top-3 -right-3 rounded-full bg-destructive text-destructive-foreground p-1 shadow-lg hover:scale-110 active:scale-90 transition-all z-10"
            >
              <X className="h-3 w-3" strokeWidth={3} />
            </button>
          )}
          <div 
            className={`font-semibold tracking-tight leading-relaxed ${
              variant === "compact" ? "text-[11px]" : "text-sm"
            }`} 
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {message}
          </div>
          
          {/* Chat bubble tail pointer */}
          <div 
            className={`absolute w-3 h-3 bg-popover/90 backdrop-blur-xl border-b-2 border-r-2 border-primary/20 transform rotate-45
              ${position === 'center' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : 'bottom-4 -right-1.5'}`} 
          />
        </div>
      )}

      <div className={`relative ${logoSize} shrink-0 pointer-events-none transition-all duration-500 [filter:drop-shadow(0_20px_30px_rgba(0,0,0,0.3))]`}>
        <img
          src="/fitnutt-logo.png"
          alt="Nut3lla Up"
          className={`absolute inset-0 animate-logo-pump-up ${logoSize}`}
        />
        <img
          src="/fitnutt-logo-down.png"
          alt="Nut3lla Down"
          className={`absolute inset-0 animate-logo-pump-down ${logoSize}`}
        />
      </div>
    </div>
  );
};
