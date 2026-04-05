import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "./useSettings";
import { XP_REWARDS } from "@/lib/gamification";

export const useMealEntries = (dailyLogId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addXP } = useSettings();

  const entriesQuery = useQuery({
    queryKey: ["meal_entries", dailyLogId],
    enabled: !!dailyLogId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_entries")
        .select("*, foods(*)")
        .eq("daily_log_id", dailyLogId!);
      if (error) throw error;
      return data;
    },
  });

  const addEntry = useMutation({
    mutationFn: async (entry: { daily_log_id: string; meal_type: string; food_id: string; quantity: number }) => {
      const { error } = await supabase.from("meal_entries").insert(entry);
      if (error) throw error;
      
      // Award XP for logging fuel
      await addXP.mutateAsync(XP_REWARDS.LOG_FOOD);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meal_entries", dailyLogId] }),
  });

  const removeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meal_entries", dailyLogId] }),
  });

  return { entries: entriesQuery.data || [], isLoading: entriesQuery.isLoading, addEntry, removeEntry };
};
