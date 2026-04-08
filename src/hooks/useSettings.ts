import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Supplement {
  id: string;
  name: string;
  enabled: boolean; // true = appears on dashboard for daily tracking
}

export const useSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["user_settings"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: {
      calorie_target?: number;
      protein_target?: number;
      carb_target?: number;
      fat_target?: number;
      notification_time?: string;
      theme?: string;
      supplements?: Supplement[];
      timezone?: string;
      nut3lla_tips_enabled?: boolean;
      tutorial_completed?: boolean;
      total_xp?: number;
      logo_taps_count?: number;
      last_logo_tap_date?: string;
      logo_tap_streak?: number;
      logo_easter_egg_triggered?: boolean;
      streak_easter_egg_triggered?: boolean;
    }) => {
      const { error } = await supabase
        .from("user_settings")
        .update(updates as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_settings"] }),
  });

  const addXP = useMutation({
    mutationFn: async (amount: number) => {
      const currentXp = (settingsQuery.data as any)?.total_xp || 0;
      const newTotal = Math.max(0, currentXp + amount);
      
      // Don't issue an update if the XP wouldn't change (e.g., trying to subtract from already 0)
      if (newTotal === currentXp && amount !== 0) return;

      const { error } = await supabase
        .from("user_settings")
        .update({ total_xp: newTotal } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_settings"] });
      // Invalidate streak whenever XP changes, as XP gain/loss usually implies an activity change
      queryClient.invalidateQueries({ queryKey: ["recent_logs_streak"] });
    },
  });

  return { settings: settingsQuery.data, isLoading: settingsQuery.isLoading, updateSettings, addXP };
};
