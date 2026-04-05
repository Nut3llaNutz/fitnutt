import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "./useSettings";
import { XP_REWARDS } from "@/lib/gamification";

const todayStr = () => new Date().toISOString().split("T")[0];

export const useDailyLog = (date?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addXP } = useSettings();
  const d = date || todayStr();

  const logQuery = useQuery({
    queryKey: ["daily_log", d],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", d)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const ensureLog = async () => {
    if (logQuery.data) return logQuery.data;
    const { data, error } = await supabase
      .from("daily_logs")
      .upsert({ user_id: user!.id, date: d }, { onConflict: "user_id,date" })
      .select()
      .single();
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["daily_log", d] });
    return data;
  };

  const toggleSupplement = useMutation({
    mutationFn: async (field: "creatine_taken" | "whey_taken") => {
      const log = await ensureLog();
      const { error } = await supabase
        .from("daily_logs")
        .update({ [field]: !(log as any)[field] })
        .eq("id", log.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily_log", d] }),
  });

  const toggleCustomSupplement = useMutation({
    mutationFn: async (supplementId: string) => {
      const log = await ensureLog();
      const taken = ((log as any).supplements_taken as Record<string, boolean>) || {};
      const newTaken = { ...taken, [supplementId]: !taken[supplementId] };
      const { error } = await supabase
        .from("daily_logs")
        .update({ supplements_taken: newTaken } as any)
        .eq("id", log.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily_log", d] }),
  });

  const toggleExercise = useMutation({
    mutationFn: async (exerciseName: string) => {
      const log = await ensureLog();
      const completed = ((log as any).completed_exercises as string[]) || [];
      const isDone = completed.includes(exerciseName);
      
      const newCompleted = isDone 
        ? completed.filter(n => n !== exerciseName)
        : [...completed, exerciseName];

      const { error } = await supabase
        .from("daily_logs")
        .update({ completed_exercises: newCompleted } as any)
        .eq("id", log.id);

      if (error) throw error;
      
      // Award or remove XP
      await addXP.mutateAsync(isDone ? -XP_REWARDS.COMPLETE_EXERCISE : XP_REWARDS.COMPLETE_EXERCISE);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily_log", d] }),
  });

  return { 
    log: logQuery.data, 
    isLoading: logQuery.isLoading, 
    toggleSupplement, 
    toggleCustomSupplement, 
    toggleExercise,
    ensureLog 
  };
};
