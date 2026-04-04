
-- Update handle_new_user to also seed default foods
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
    INSERT INTO public.foods (user_id, name, serving_size, serving_unit, calories, protein, carbs, fats) VALUES
      (NEW.id, 'Chicken Breast', 100, 'g', 165, 31, 0, 3.6),
      (NEW.id, 'Whole Eggs', 1, 'egg', 78, 6, 0.6, 5.3),
      (NEW.id, 'Whey Protein', 1, 'scoop', 120, 24, 3, 1.5),
      (NEW.id, 'Soya Chunks', 100, 'g', 345, 52, 33, 0.5),
      (NEW.id, 'Paneer', 100, 'g', 265, 18, 1.2, 21),
      (NEW.id, 'Dal (Moong)', 100, 'g', 105, 7, 18, 0.4),
      (NEW.id, 'White Rice (cooked)', 100, 'g', 130, 2.7, 28, 0.3),
      (NEW.id, 'Roti (Wheat)', 1, 'piece', 104, 3, 18, 2);
    RETURN NEW;
END;
$$;
