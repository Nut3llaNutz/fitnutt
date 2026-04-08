-- Decouple meal entries from food library deletions
-- This prevents CASCADE deletes when a food is removed from the library
ALTER TABLE public.meal_entries DROP CONSTRAINT IF EXISTS meal_entries_food_id_fkey;

ALTER TABLE public.meal_entries ADD CONSTRAINT meal_entries_food_id_fkey 
  FOREIGN KEY (food_id) REFERENCES public.foods(id) ON DELETE SET NULL;
