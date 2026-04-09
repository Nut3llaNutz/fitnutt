import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Food {
  id: string;
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category: string;
  is_veg: boolean;
  source: "user" | "preset" | "barcode";
  barcode?: string | null;
  user_id?: string | null;
}

export const useFoods = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const foodsQuery = useQuery({
    queryKey: ["foods", user?.id],
    enabled: true,
    queryFn: async () => {
      let query = (supabase.from("foods" as any) as any).select("*");
      
      if (user) {
        query = query.or(`user_id.eq.${user.id},source.eq.preset`);
      } else {
        query = query.eq("source", "preset");
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      return (data || []) as unknown as Food[];
    },
  });

  const addFood = useMutation({
    mutationFn: async (food: {
      name: string; serving_size: number; serving_unit: string;
      calories: number; protein: number; carbs: number; fats: number;
      category: string; is_veg: boolean; source?: string; barcode?: string;
    }) => {
      const { data, error } = await supabase.from("foods").insert({
        ...food,
        source: food.source || "user",
        user_id: user!.id,
      }).select().single();
      if (error) throw error;
      return data as unknown as Food;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });

  const updateFood = useMutation({
    mutationFn: async ({ id, ...food }: {
      id: string; name: string; serving_size: number; serving_unit: string;
      calories: number; protein: number; carbs: number; fats: number;
      category: string; is_veg: boolean;
    }) => {
      const { data, error } = await supabase
        .from("foods")
        .update(food)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Food;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });

  const deleteFood = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("foods" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["foods"] }),
  });

  return { foods: foodsQuery.data || [], isLoading: foodsQuery.isLoading, addFood, updateFood, deleteFood };
};
