import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useMealEntries } from "@/hooks/useMealEntries";
import { useFoods } from "@/hooks/useFoods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const mealTypes = [
  { key: "breakfast", label: "🌅 Breakfast" },
  { key: "lunch", label: "☀️ Lunch" },
  { key: "dinner", label: "🌙 Dinner" },
  { key: "snack", label: "🍿 Snacks" },
];

const DailyDiary = () => {
  const { log, ensureLog } = useDailyLog();
  const { entries, addEntry, removeEntry } = useMealEntries(log?.id);
  const { foods } = useFoods();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addingMealType, setAddingMealType] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [copyDate, setCopyDate] = useState("");
  const [showCopy, setShowCopy] = useState(false);

  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedFood) return;
    const logData = await ensureLog();
    addEntry.mutate({
      daily_log_id: logData.id,
      meal_type: addingMealType!,
      food_id: selectedFood,
      quantity: parseFloat(quantity) || 1,
    });
    setAddingMealType(null);
    setSelectedFood(null);
    setQuantity("1");
    setSearch("");
  };

  const handleCopyFromDate = async () => {
    if (!copyDate || !user) return;
    // Find log for that date
    const { data: srcLog } = await supabase
      .from("daily_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", copyDate)
      .maybeSingle();

    if (!srcLog) {
      toast({ title: "No meals found", description: `No log exists for ${copyDate}`, variant: "destructive" });
      return;
    }

    const { data: srcEntries } = await supabase
      .from("meal_entries")
      .select("meal_type, food_id, quantity")
      .eq("daily_log_id", srcLog.id);

    if (!srcEntries || srcEntries.length === 0) {
      toast({ title: "No meals found", description: `No entries for ${copyDate}`, variant: "destructive" });
      return;
    }

    const logData = await ensureLog();
    const inserts = srcEntries.map((e) => ({
      daily_log_id: logData.id,
      meal_type: e.meal_type,
      food_id: e.food_id,
      quantity: e.quantity,
    }));

    const { error } = await supabase.from("meal_entries").insert(inserts);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Meals copied!" });
      queryClient.invalidateQueries({ queryKey: ["meal_entries"] });
    }
    setShowCopy(false);
  };

  const grouped = entries.reduce((acc: Record<string, typeof entries>, e) => {
    (acc[e.meal_type] = acc[e.meal_type] || []).push(e);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Daily Diary</h1>
          <Button variant="outline" size="sm" onClick={() => setShowCopy(true)}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
        </div>

        {mealTypes.map(({ key, label }) => (
          <div key={key} className="bg-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-card-foreground">{label}</h2>
              <Button size="sm" variant="ghost" onClick={() => setAddingMealType(key)}>
                + Add
              </Button>
            </div>
            {(grouped[key] || []).map((entry) => {
              const food = (entry as any).foods;
              return (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <div className="text-card-foreground">
                    <span className="font-medium">{food?.name}</span>
                    <span className="text-muted-foreground ml-2">×{entry.quantity}</span>
                    {food && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({Math.round(food.calories * entry.quantity)} kcal)
                      </span>
                    )}
                  </div>
                  <button onClick={() => removeEntry.mutate(entry.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ))}

        {/* Add Food Dialog */}
        <Dialog open={!!addingMealType} onOpenChange={() => setAddingMealType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to {addingMealType}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Search foods..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredFoods.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFood(f.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedFood === f.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs opacity-70">
                      {f.calories} kcal · {f.protein}g P · {f.carbs}g C · {f.fats}g F per {f.serving_size}{f.serving_unit}
                    </div>
                  </button>
                ))}
                {filteredFoods.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">No foods found. Add some in the Food Library!</p>
                )}
              </div>
              {selectedFood && (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="w-24"
                  />
                  <Button onClick={handleAdd} className="flex-1">Add</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Copy Dialog */}
        <Dialog open={showCopy} onOpenChange={setShowCopy}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Copy Meals From Date</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                type="date"
                value={copyDate}
                onChange={(e) => setCopyDate(e.target.value)}
              />
              <Button onClick={handleCopyFromDate} className="w-full">Copy Meals</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DailyDiary;
