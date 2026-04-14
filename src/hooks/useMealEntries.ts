import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "./useSettings";
import { XP_REWARDS } from "@/lib/gamification";

export interface MealEntry {
  id: string
  daily_log_id: string
  meal_type: string
  food_id: string | null
  quantity: number
  food_name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  serving_size: number
  serving_unit: string
  created_at: string
}

export const useMealEntries = (dailyLogId?: string) => {
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const { addXP } = useSettings();

  const entriesQuery = useQuery({
    queryKey: ["meal_entries", user?.id || "guest", dailyLogId],
    enabled: !!dailyLogId,
    queryFn: async () => {
      if (isGuest) {
        const local = localStorage.getItem("fitnutt_guest_meal_entries");
        const allEntries: MealEntry[] = local ? JSON.parse(local) : [];
        return allEntries.filter(e => e.daily_log_id === dailyLogId);
      }

      const { data, error } = await supabase
        .from("meal_entries")
        .select("*")
        .eq("daily_log_id", dailyLogId!);
      if (error) throw error;
      return (data || []) as MealEntry[];
    },
  });

  const addEntry = useMutation({
    mutationFn: async (entry: { 
      daily_log_id: string; 
      meal_type: string; 
      food_id?: string | null; 
      quantity: number;
      food_name: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      serving_size: number;
      serving_unit: string;
    }) => {
      if (isGuest) {
        const local = localStorage.getItem("fitnutt_guest_meal_entries");
        const allEntries: MealEntry[] = local ? JSON.parse(local) : [];
        const newEntry: MealEntry = {
          ...entry,
          food_id: entry.food_id || null, // ensure null if undefined
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("fitnutt_guest_meal_entries", JSON.stringify([...allEntries, newEntry]));
      } else {
        // Cast to any to bypass temporary type mismatch while database schema syncs
        const { error } = await (supabase.from("meal_entries") as any).insert(entry);
        if (error) throw error;
      }
      
      // Award XP for logging fuel
      await addXP.mutateAsync(XP_REWARDS.LOG_FOOD);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal_entries", user?.id || "guest", dailyLogId] });
      queryClient.invalidateQueries({ queryKey: ["daily_log", user?.id || "guest"] });
      queryClient.invalidateQueries({ queryKey: ["recent_logs_streak", user?.id || "guest"] });
    },
  });

  const removeEntry = useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) {
        const local = localStorage.getItem("fitnutt_guest_meal_entries");
        const allEntries: MealEntry[] = local ? JSON.parse(local) : [];
        const filtered = allEntries.filter(e => e.id !== id);
        localStorage.setItem("fitnutt_guest_meal_entries", JSON.stringify(filtered));
      } else {
        const { error } = await supabase.from("meal_entries").delete().eq("id", id);
        if (error) throw error;
      }

      // Subtract XP for removing fuel
      await addXP.mutateAsync(-XP_REWARDS.LOG_FOOD);
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure consistency across views
      queryClient.invalidateQueries({ queryKey: ["meal_entries", user?.id || "guest"] });
      queryClient.invalidateQueries({ queryKey: ["daily_log", user?.id || "guest"] });
      queryClient.invalidateQueries({ queryKey: ["recent_logs_streak", user?.id || "guest"] });
    },
  });

  return { entries: entriesQuery.data || [], isLoading: entriesQuery.isLoading, addEntry, removeEntry };
};
