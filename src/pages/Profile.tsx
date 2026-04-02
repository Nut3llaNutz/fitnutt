import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut } from "lucide-react";

const Profile = () => {
  const { settings, isLoading, updateSettings } = useSettings();
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [form, setForm] = useState({
    calorie_target: 2750,
    protein_target: 100,
    carb_target: 400,
    fat_target: 70,
    notification_time: "20:30",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        calorie_target: settings.calorie_target,
        protein_target: settings.protein_target,
        carb_target: settings.carb_target,
        fat_target: settings.fat_target,
        notification_time: settings.notification_time,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(form, {
      onSuccess: () => toast({ title: "Settings saved!" }),
    });
  };

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    updateSettings.mutate({ theme: newTheme });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>

        <div className="bg-card rounded-xl p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="text-card-foreground font-medium">{user?.email}</p>
        </div>

        {/* Theme */}
        <div className="bg-card rounded-xl p-4 flex items-center justify-between">
          <span className="text-card-foreground font-medium">Dark Mode</span>
          <Switch checked={theme === "dark"} onCheckedChange={handleThemeToggle} />
        </div>

        {/* Macro Targets */}
        <div className="bg-card rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide">Macro Targets</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Calories</label>
              <Input
                type="number"
                value={form.calorie_target}
                onChange={(e) => setForm({ ...form, calorie_target: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Protein (g)</label>
              <Input
                type="number"
                value={form.protein_target}
                onChange={(e) => setForm({ ...form, protein_target: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Carbs (g)</label>
              <Input
                type="number"
                value={form.carb_target}
                onChange={(e) => setForm({ ...form, carb_target: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fats (g)</label>
              <Input
                type="number"
                value={form.fat_target}
                onChange={(e) => setForm({ ...form, fat_target: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Notification Time */}
        <div className="bg-card rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide">Supplement Reminder</h2>
          <Input
            type="time"
            value={form.notification_time}
            onChange={(e) => setForm({ ...form, notification_time: e.target.value })}
          />
        </div>

        <Button onClick={handleSave} className="w-full">Save Settings</Button>

        <Button variant="outline" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;
