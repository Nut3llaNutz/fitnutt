import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useSettings, Supplement } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Bell, Plus, X } from "lucide-react";

const Profile = () => {
  const { settings, isLoading, updateSettings } = useSettings();
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isSubscribed, isSupported, permission, subscribe, unsubscribe } =
    usePushSubscription();
  const { toast } = useToast();

  const [form, setForm] = useState({
    calorie_target: 2750,
    protein_target: 100,
    carb_target: 400,
    fat_target: 70,
    notification_time: "20:30",
    nut3lla_tips_enabled: true,
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
      });
      setSupplements((settings.supplements as unknown as Supplement[]) || []);
    }
  }, [settings]);

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
      <Layout>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>

        {/* Account */}
        <div className="bg-card rounded-xl p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="text-card-foreground font-medium">{user?.email}</p>
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
            <span className="text-card-foreground font-medium">Nut3lla Tips & Motivation</span>
            <Switch
              checked={form.nut3lla_tips_enabled}
              onCheckedChange={(c) => {
                setForm(prev => ({ ...prev, nut3lla_tips_enabled: c }));
                updateSettings.mutate({ nut3lla_tips_enabled: c });
              }}
            />
          </div>
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
              <label className="text-xs text-muted-foreground">
                Protein (g)
              </label>
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

        {/* Supplement Reminder */}
        <div className="bg-card rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide">
            Supplement Reminder
          </h2>
          <div>
            <label className="text-xs text-muted-foreground">
              Reminder Time (local time)
            </label>
            <Input
              type="time"
              className="mt-1 w-full flex-1"
              style={{ WebkitAppearance: "none" }}
              value={form.notification_time}
              onChange={(e) =>
                setForm({ ...form, notification_time: e.target.value })
              }
            />
          </div>
          {isSupported && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-card-foreground text-sm">
                  Push Notifications
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
    </Layout>
  );
};

export default Profile;
