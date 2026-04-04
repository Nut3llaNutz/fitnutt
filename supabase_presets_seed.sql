-- FitNutt Indian-Focused Pre-built Foods Seed
-- Run this exactly as is in your Supabase SQL Editor.

-- Drop the NOT NULL constraint on user_id so global presets can exist without a specific owner
ALTER TABLE public.foods ALTER COLUMN user_id DROP NOT NULL;

-- Make sure RLS is allowing anyone to read presets:
-- CREATE POLICY "Anyone can read presets" ON foods FOR SELECT USING (source = 'preset' OR user_id = auth.uid());

INSERT INTO foods (name, serving_size, serving_unit, calories, protein, carbs, fats, source, user_id) VALUES
    -- High Protein Vegetarian Core
    ('Paneer (Full Fat)', 100, 'g', 296, 14, 3, 25, 'preset', NULL),
    ('Paneer (Low Fat)', 100, 'g', 90, 15, 4, 1, 'preset', NULL),
    ('Soya Chunks (Raw)', 100, 'g', 345, 52, 33, 0.5, 'preset', NULL),
    ('Tofu (Firm)', 100, 'g', 144, 16, 3, 9, 'preset', NULL),
    
    -- Dals & Pulses (Raw values are more accurate for tracking)
    ('Moong Dal (Yellow - Raw)', 100, 'g', 348, 24, 59, 1.2, 'preset', NULL),
    ('Toor Dal / Arhar (Raw)', 100, 'g', 343, 22, 63, 1.5, 'preset', NULL),
    ('Masoor Dal (Brown/Red - Raw)', 100, 'g', 352, 24, 60, 1, 'preset', NULL),
    ('Kala Chana (Raw)', 100, 'g', 378, 20, 63, 6, 'preset', NULL),
    ('Kabuli Chana / Chickpeas (Raw)', 100, 'g', 364, 19, 61, 6, 'preset', NULL),
    ('Rajma / Kidney Beans (Raw)', 100, 'g', 333, 24, 60, 0.8, 'preset', NULL),
    ('Urad Dal (Raw)', 100, 'g', 341, 25, 59, 1.6, 'preset', NULL),
    ('Besan / Gram Flour', 100, 'g', 387, 22, 58, 6, 'preset', NULL),
    
    -- Grains & Carbs
    ('Roti / Chapati (Whole Wheat)', 40, 'g', 120, 3.5, 22, 1.5, 'preset', NULL),
    ('White Basmati Rice (Raw)', 100, 'g', 350, 8, 78, 0.5, 'preset', NULL),
    ('White Basmati Rice (Cooked)', 100, 'g', 130, 2.7, 28, 0.3, 'preset', NULL),
    ('Brown Basmati Rice (Raw)', 100, 'g', 360, 9, 75, 2.5, 'preset', NULL),
    ('Poha (Flattened Rice - Raw)', 100, 'g', 346, 6.6, 77, 1.2, 'preset', NULL),
    ('Oats (Rolled)', 100, 'g', 379, 13, 68, 6.5, 'preset', NULL),
    ('Dalia (Broken Wheat - Raw)', 100, 'g', 342, 12, 76, 1.5, 'preset', NULL),
    ('Aloo / Potato (Raw)', 100, 'g', 77, 2, 17, 0.1, 'preset', NULL),
    ('Shakarkandi / Sweet Potato (Raw)', 100, 'g', 86, 1.6, 20, 0.1, 'preset', NULL),
    
    -- Non-Vegetarian Staples
    ('Chicken Breast (Raw)', 100, 'g', 120, 22.5, 0, 2.6, 'preset', NULL),
    ('Chicken Breast (Cooked)', 100, 'g', 165, 31, 0, 3.6, 'preset', NULL),
    ('Chicken Thigh (Raw)', 100, 'g', 119, 19.9, 0, 4.3, 'preset', NULL),
    ('Rohu / Katla (Fish - Raw)', 100, 'g', 97, 17, 0, 2, 'preset', NULL),
    ('Egg (Whole, Large)', 50, 'g', 72, 6.3, 0.4, 4.8, 'preset', NULL),
    ('Egg White (Large)', 33, 'g', 17, 3.6, 0.2, 0.1, 'preset', NULL),
    ('Mutton / Goat (Raw, Trimmed)', 100, 'g', 143, 20, 0, 6, 'preset', NULL),
    
    -- Dairy & Fats
    ('Dahi / Curd (Full Cream Milk)', 100, 'g', 98, 3.1, 4.3, 4.3, 'preset', NULL),
    ('Dahi / Curd (Double Toned Milk)', 100, 'g', 56, 3.4, 5.3, 1.5, 'preset', NULL),
    ('Milk (Full Cream - 6% Fat)', 100, 'ml', 87, 3.3, 4.8, 6, 'preset', NULL),
    ('Milk (Toned - 3% Fat)', 100, 'ml', 58, 3.2, 4.7, 3, 'preset', NULL),
    ('Milk (Double Toned - 1.5% Fat)', 100, 'ml', 45, 3.4, 4.9, 1.5, 'preset', NULL),
    ('Ghee', 10, 'g', 90, 0, 0, 10, 'preset', NULL),
    ('Mustard Oil', 15, 'ml', 135, 0, 0, 15, 'preset', NULL),
    ('Refined Sunflower Oil', 15, 'ml', 135, 0, 0, 15, 'preset', NULL),
    ('Peanut Butter (Smooth/Unsweetened)', 100, 'g', 588, 25, 20, 50, 'preset', NULL),
    
    -- Dry Fruits & Snacks
    ('Almonds (Badam - Raw)', 100, 'g', 579, 21.1, 21.6, 49.9, 'preset', NULL),
    ('Walnuts (Akhrot)', 100, 'g', 654, 15.2, 13.7, 65.2, 'preset', NULL),
    ('Makhana (Fox Nuts - Raw)', 100, 'g', 350, 9.7, 77, 0.1, 'preset', NULL),
    ('Roasted Chana (Without Skin)', 100, 'g', 369, 21.5, 59, 5.3, 'preset', NULL),
    ('Peanuts (Moongfali - Roasted)', 100, 'g', 567, 26, 16, 49, 'preset', NULL),
    
    -- Common Fruits & Vegetables
    ('Banana', 100, 'g', 89, 1.1, 22.8, 0.3, 'preset', NULL),
    ('Apple', 100, 'g', 52, 0.3, 13.8, 0.2, 'preset', NULL),
    ('Mango', 100, 'g', 60, 0.8, 15, 0.4, 'preset', NULL),
    ('Papaya', 100, 'g', 43, 0.5, 11, 0.3, 'preset', NULL),
    ('Watermelon', 100, 'g', 30, 0.6, 7.6, 0.2, 'preset', NULL),
    ('Palak / Spinach (Raw)', 100, 'g', 23, 2.9, 3.6, 0.4, 'preset', NULL),
    ('Bhindi / Okra (Raw)', 100, 'g', 33, 1.9, 7.5, 0.2, 'preset', NULL),
    ('Gobi / Cauliflower (Raw)', 100, 'g', 25, 1.9, 4.9, 0.3, 'preset', NULL),
    ('Matar / Green Peas (Raw)', 100, 'g', 81, 5.4, 14, 0.4, 'preset', NULL),
    
    -- Supplements
    ('Whey Protein Powder (Isolate)', 30, 'g', 110, 25, 1, 0.5, 'preset', NULL),
    ('Whey Protein Powder (Concentrate)', 30, 'g', 120, 24, 3, 1.5, 'preset', NULL);

-- Add the missing SELECT policy if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'foods' AND policyname = 'Anyone can view preset foods'
    ) THEN
        CREATE POLICY "Anyone can view preset foods"
        ON public.foods
        FOR SELECT
        USING (
            auth.uid() = user_id OR source = 'preset'
        );
    END IF;
END
$$;
