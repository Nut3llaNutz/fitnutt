import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useMealEntries } from "@/hooks/useMealEntries";
import { useFoods } from "@/hooks/useFoods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Copy, ChevronLeft, ChevronRight, Sunrise, Sun, Moon, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

type FilterTab = "all" | "user" | "preset" | "barcode";

const mealTypes = [
  { key: "breakfast", label: "Breakfast", icon: Sunrise },
  { key: "lunch", label: "Lunch", icon: Sun },
  { key: "dinner", label: "Dinner", icon: Moon },
  { key: "snack", label: "Snacks", icon: Coffee },
];

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

const todayStr = () => new Date().toISOString().split("T")[0];

const DailyDiary = () => {
  const [currentDate, setCurrentDate] = useState(todayStr());
  const { log, ensureLog } = useDailyLog(currentDate);
  const { entries, addEntry, removeEntry } = useMealEntries(log?.id);
  const { foods } = useFoods();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addingMealType, setAddingMealType] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [copyDate, setCopyDate] = useState("");
  const [showCopy, setShowCopy] = useState(false);

  const shiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const tabFiltered = foods.filter((f) => {
    if (activeTab === "all") return true;
    return f.source === activeTab;
  });

  const filteredFoods = tabFiltered.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
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
    setActiveTab("all");
  };

  const handleCopyFromDate = async () => {
    if (!copyDate || !user) return;
    const { data: srcLog } = await supabase
      .from("daily_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", copyDate)
      .maybeSingle();

    if (!srcLog) {
      toast({
        title: "No meals found",
        description: `No log exists for ${copyDate}`,
        variant: "destructive",
      });
      return;
    }

    const { data: srcEntries } = await supabase
      .from("meal_entries")
      .select("meal_type, food_id, quantity")
      .eq("daily_log_id", srcLog.id);

    if (!srcEntries || srcEntries.length === 0) {
      toast({
        title: "No meals found",
        description: `No entries for ${copyDate}`,
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => shiftDate(-1)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20"
              disabled={
                currentDate <= (user?.created_at?.split("T")[0] || todayStr())
              }
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground min-w-[110px] text-center">
              {currentDate === todayStr()
                ? "Today"
                : new Date(currentDate).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => shiftDate(1)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20"
              disabled={currentDate >= todayStr()}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCopy(true)}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
        </div>

        {mealTypes.map(({ key, label, icon: Icon }) => (
          <div key={key} className="bg-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-card-foreground">
                  {label}
                </h2>
              </div>
              <Button
                size="sm"
                className="rounded-full h-7 w-7 p-0 bg-primary text-primary-foreground"
                onClick={() => setAddingMealType(key)}
              >
                +
              </Button>
            </div>
            {(grouped[key] || []).map((entry) => {
              const food = (entry as any).foods;
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="text-card-foreground">
                    <span className="font-medium">{food?.name}</span>
                    <span className="text-muted-foreground ml-2">
                      ×{entry.quantity}
                    </span>
                    {food && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({Math.round(food.calories * entry.quantity)} kcal)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeEntry.mutate(entry.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ))}

        {/* Add Food Dialog */}
        <Dialog
          open={!!addingMealType}
          onOpenChange={() => {
            setAddingMealType(null);
            setSearch("");
            setActiveTab("all");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to {addingMealType}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {/* Filter Tabs */}
              <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
                {tabLabels.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key);
                      setSearch("");
                      setSelectedFood(null);
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

              <div className="max-h-52 overflow-y-auto space-y-1">
                {filteredFoods.map((f) => {
                  const badge = sourceBadge[f.source];
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFood(f.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedFood === f.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{f.name}</span>
                        {badge && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${selectedFood === f.id ? "border-white/30 bg-white/10 text-white" : badge.className}`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {f.calories} kcal · {f.protein}g P · {f.carbs}g C ·{" "}
                        {f.fats}g F per {f.serving_size}
                        {f.serving_unit}
                      </div>
                    </button>
                  );
                })}
                {filteredFoods.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    {search
                      ? `No results for "${search}"`
                      : "No foods in this category yet."}
                  </p>
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
                  <Button onClick={handleAdd} className="flex-1">
                    Add
                  </Button>
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
              <Button onClick={handleCopyFromDate} className="w-full">
                Copy Meals
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DailyDiary;
