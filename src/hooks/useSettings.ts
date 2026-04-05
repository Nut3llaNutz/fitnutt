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
      const currentXp = settingsQuery.data?.total_xp || 0;
      const { error } = await supabase
        .from("user_settings")
        .update({ total_xp: currentXp + amount })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_settings"] }),
  });

  return { settings: settingsQuery.data, isLoading: settingsQuery.isLoading, updateSettings, addXP };
};
