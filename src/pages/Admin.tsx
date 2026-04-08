import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Users, Utensils, Activity, Flame, ShieldAlert, Lock, ArrowRight, Loader2, BarChart3, TrendingUp } from "lucide-react";
import { Navigate } from "react-router-dom";

const ADMIN_EMAIL = "yuvrajbhardwaj2005yb@gmail.com";
const ADMIN_PASSWORD = "yuvjig58";

const Admin = () => {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      // @ts-ignore - Manual RPC call for global stats
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) throw error;
      return data as {
        total_users: number;
        total_logs: number;
        active_today: number;
        total_calories_today: number;
      };
    },
    enabled: isAuthenticated,
  });

  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect secondary password.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <ShieldAlert className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Admin Access
            </h1>
            <p className="text-muted-foreground">Secondary authentication required.</p>
          </div>

          <Card className="p-6 border-border bg-card/50 backdrop-blur-sm shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter admin key..."
                  className="pl-10 h-11 bg-background border-border"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-destructive font-medium pl-1">{error}</p>}
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 transition-opacity">
                Verify Credentials <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-10">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Global Insights</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time performance metrics across FitNutt.</p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground animate-pulse">Aggregating stats...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Users */}
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <Users className="h-16 w-16" />
              </div>
              <div className="space-y-1 relative z-10">
                <p className="text-sm font-medium text-blue-500 uppercase tracking-wider">Total Residents</p>
                <p className="text-4xl font-bold text-foreground">{stats?.total_users || 0}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
                  <Activity className="h-3 w-3" /> All-time signed up
                </div>
              </div>
            </Card>

            {/* Daily Active */}
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-green-500">
                <Activity className="h-16 w-16" />
              </div>
              <div className="space-y-1 relative z-10">
                <p className="text-sm font-medium text-green-500 uppercase tracking-wider">Active Today</p>
                <p className="text-4xl font-bold text-foreground">{stats?.active_today || 0}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
                  <TrendingUp className="h-3 w-3" /> Logged activity in 24h
                </div>
              </div>
            </Card>

            {/* Total Meals */}
            <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-amber-500">
                <Utensils className="h-16 w-16" />
              </div>
              <div className="space-y-1 relative z-10">
                <p className="text-sm font-medium text-amber-500 uppercase tracking-wider">Fuel Logged</p>
                <p className="text-4xl font-bold text-foreground">{stats?.total_logs || 0}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
                  <BarChart3 className="h-3 w-3" /> Historical meal entries
                </div>
              </div>
            </Card>

            {/* Calories Today */}
            <Card className="p-6 bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-red-500">
                <Flame className="h-16 w-16" />
              </div>
              <div className="space-y-1 relative z-10">
                <p className="text-sm font-medium text-red-500 uppercase tracking-wider">Calories Consumed</p>
                <p className="text-4xl font-bold text-foreground">{Math.round(stats?.total_calories_today || 0).toLocaleString()}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
                  <Activity className="h-3 w-3" /> Total logged today
                </div>
              </div>
            </Card>
          </div>
        )}

        <footer className="pt-10 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.2em]">FitNutt Control System v1.0</p>
        </footer>
      </div>
    </Layout>
  );
};

export default Admin;
