import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useFoods } from "@/hooks/useFoods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Pencil, Plus } from "lucide-react";

interface FoodForm {
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const defaultForm: FoodForm = { name: "", serving_size: 100, serving_unit: "g", calories: 0, protein: 0, carbs: 0, fats: 0 };

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
    if (editId) {
      updateFood.mutate({ id: editId, ...form });
    } else {
      addFood.mutate(form);
    }
    setShowForm(false);
  };

  const filtered = foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Food Library</h1>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <Input placeholder="Search foods..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="space-y-2">
          {filtered.map((f) => (
            <div key={f.id} className="bg-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-card-foreground">{f.name}</div>
                <div className="text-xs text-muted-foreground">
                  {f.calories} kcal · {f.protein}g P · {f.carbs}g C · {f.fats}g F per {f.serving_size}{f.serving_unit}
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
            <p className="text-muted-foreground text-center py-8">No foods yet. Tap + to add your first food!</p>
          )}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Food" : "Add Food"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Food name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Serving size" value={form.serving_size} onChange={(e) => setForm({ ...form, serving_size: parseFloat(e.target.value) || 0 })} />
                <Input placeholder="Unit (g, ml, scoop)" value={form.serving_unit} onChange={(e) => setForm({ ...form, serving_unit: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Calories" value={form.calories} onChange={(e) => setForm({ ...form, calories: parseFloat(e.target.value) || 0 })} />
                <Input type="number" placeholder="Protein (g)" value={form.protein} onChange={(e) => setForm({ ...form, protein: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Carbs (g)" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: parseFloat(e.target.value) || 0 })} />
                <Input type="number" placeholder="Fats (g)" value={form.fats} onChange={(e) => setForm({ ...form, fats: parseFloat(e.target.value) || 0 })} />
              </div>
              <Button type="submit" className="w-full">{editId ? "Save" : "Add Food"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default FoodLibrary;
