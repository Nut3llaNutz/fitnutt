import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { useSettings } from "@/hooks/useSettings";
import { DateProvider } from "@/contexts/DateContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import FoodLibrary from "./pages/FoodLibrary";
import Schedule from "./pages/Schedule";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import BarcodeScanner from "./pages/BarcodeScanner";
import PumpRank from "./pages/PumpRank";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const AppContent = () => {
  const { loading } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    // Enforce 2.2s minimum splash for premium feel
    const timer = setTimeout(() => setMinSplashDone(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && minSplashDone) {
      const preloader = document.getElementById("root-preloader");
      if (preloader) {
        preloader.classList.add("fade-out");
        setTimeout(() => preloader.remove(), 600);
      }
    }
  }, [loading, minSplashDone]);

  return (
    <BrowserRouter>
      <DateProvider>
        <TutorialProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="*"
              element={
                <Layout>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Index />
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
                      path="/admin"
                      element={
                        <ProtectedRoute>
                          <Admin />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pump-rank"
                      element={
                        <ProtectedRoute>
                          <PumpRank />
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
                </Layout>
              }
            />
          </Routes>
        </TutorialProvider>
      </DateProvider>
    </BrowserRouter>
  );
};

export default App;
