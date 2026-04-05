import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useFoods, Food } from "@/hooks/useFoods";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useMealEntries } from "@/hooks/useMealEntries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil, Plus, Copy, CheckCircle2, Sunrise, Sun, Moon, Coffee } from "lucide-react";

type FilterTab = "all" | "user" | "preset" | "barcode";

interface FoodForm {
  name: string;
  serving_size: number | "";
  serving_unit: string;
  calories: number | "";
  protein: number | "";
  carbs: number | "";
  fats: number | "";
}

const defaultForm: FoodForm = {
  name: "",
  serving_size: 100,
  serving_unit: "g",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
};

const tabLabels: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "user", label: "My Foods" },
  { key: "preset", label: "Pre-built" },
  { key: "barcode", label: "Scanned" },
];

const sourceBadge: Record<string, { label: string; className: string }> = {
  preset: {
    label: "Pre-built",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  barcode: {
    label: "Scanned",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
};

const FoodLibrary = () => {
  const { foods, addFood, updateFood, deleteFood } = useFoods();
  const { log, ensureLog } = useDailyLog();
  const { addEntry } = useMealEntries(log?.id);
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FoodForm>(defaultForm);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // New logging modal state
  const [loggingFood, setLoggingFood] = useState<Food | null>(null);
  const [logForm, setLogForm] = useState({ quantity: "1", mealType: "breakfast" });

  const openAdd = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (f: Food) => {
    setForm({
      name: f.name,
      serving_size: f.serving_size,
      serving_unit: f.serving_unit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fats: f.fats,
    });
    setEditId(f.id);
    setShowForm(true);
  };

  // "Edit Copy" for presets — save a new user-owned copy
  const openEditCopy = (f: Food) => {
    setForm({
      name: f.name,
      serving_size: f.serving_size,
      serving_unit: f.serving_unit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fats: f.fats,
    });
    setEditId(null); // null = new food, will be saved as source:'user'
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      serving_size: Number(form.serving_size) || 0,
      serving_unit: form.serving_unit,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fats: Number(form.fats) || 0,
    };
    if (editId) updateFood.mutate({ id: editId, ...payload });
    else addFood.mutate({ ...payload, source: "user" });
    setShowForm(false);
  };

  const handleLogRequest = (f: Food) => {
    setLoggingFood(f);
    setLogForm({ quantity: "1", mealType: "breakfast" });
  };

  const executeLog = async () => {
    if (!loggingFood) return;
    const logData = await ensureLog();
    addEntry.mutate({
      daily_log_id: logData.id,
      meal_type: logForm.mealType,
      food_id: loggingFood.id,
      quantity: parseFloat(logForm.quantity) || 1,
    });
    toast({ title: `${loggingFood.name} logged to ${logForm.mealType.charAt(0).toUpperCase() + logForm.mealType.slice(1)}!` });
    setLoggingFood(null);
  };

  // Filter by tab first, then by search within that filtered set
  const tabFiltered = foods.filter((f) => {
    if (activeTab === "all") return true;
    return f.source === activeTab;
  });

  const filtered = tabFiltered.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Food Library</h1>
          <Button
            size="sm"
            onClick={openAdd}
            className="rounded-full h-9 w-9 p-0 bg-primary text-primary-foreground"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {tabLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setSearch("");
              }}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-all ${
                activeTab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Input
          placeholder={`Search ${activeTab === "all" ? "all foods" : (tabLabels.find((t) => t.key === activeTab)?.label ?? "")}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-2">
          {filtered.map((f) => {
            const badge = sourceBadge[f.source];
            const isPreset = f.source === "preset";
            const isOwned = f.source === "user" || f.source === "barcode";

            return (
              <div
                key={f.id}
                className="bg-card rounded-xl p-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-card-foreground truncate">
                      {f.name}
                    </span>
                    {badge && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {f.calories} kcal · {f.protein}g P · {f.carbs}g C · {f.fats}
                    g F
                    <span className="ml-1">
                      per {f.serving_size}
                      {f.serving_unit}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  {isPreset && (
                    <>
                      <button
                        onClick={() => handleLogRequest(f)}
                        className="p-2 text-green-500 hover:text-green-400 transition-colors"
                        title="Log to diary"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditCopy(f)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {isOwned && (
                    <>
                      <button
                        onClick={() => openEdit(f)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteFood.mutate(f.id)}
                        className="p-2 text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              {search ? `No results for "${search}"` : "Nothing here yet."}
            </p>
          )}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editId ? "Edit Food Item" : "Add Food Item"}
              </DialogTitle>
              <DialogDescription>
                {editId
                  ? "Update the nutritional info for this food."
                  : "Enter nutritional info per serving. All values are per one serving."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Food Name
                </label>
                <Input
                  placeholder="e.g. Oats, Chicken Breast, Whey Protein..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Serving Size
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input
                    type="number"
                    placeholder="Amount (e.g. 100)"
                    value={form.serving_size}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        serving_size:
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    placeholder="Unit (g, ml, scoop, piece...)"
                    value={form.serving_unit}
                    onChange={(e) =>
                      setForm({ ...form, serving_unit: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Macros per serving
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Calories (kcal)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.calories}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          calories:
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Protein (g)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.protein}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          protein:
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Carbs (g)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.carbs}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          carbs:
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Fats (g)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.fats}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          fats:
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editId ? "Save Changes" : "Add to Library"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Log Food Detail Selection Dialog */}
        <Dialog open={!!loggingFood} onOpenChange={() => setLoggingFood(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Log {loggingFood?.name}
              </DialogTitle>
              <DialogDescription>
                Choose how much and when you're eating this.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Serving Amount</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={logForm.quantity}
                    onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })}
                    className="text-lg font-bold"
                    step="0.1"
                    min="0.1"
                  />
                  <span className="text-sm font-bold text-muted-foreground">{loggingFood?.serving_unit}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Meal Selection</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "breakfast", label: "Breakfast", icon: Sunrise },
                    { key: "lunch", label: "Lunch", icon: Sun },
                    { key: "dinner", label: "Dinner", icon: Moon },
                    { key: "snack", label: "Snack", icon: Coffee },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setLogForm({ ...logForm, mealType: m.key })}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group ${
                        logForm.mealType === m.key
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-card border-transparent hover:border-primary/20 text-muted-foreground"
                      }`}
                    >
                      <div className={`p-2 rounded-xl transition-colors ${logForm.mealType === m.key ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"}`}>
                        <m.icon size={16} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-tight">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={executeLog} className="w-full h-12 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20">
                Add to Diary
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default FoodLibrary;
