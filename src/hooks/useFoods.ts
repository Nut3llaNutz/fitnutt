import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useFoods = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const foodsQuery = useQuery({
    queryKey: ["foods"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const addFood = useMutation({
    mutationFn: async (food: { name: string; serving_size: number; serving_unit: string; calories: number; protein: number; carbs: number; fats: number }) => {
      const { error } = await supabase.from("foods").insert({ ...food, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });

  const updateFood = useMutation({
    mutationFn: async ({ id, ...food }: { id: string; name: string; serving_size: number; serving_unit: string; calories: number; protein: number; carbs: number; fats: number }) => {
      const { error } = await supabase.from("foods").update(food).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });

  const deleteFood = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("foods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });

  return { foods: foodsQuery.data || [], isLoading: foodsQuery.isLoading, addFood, updateFood, deleteFood };
};
