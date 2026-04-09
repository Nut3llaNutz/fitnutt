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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addXP } = useSettings();

  const entriesQuery = useQuery({
    queryKey: ["meal_entries", user?.id, dailyLogId],
    enabled: !!dailyLogId,
    queryFn: async () => {
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
      // Cast to any to bypass temporary type mismatch while database schema syncs
      const { error } = await (supabase.from("meal_entries") as any).insert(entry);
      if (error) throw error;
      
      // Award XP for logging fuel
      await addXP.mutateAsync(XP_REWARDS.LOG_FOOD);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal_entries", user?.id, dailyLogId] });
      queryClient.invalidateQueries({ queryKey: ["daily_log", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["recent_logs_streak", user?.id] });
    },
  });

  const removeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_entries").delete().eq("id", id);
      if (error) throw error;

      // Subtract XP for removing fuel
      await addXP.mutateAsync(-XP_REWARDS.LOG_FOOD);
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure consistency across views
      queryClient.invalidateQueries({ queryKey: ["meal_entries", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["daily_log", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["recent_logs_streak", user?.id] });
    },
  });

  return { entries: entriesQuery.data || [], isLoading: entriesQuery.isLoading, addEntry, removeEntry };
};
