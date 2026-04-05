import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Apple,
  Dumbbell,
  Settings,
  ScanBarcode,
  CalendarDays,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { AnimatedLogo } from "./AnimatedLogo";
import { Nut3llaTips } from "./Nut3llaTips";
import { TutorialFlow } from "./TutorialFlow";
import { useTutorial } from "@/contexts/TutorialContext";

const leftNav = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/log", icon: BookOpen, label: "Diary" },
];

const rightNav = [
  { path: "/foods", icon: Apple, label: "Foods" },
  { path: "/profile", icon: Settings, label: "Settings" },
];

export const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { isActive, completeTutorial } = useTutorial();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isActive && <TutorialFlow onComplete={completeTutorial} />}
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AnimatedLogo className="h-8 w-8" />
          <span
            className="font-bold text-lg text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            FitNutt
          </span>
        </div>
        <Link 
          to="/schedule" 
          className="p-2 -mr-2 text-muted-foreground hover:text-primary transition-colors"
          title="Schedule"
        >
          <CalendarDays className="h-5 w-5" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Global Motivational Tip Engine */}
      <Nut3llaTips />

      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-background pb-[env(safe-area-inset-bottom)]"
        style={{ filter: "drop-shadow(0 -4px 16px rgba(0, 0, 0, 0.1))" }}
      >
        <div className="max-w-lg mx-auto relative grid grid-cols-5 py-2">
          {/* Curved notch extending up from the navbar seamlessly */}
          <svg
            className="absolute left-0 w-full pointer-events-none z-10"
            style={{ top: "-21px" }}
            height="22"
            viewBox="0 0 100 22"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Solid fill matching the nav background perfectly */}
            <path
              d="M0,22 L0,21 L30,21 C40,21 40,1 50,1 C60,1 60,21 70,21 L100,21 L100,22 Z"
              fill="hsl(var(--background))"
            />
            {/* The sharp top border stroke */}
            <path
              d="M0,21 L30,21 C40,21 40,1 50,1 C60,1 60,21 70,21 L100,21"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {leftNav.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                data-tour={path === "/log" ? "nav-diary" : path === "/foods" ? "nav-foods" : undefined}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* Centre Scan Button */}
          <button
            onClick={() => navigate("/scan")}
            className="flex flex-col items-center justify-end pb-1 relative z-20"
            aria-label="Scan Barcode"
          >
            <div className="-mt-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-all active:scale-95 hover:brightness-110">
              <ScanBarcode className="h-6 w-6" />
            </div>
          </button>

          {rightNav.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                data-tour={path === "/log" ? "nav-diary" : path === "/foods" ? "nav-foods" : undefined}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
