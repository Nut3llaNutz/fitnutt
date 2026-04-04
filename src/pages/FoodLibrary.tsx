import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useFoods } from "@/hooks/useFoods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Pencil, Plus } from "lucide-react";

interface FoodForm {
  name: string;
  serving_size: number | "";
  serving_unit: string;
  calories: number | "";
  protein: number | "";
  carbs: number | "";
  fats: number | "";
}

const defaultForm: FoodForm = { name: "", serving_size: 100, serving_unit: "g", calories: "", protein: "", carbs: "", fats: "" };

const FoodLibrary = () => {
  const { foods, addFood, updateFood, deleteFood } = useFoods();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FoodForm>(defaultForm);
  const [search, setSearch] = useState("");

  const openAdd = () => { setForm(defaultForm); setEditId(null); setShowForm(true); };
  const openEdit = (f: any) => {
    setForm({ name: f.name, serving_size: f.serving_size, serving_unit: f.serving_unit, calories: f.calories, protein: f.protein, carbs: f.carbs, fats: f.fats });
    setEditId(f.id);
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
    else addFood.mutate(payload);
    setShowForm(false);
  };

  const filtered = foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Food Library</h1>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Food
          </Button>
        </div>

        <Input placeholder="Search foods..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="space-y-2">
          {filtered.map((f) => (
            <div key={f.id} className="bg-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-card-foreground">{f.name}</div>
                <div className="text-xs text-muted-foreground">
                  {f.calories} kcal · {f.protein}g protein · {f.carbs}g carbs · {f.fats}g fats
                  <span className="ml-1">per {f.serving_size}{f.serving_unit}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(f)} className="p-2 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deleteFood.mutate(f.id)} className="p-2 text-destructive hover:text-destructive/80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No foods yet. Tap + Add Food to get started!</p>
          )}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Food Item" : "Add New Food Item"}</DialogTitle>
              <DialogDescription>
                Enter the nutritional info per serving. All macro values are per one serving.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Food Name</label>
                <Input
                  placeholder="e.g. Oats, Chicken Breast, Whey Protein..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Serving Size</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input
                    type="number"
                    placeholder="Amount (e.g. 100)"
                    value={form.serving_size}
                    onChange={(e) => setForm({ ...form, serving_size: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    placeholder="Unit (g, ml, scoop, piece...)"
                    value={form.serving_unit}
                    onChange={(e) => setForm({ ...form, serving_unit: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Macros per serving
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Calories (kcal)</label>
                    <Input type="number" placeholder="0" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Protein (g)</label>
                    <Input type="number" placeholder="0" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Carbs (g)</label>
                    <Input type="number" placeholder="0" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Fats (g)</label>
                    <Input type="number" placeholder="0" value={form.fats} onChange={(e) => setForm({ ...form, fats: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">{editId ? "Save Changes" : "Add to Library"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default FoodLibrary;
