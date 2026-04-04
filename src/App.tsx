import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import DailyDiary from "./pages/DailyDiary";
import FoodLibrary from "./pages/FoodLibrary";
import Schedule from "./pages/Schedule";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import BarcodeScanner from "./pages/BarcodeScanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const GlobalSplash = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && minSplashDone) {
      setIsFadingOut(true);
      const timer = setTimeout(() => setIsUnmounted(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, minSplashDone]);

  return (
    <>
      {!isUnmounted && (
        <div 
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-background px-4 transition-opacity duration-500 ease-in-out ${isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-24 w-24">
              <img
                src="/fitnutt-logo.png"
                alt="Loading Up"
                className="absolute inset-0 h-24 w-24 animate-logo-pump-up"
              />
              <img
                src="/fitnutt-logo-down.png"
                alt="Loading Down"
                className="absolute inset-0 h-24 w-24 animate-logo-pump-down"
              />
            </div>
            <h1
              className="text-2xl font-bold text-foreground animate-pulse"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              FitNutt
            </h1>
          </div>
        </div>
      )}
      {!loading && children}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <GlobalSplash>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/log"
                  element={
                    <ProtectedRoute>
                      <DailyDiary />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/foods"
                  element={
                    <ProtectedRoute>
                      <FoodLibrary />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <ProtectedRoute>
                      <Schedule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scan"
                  element={
                    <ProtectedRoute>
                      <BarcodeScanner />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </GlobalSplash>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
