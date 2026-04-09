import { useState, useMemo, useEffect } from "react";
import { useFoods, Food } from "@/hooks/useFoods";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useMealEntries } from "@/hooks/useMealEntries";
import { Button } from "@/components/ui/button";
import { Nut3llaPrompt } from "@/components/Nut3llaPrompt";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronRight, Sunrise, Sun, Moon, Coffee, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Category = "All" | "Fruits" | "Drinks" | "Snacks" | "Meals";
const categories: Category[] = ["All", "Fruits", "Drinks", "Snacks", "Meals"];

interface FoodForm {
  name: string;
  serving_size: number | "";
  serving_unit: string;
  calories: number | "";
  protein: number | "";
  carbs: number | "";
  fats: number | "";
  category: string;
  is_veg: boolean;
}

const defaultForm: FoodForm = {
  name: "",
  serving_size: 100,
  serving_unit: "g",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  category: "Meals",
  is_veg: true,
};

const Fuel = () => {
  const { foods, addFood, updateFood, deleteFood } = useFoods();
  const { log, ensureLog } = useDailyLog();
  const { addEntry } = useMealEntries(log?.id);
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FoodForm>(defaultForm);
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<"user" | "preset" | "barcode">("preset");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isVegOnly, setIsVegOnly] = useState(() => localStorage.getItem("diet_preference") !== "non-veg");

  const { isGuest } = useAuth();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [loggingFood, setLoggingFood] = useState<Food | null>(null);
  const [logForm, setLogForm] = useState({ quantity: "1", mealType: "breakfast" });

  useEffect(() => {
    localStorage.setItem("diet_preference", isVegOnly ? "veg" : "non-veg");
  }, [isVegOnly]);

  const openAdd = () => {
    setForm({ ...defaultForm, is_veg: isVegOnly });
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
      category: f.category || "Meals",
      is_veg: f.is_veg,
    });
    setEditId(f.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      serving_size: Number(form.serving_size) || 0,
      serving_unit: form.serving_unit,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fats: Number(form.fats) || 0,
      category: form.category,
      is_veg: form.is_veg,
    };
    
    try {
      if (editId) {
        await updateFood.mutateAsync({ id: editId, ...payload });
      } else {
        const newFood = await addFood.mutateAsync({ ...payload, source: "user" });
        if (newFood?.id) setEditId(newFood.id);
      }
      toast({ title: editId ? "Food updated!" : "Food added to library!" });
    } catch (err) {
      toast({ title: "Failed to save food", variant: "destructive" });
    }
  };

  const handleDelete = () => {
    if (!editId) return;
    if (confirm("Are you sure you want to delete this food?")) {
      deleteFood.mutate(editId);
      toast({ title: "Food deleted" });
      setShowForm(false);
    }
  };

  const handleLogDirectly = async (mealType: string) => {
    const logData = await ensureLog();
    
    // Log directly to the meal entry WITHOUT creating a library food record
    addEntry.mutate({
      daily_log_id: logData.id,
      meal_type: mealType,
      food_id: editId || null, // Keep the ID if we're editing an existing library food, but it's optional now
      quantity: 1,
      food_name: form.name,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fats: Number(form.fats) || 0,
      serving_size: Number(form.serving_size) || 100,
      serving_unit: form.serving_unit,
    });

    toast({ title: `Logged to ${mealType}!` });
    setShowForm(false);
  };

  const executeLog = async () => {
    if (!loggingFood) return;
    const logData = await ensureLog();
    addEntry.mutate({
      daily_log_id: logData.id,
      meal_type: logForm.mealType,
      food_id: loggingFood.id,
      quantity: parseFloat(logForm.quantity) || 1,
      // Snapshot the current nutrition data from the library
      food_name: loggingFood.name,
      calories: loggingFood.calories,
      protein: loggingFood.protein,
      carbs: loggingFood.carbs,
      fats: loggingFood.fats,
      serving_size: loggingFood.serving_size,
      serving_unit: loggingFood.serving_unit,
    });
    toast({ title: `${loggingFood.name} logged!` });
    setLoggingFood(null);
  };

  const filtered = useMemo(() => {
    return foods.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
      const matchesSource = f.source === selectedSource;
      let matchesCategory = true;
      if (activeCategory !== "All") matchesCategory = f.category === activeCategory;
      const matchesDiet = f.is_veg === isVegOnly;
      return matchesSearch && matchesSource && matchesCategory && matchesDiet;
    });
  }, [foods, search, selectedSource, activeCategory, isVegOnly]);

  const currentFood = editId ? foods.find(f => f.id === editId) : null;
  const canDelete = editId && currentFood && currentFood.source !== "preset";

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <h1 className="text-2xl font-bold tracking-tight">Fuel Library</h1>
          <Button
            size="icon"
            variant="outline"
            onClick={() => isGuest ? setShowGuestPrompt(true) : openAdd()}
            className="h-9 w-9 rounded-xl border-primary/20 bg-background/50 backdrop-blur-sm transition-all active:scale-95 shadow-lg shadow-black/5 text-primary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Source Filter */}
        <div className="flex gap-2 w-full px-1">
          {[
            { id: "user", label: "My Foods" },
            { id: "preset", label: "Pre-built" },
            { id: "barcode", label: "Scanned" }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSource(s.id as any)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                selectedSource === s.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 flex-wrap px-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-muted hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Toggle */}
        <div className="flex items-center gap-3 px-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-card/50 rounded-xl border-none ring-1 ring-muted"
            />
          </div>
          <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-xl ring-1 ring-muted">
             <span className={`text-[9px] font-black uppercase tracking-widest ${isVegOnly ? "text-green-500" : "text-red-500"}`}>
               {isVegOnly ? "Veg" : "Non-Veg"}
             </span>
             <Switch 
               checked={isVegOnly} 
               onCheckedChange={setIsVegOnly}
               className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
             />
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2.5 px-1 pb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-2xl border-muted">
              <p className="text-muted-foreground text-sm font-medium">No results found.</p>
            </div>
          ) : (
            filtered.map((f) => (
              <div
                key={f.id}
                className="bg-card rounded-2xl p-4 border border-muted hover:border-primary/20 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${f.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="font-bold text-foreground truncate text-sm">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setLoggingFood(f); setLogForm({ quantity: "1", mealType: "breakfast" }); }}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { 
                        if (isGuest && f.source !== 'preset') {
                          setShowGuestPrompt(true);
                        } else {
                          e.stopPropagation(); 
                          openEdit(f); 
                        }
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                  <span className="text-primary/70">{f.calories} KCAL</span>
                  <span>{f.protein}G P</span>
                  <span>{f.carbs}G C</span>
                  <span>{f.fats}G F</span>
                  <span className="ml-auto opacity-50">{f.serving_size}{f.serving_unit}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="w-[calc(100%-2.5rem)] max-w-[360px] rounded-3xl p-6 border-none shadow-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {editId ? "Edit Item" : "New Item"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="h-10 rounded-xl bg-muted/30 border-none shadow-inner font-medium"
                  />
                </div>
                <div className="flex flex-col items-center gap-1.5 pt-4">
                  <span className={`text-[8px] font-black uppercase ${form.is_veg ? "text-green-500" : "text-red-500"}`}>
                    {form.is_veg ? "Veg" : "Non-Veg"}
                  </span>
                  <Switch
                    checked={form.is_veg}
                    onCheckedChange={(v) => setForm({ ...form, is_veg: v })}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 scale-90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Serving</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={form.serving_size}
                      onChange={(e) => setForm({ ...form, serving_size: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                      className="h-10 rounded-xl bg-muted/30 border-none flex-1 text-center"
                    />
                    <Input
                      value={form.serving_unit}
                      onChange={(e) => setForm({ ...form, serving_unit: e.target.value })}
                      className="h-10 w-12 rounded-xl bg-muted/30 border-none text-center"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Calories</Label>
                  <Input
                    type="number"
                    value={form.calories}
                    onChange={(e) => setForm({ ...form, calories: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                    className="h-10 rounded-xl bg-muted/30 border-none text-center font-bold text-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {categories.filter(c => c !== "All").map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, category: c })}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                        form.category === c
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-muted/30 text-muted-foreground border-transparent hover:border-primary/30"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-muted/20 p-4 rounded-2xl">
                {(
                  [
                    { label: "Protein", k: "protein" },
                    { label: "Carbs", k: "carbs" },
                    { label: "Fats", k: "fats" },
                  ] as const
                ).map((m) => (
                  <div key={m.k} className="space-y-1 text-center">
                    <span className="text-[8px] font-black uppercase text-muted-foreground">
                      {m.label}
                    </span>
                    <Input
                      type="number"
                      value={form[m.k]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [m.k]: e.target.value === "" ? "" : parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-9 rounded-lg bg-background border-none text-center font-bold p-0"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  {editId ? "Update" : "Save"}
                </Button>
                {canDelete && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleDelete}
                    className="h-12 w-12 rounded-2xl p-0 border-destructive/20 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
                <div className="relative group">
                   <Button type="button" variant="outline" className="h-12 w-12 rounded-2xl p-0">
                     <Plus className="h-5 w-5" />
                   </Button>
                   <div className="absolute right-0 bottom-full mb-3 hidden group-hover:block bg-card rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden z-50 min-w-[140px]">
                      {["breakfast", "lunch", "dinner", "snack"].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleLogDirectly(m)}
                          className="w-full px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground border-b border-muted last:border-none"
                        >
                          Log to {m}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Log Confirmation */}
        <Dialog open={!!loggingFood} onOpenChange={() => setLoggingFood(null)}>
          <DialogContent className="w-[calc(100%-2.5rem)] max-w-[360px] rounded-3xl p-6">
            <DialogHeader className="mb-4">
               <DialogTitle className="text-xl font-bold">Log {loggingFood?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amount</Label>
                <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl">
                  <Input
                    type="number"
                    value={logForm.quantity}
                    onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })}
                    className="text-2xl font-black bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                  />
                  <span className="font-bold text-primary">{loggingFood?.serving_unit}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k: "breakfast", l: "Breakfast", i: Sunrise },
                  { k: "lunch", l: "Lunch", i: Sun },
                  { k: "dinner", l: "Dinner", i: Moon },
                  { k: "snack", l: "Snacks", i: Coffee },
                ].map(m => (
                  <button
                    key={m.k}
                    onClick={() => setLogForm({ ...logForm, mealType: m.k })}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      logForm.mealType === m.k ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-card border-muted text-muted-foreground"
                    }`}
                  >
                    <m.i size={14} />
                    <span className="text-[9px] font-black uppercase">{m.l}</span>
                  </button>
                ))}
              </div>
              <Button onClick={executeLog} className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                Confirm Log
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {showGuestPrompt && (
          <Nut3llaPrompt 
            description="Loggin' pre-built fuels is fine, but if you want to create your own custom kitchen, you'll need to join the Nut3lla Protocol."
            onClose={() => setShowGuestPrompt(false)}
          />
        )}
      </div>
  );
};

export default Fuel;
