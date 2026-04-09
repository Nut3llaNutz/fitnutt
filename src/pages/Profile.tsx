import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings, Supplement } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Bell, Plus, X, Calculator, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { calculateMacros } from "@/lib/calories";

const Profile = () => {
  const { settings, isLoading, updateSettings } = useSettings();
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isSubscribed, isSupported, permission, subscribe, unsubscribe } =
    usePushSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    calorie_target: 2750,
    protein_target: 100,
    carb_target: 400,
    fat_target: 70,
    notification_time: "20:30",
    nut3lla_tips_enabled: true,
    gender: "male",
    weight_kg: 70,
    height_cm: 170,
    age: 25,
    activity_level: 1.2,
    goal: "bulk",
    meal_reminders_enabled: false,
    supp_reminders_enabled: true,
  });

  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [newSupplementName, setNewSupplementName] = useState("");

  useEffect(() => {
    if (settings) {
      setForm({
        calorie_target: settings.calorie_target,
        protein_target: settings.protein_target,
        carb_target: settings.carb_target,
        fat_target: settings.fat_target,
        notification_time: settings.notification_time,
        nut3lla_tips_enabled: settings.nut3lla_tips_enabled ?? true,
        // @ts-ignore - Extra stats from database
        gender: settings.gender || "male",
        // @ts-ignore
        weight_kg: Number(settings.weight_kg) || 70,
        // @ts-ignore
        height_cm: Number(settings.height_cm) || 170,
        // @ts-ignore
        age: Number(settings.age) || 25,
        // @ts-ignore
        activity_level: Number(settings.activity_level) || 1.2,
        // @ts-ignore
        goal: settings.goal || "bulk",
        meal_reminders_enabled: settings.meal_reminders_enabled ?? false,
        supp_reminders_enabled: settings.supp_reminders_enabled ?? true,
      });
      setSupplements((settings.supplements as unknown as Supplement[]) || []);
    }
  }, [settings]);

  const handleRecalculate = () => {
    const targets = calculateMacros({
      gender: form.gender,
      weight_kg: form.weight_kg,
      height_cm: form.height_cm,
      age: form.age,
      activity_level: form.activity_level,
      goal: form.goal,
    });

    setForm((prev) => ({
      ...prev,
      calorie_target: targets.calories,
      protein_target: targets.protein,
      carb_target: targets.carbs,
      fat_target: targets.fats,
    }));

    toast({
      title: "Macros Recalculated!",
      description:
        "Nut3lla has updated your targets based on your current stats. Don't forget to SAVE!",
    });
  };

  const handleSave = () => {
    updateSettings.mutate(
      {
        ...form,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      {
        onSuccess: () => toast({ title: "Settings saved!" }),
      },
    );
  };

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    updateSettings.mutate({ theme: newTheme });
  };

  const saveSupplements = (list: Supplement[]) => {
    setSupplements(list);
    updateSettings.mutate({ supplements: list });
  };

  const handleAddSupplement = () => {
    if (!newSupplementName.trim()) return;
    const newItem: Supplement = {
      id: crypto.randomUUID(),
      name: newSupplementName.trim(),
      enabled: true,
    };
    saveSupplements([...supplements, newItem]);
    setNewSupplementName("");
  };

  const toggleSupplementEnabled = (id: string) => {
    saveSupplements(
      supplements.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const deleteSupplementItem = (id: string) => {
    saveSupplements(supplements.filter((s) => s.id !== id));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Account */}
      <div className="bg-card rounded-xl p-4 space-y-1">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="text-card-foreground font-medium">{user?.email}</p>
        {user?.email === "yuvrajbhardwaj2005yb@gmail.com" && (
          <Button
            onClick={() => navigate("/admin")}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold border-none shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            ADMIN DASHBOARD
          </Button>
        )}
      </div>

      {/* Theme and Nut3lla Tips */}
      <div className="bg-card rounded-xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-card-foreground font-medium">Dark Mode</span>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={handleThemeToggle}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-card-foreground font-medium">
            Nut3lla Tips & Motivation
          </span>
          <Switch
            checked={form.nut3lla_tips_enabled}
            onCheckedChange={(c) => {
              setForm((prev) => ({ ...prev, nut3lla_tips_enabled: c }));
              updateSettings.mutate({ nut3lla_tips_enabled: c });
            }}
          />
        </div>
      </div>

      {/* Physical Stats */}
      <div className="bg-card rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide">
            Physical Stats
          </h2>
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Gender</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Goal</Label>
            <Select
              value={form.goal}
              onValueChange={(v) => setForm((f) => ({ ...f, goal: v }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="bulk">Bulk (+Lean Mass)</SelectItem>
                <SelectItem value="cut">Cut (-Body Fat)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
            <Input
              type="number"
              value={form.weight_kg}
              onChange={(e) =>
                setForm((f) => ({ ...f, weight_kg: Number(e.target.value) }))
              }
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Height (cm)</Label>
            <Input
              type="number"
              value={form.height_cm}
              onChange={(e) =>
                setForm((f) => ({ ...f, height_cm: Number(e.target.value) }))
              }
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Age</Label>
            <Input
              type="number"
              value={form.age}
              onChange={(e) =>
                setForm((f) => ({ ...f, age: Number(e.target.value) }))
              }
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Activity Level
          </Label>
          <Select
            value={String(form.activity_level)}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, activity_level: Number(v) }))
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="1.2">Sedentary (Desk Job)</SelectItem>
              <SelectItem value="1.375">Lightly Active (Gym 1-3x)</SelectItem>
              <SelectItem value="1.55">Moderately Active (Gym 3-5x)</SelectItem>
              <SelectItem value="1.725">Very Active (Gym 6-7x)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          className="w-full h-9 text-[10px] font-bold border-primary/20 hover:bg-primary/5 transition-colors tracking-wider"
          onClick={handleRecalculate}
        >
          <RefreshCw className="h-3 w-3 mr-2" /> RECALCULATE TARGETS
        </Button>
      </div>

      {/* Macro Targets */}
      <div className="bg-card rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide">
          Macro Targets
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Calories</label>
            <Input
              type="number"
              value={form.calorie_target}
              onChange={(e) =>
                setForm({
                  ...form,
                  calorie_target: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Protein (g)</label>
            <Input
              type="number"
              value={form.protein_target}
              onChange={(e) =>
                setForm({
                  ...form,
                  protein_target: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Carbs (g)</label>
            <Input
              type="number"
              value={form.carb_target}
              onChange={(e) =>
                setForm({
                  ...form,
                  carb_target: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fats (g)</label>
            <Input
              type="number"
              value={form.fat_target}
              onChange={(e) =>
                setForm({
                  ...form,
                  fat_target: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Supplements Management */}
      <div className="bg-card rounded-xl p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide">
            My Supplements
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toggle on to show on dashboard for daily tracking.
          </p>
        </div>

        {supplements.length > 0 && (
          <div className="space-y-2">
            {supplements.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 py-1"
              >
                <span className="text-card-foreground text-sm flex-1">
                  {s.name}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={() => toggleSupplementEnabled(s.id)}
                  />
                  <button
                    onClick={() => deleteSupplementItem(s.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Input
            placeholder="e.g. Creatine 5g, Whey Protein..."
            value={newSupplementName}
            onChange={(e) => setNewSupplementName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSupplement()}
            className="flex-1 h-9 text-sm"
          />
          <Button
            size="sm"
            onClick={handleAddSupplement}
            disabled={!newSupplementName.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reminders Management */}
      <div className="bg-card rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide">
            Reminders
          </h2>
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Bell className="h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-card-foreground font-medium text-sm">
                Meal Reminders
              </span>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                Reminder to log after breakfast, lunch, and dinner times.
              </p>
            </div>
            <Switch
              checked={form.meal_reminders_enabled}
              onCheckedChange={(c) =>
                setForm((prev) => ({ ...prev, meal_reminders_enabled: c }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-card-foreground font-medium text-sm">
                Supplement Reminders
              </span>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                Notify at scheduled time for supplements.
              </p>
            </div>
            <Switch
              checked={form.supp_reminders_enabled}
              onCheckedChange={(c) =>
                setForm((prev) => ({ ...prev, supp_reminders_enabled: c }))
              }
            />
          </div>

          <div className="pt-2 border-t border-border/50">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Custom Schedule Time
            </label>
            <Input
              type="time"
              className="mt-1 h-9 bg-background border-border"
              style={{ WebkitAppearance: "none" }}
              value={form.notification_time}
              onChange={(e) =>
                setForm({ ...form, notification_time: e.target.value })
              }
            />
            <p className="text-[10px] text-muted-foreground mt-1.5 italic">
              This time is used for your supplement and streak reminders.
            </p>
          </div>
        </div>

        {isSupported && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${isSubscribed ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
              >
                <Bell className="h-3.5 w-3.5" />
              </div>
              <span className="text-card-foreground text-sm font-medium">
                Device Notifications
              </span>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={async (checked) => {
                if (checked) {
                  const ok = await subscribe();
                  if (ok) toast({ title: "Notifications enabled! 🔔" });
                  else if (permission === "denied")
                    toast({
                      title: "Notifications blocked",
                      description: "Enable them in your browser settings.",
                      variant: "destructive",
                    });
                } else {
                  await unsubscribe();
                  toast({ title: "Notifications disabled" });
                }
              }}
            />
          </div>
        )}
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Settings
      </Button>

      <Button variant="outline" className="w-full" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
};

export default Profile;
