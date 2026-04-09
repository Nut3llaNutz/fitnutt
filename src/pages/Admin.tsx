import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Users, Utensils, Activity, Flame, ShieldAlert, Lock, 
  ArrowRight, Loader2, BarChart3, TrendingUp, ChevronRight, Award
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell, CartesianGrid 
} from "recharts";

const ADMIN_EMAIL = "yuvrajbhardwaj2005yb@gmail.com";
const ADMIN_PASSWORD = "yuvjig58";

const Admin = () => {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const [timeframe, setTimeframe] = useState("7d");
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin_detailed_stats", timeframe],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.rpc("get_admin_detailed_stats", { p_timeframe: timeframe });
      if (error) throw error;
      return data as {
        summary: {
          total_users: number;
          total_logs_all_time: number;
          total_logs_today: number;
          total_calories_all_time: number;
          total_calories_today: number;
          active_residents_today: number;
          active_guests_today: number;
          total_guests_ever: number;
        };
        trends: { date: string; users: number; logs: number }[];
        ranks: { rank: string; count: number }[];
        top_items: { name: string; count: number }[];
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Admin Access
          </h1>
          <p className="text-muted-foreground">Secondary authentication required.</p>
        </div>

        <Card className="p-6 border-border bg-card/50 backdrop-blur-sm shadow-2xl mt-8 w-full max-w-md">
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
    );
  }

  return (
    <div className="space-y-8 pb-10">
        <header className="space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Global Insights</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Real-time performance metrics across FitNutt.</p>
            </div>
            
            <div className="flex bg-card p-1 rounded-xl ring-1 ring-muted/20">
              {[
                { id: "7d", label: "7D" },
                { id: "30d", label: "30D" },
                { id: "6m", label: "6M" },
                { id: "1y", label: "1Y" },
                { id: "all", label: "ALL" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTimeframe(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                    timeframe === p.id 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground animate-pulse">Aggregating detailed analytics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Residents", val: stats?.summary.total_users, sub: `${stats?.summary.active_residents_today} Active Today`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Guests Today", val: stats?.summary.active_guests_today, sub: `${stats?.summary.total_guests_ever} Overall`, icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
                { label: "Fuel Logged", val: stats?.summary.total_logs_all_time, sub: `${stats?.summary.total_logs_today} Today`, icon: Utensils, color: "text-amber-500", bg: "bg-amber-500/10" },
                { label: "Kcal Logged", val: Math.round(stats?.summary.total_calories_all_time || 0).toLocaleString(), sub: `${Math.round(stats?.summary.total_calories_today || 0).toLocaleString()} today`, icon: Flame, color: "text-red-500", bg: "bg-red-500/10" },
              ].map((s, i) => (
                <Card key={i} className="p-4 border-border bg-card/40 flex flex-col gap-2 relative overflow-hidden">
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className={`p-2 w-fit rounded-lg ${s.bg}`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold text-foreground">{s.val || 0}</p>
                      <p className="text-[9px] font-bold text-primary/70 uppercase mt-0.5">{s.sub}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Chart */}
              <Card className="lg:col-span-2 p-6 border-border bg-card/40">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Usage Over Time
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Period: {timeframe.toUpperCase()}
                  </p>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.trends}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: 'rgba(255,255,255,0.4)'}} 
                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: 'white' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorUsers)" 
                        strokeWidth={2}
                        name="Active Users"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="logs" 
                        stroke="rgba(255,255,255,0.2)" 
                        fill="transparent" 
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        name="Meal Entries"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Top Fuel */}
              <Card className="p-6 border-border bg-card/40">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                  <Utensils className="h-4 w-4 text-primary" /> Trending Fuel
                </h3>
                <div className="space-y-4">
                  {stats?.top_items.length ? stats.top_items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold">#{i+1}</div>
                        <span className="text-sm font-medium text-foreground/80 truncate max-w-[150px]">
                          {item.name || "Unknown Fuel"}
                        </span>
                      </div>
                      <span className="text-xs font-black text-primary group-hover:translate-x-1 transition-transform">{item.count} logs</span>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground italic text-center py-10">No data found</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Rank Distribution */}
            <Card className="p-6 border-border bg-card/40">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Rank Distribution
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Power Levels</p>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.ranks}>
                    <XAxis 
                      dataKey="rank" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 9, fill: 'rgba(255,255,255,0.3)'}} 
                    />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats?.ranks.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        <footer className="pt-10 border-t border-border/40 flex justify-between items-center">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em]">FitNutt Control v2.0</p>
          <div className="flex items-center gap-2 text-[10px] text-primary font-bold animate-pulse">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" /> LIVE SYSTEM
          </div>
        </footer>
      </div>
  );
};

export default Admin;
