-- Add nutrition snapshot columns to meal_entries
ALTER TABLE public.meal_entries ADD COLUMN IF NOT EXISTS food_name TEXT;
ALTER TABLE public.meal_entries ADD COLUMN IF NOT EXISTS calories NUMERIC DEFAULT 0;
ALTER TABLE public.meal_entries ADD COLUMN IF NOT EXISTS protein NUMERIC DEFAULT 0;
ALTER TABLE public.meal_entries ADD COLUMN IF NOT EXISTS carbs NUMERIC DEFAULT 0;
ALTER TABLE public.meal_entries ADD COLUMN IF NOT EXISTS fats NUMERIC DEFAULT 0;
ALTER TABLE public.meal_entries ADD COLUMN IF NOT EXISTS serving_size NUMERIC DEFAULT 100;
ALTER TABLE public.meal_entries ADD COLUMN IF NOT EXISTS serving_unit TEXT DEFAULT 'g';

-- Make food_id nullable to allow for one-off/custom logs not in library
ALTER TABLE public.meal_entries ALTER COLUMN food_id DROP NOT NULL;

-- Backfill existing entries with data from the foods table
UPDATE public.meal_entries me
SET 
  food_name = f.name,
  calories = f.calories,
  protein = f.protein,
  carbs = f.carbs,
  fats = f.fats,
  serving_size = f.serving_size,
  serving_unit = f.serving_unit
FROM public.foods f
WHERE me.food_id = f.id;
