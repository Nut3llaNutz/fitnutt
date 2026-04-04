import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Apple, Dumbbell, Settings } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/log", icon: BookOpen, label: "Diary" },
  { path: "/foods", icon: Apple, label: "Foods" },
  { path: "/schedule", icon: Dumbbell, label: "Playbook" },
  { path: "/profile", icon: Settings, label: "Settings" },
];

export const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={toggleTheme} className="flex items-center gap-2">
          <img src="/fitnutt-logo.png" alt="FitNutt" className="h-8 w-8 rounded-full" />
          <span className="font-bold text-lg text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            FitNutt
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
