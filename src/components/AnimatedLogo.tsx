import { useState } from "react";

export const AnimatedLogo = ({ className = "h-8 w-8" }: { className?: string }) => {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 2500);
  };

  if (!animating) {
    return (
      <img
        src="/fitnutt-logo.png"
        alt="FitNutt Logo"
        className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onClick={handleClick}
      />
    );
  }

  return (
    <div className={`relative cursor-pointer ${className}`} onClick={handleClick}>
      <img
        src="/fitnutt-logo.png"
        alt="FitNutt Up"
        className={`absolute inset-0 animate-logo-pump-up ${className}`}
      />
      <img
        src="/fitnutt-logo-down.png"
        alt="FitNutt Down"
        className={`absolute inset-0 animate-logo-pump-down ${className}`}
      />
    </div>
  );
};
