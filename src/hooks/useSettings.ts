import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Supplement {
  id: string;
  name: string;
  enabled: boolean;
}



export const useSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["user_settings", user?.id || "guest"],
    enabled: !authLoading,
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_settings"] }),
  });

  const addXP = useMutation({
    mutationFn: async (amount: number) => {
      const currentXp = (settingsQuery.data as any)?.total_xp || 0;
      const newTotal = Math.max(0, currentXp + amount);
      if (newTotal === currentXp && amount !== 0) return;

      const { error } = await supabase
        .from("user_settings")
        .update({ total_xp: newTotal } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_settings"] });
      queryClient.invalidateQueries({ queryKey: ["recent_logs_streak"] });
    },
  });

  return { settings: settingsQuery.data, isLoading: settingsQuery.isLoading, updateSettings, addXP };
};
