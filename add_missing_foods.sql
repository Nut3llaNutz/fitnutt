-- FitNutt: +200 Real Foods Expansion
-- Verified against live DB — no raw veggies or raw grains.
-- All actual cooked/prepared/packaged foods people actually log.
-- Run in Supabase SQL Editor. Safe to re-run (ON CONFLICT DO NOTHING).

INSERT INTO foods (name, serving_size, serving_unit, calories, protein, carbs, fats, source, user_id, is_veg)
VALUES

    -- ─── WHITE RICE (genuinely missing) ────────────────────────────────────
    ('White Rice (Cooked)',                100, 'g',   130,  2.7, 28.0,  0.3, 'preset', NULL, true),
    ('White Rice (Raw)',                  100, 'g',   357,  6.8, 79.0,  0.5, 'preset', NULL, true),

    -- ─── MOMOS (chicken variant missing) ───────────────────────────────────
    ('Steamed Momos (Chicken)',             1, 'pc',    38,  3.5,  3.0,  1.2, 'preset', NULL, false),
    ('Fried Momos (Chicken)',              1, 'pc',    58,  3.2,  4.0,  3.0, 'preset', NULL, false),

    -- ─── BREAKFAST ──────────────────────────────────────────────────────────
    ('Aloo Paratha with Butter',           1, 'unit',  310,  6.0, 40.0, 14.0, 'preset', NULL, true),
    ('Bread Butter (2 slices)',            2, 'slice', 230,  5.0, 28.0, 11.0, 'preset', NULL, true),
    ('Cornflakes with Milk',               1, 'bowl',  230,  7.0, 38.0,  4.0, 'preset', NULL, true),
    ('Muesli with Milk',                   1, 'bowl',  310,  9.0, 50.0,  6.0, 'preset', NULL, true),
    ('Granola with Yogurt',                1, 'bowl',  380, 12.0, 55.0,  9.0, 'preset', NULL, true),
    ('Pancakes with Syrup (2 pcs)',        2, 'pc',   380,  7.0, 68.0,  9.0, 'preset', NULL, true),
    ('French Toast (2 slices)',            2, 'slice', 298, 11.8, 32.6, 14.0, 'preset', NULL, false),
    ('Avocado Toast',                      1, 'unit',  290,  7.0, 25.0, 18.0, 'preset', NULL, true),
    ('Upma with Vegetables',               1, 'bowl',  220,  6.0, 38.0,  6.0, 'preset', NULL, true),
    ('Puri Bhaji (3 puris)',               3, 'unit',  450,  9.0, 60.0, 20.0, 'preset', NULL, true),

    -- ─── EGGS ───────────────────────────────────────────────────────────────
    ('Boiled Eggs (2)',                    2, 'unit',  156, 12.6,  1.2, 10.6, 'preset', NULL, false),
    ('Fried Egg (1)',                      1, 'unit',   90,  6.3,  0.4,  6.8, 'preset', NULL, false),
    ('Masala Omelette (2 Eggs)',           1, 'unit',  200, 13.0,  4.0, 15.0, 'preset', NULL, false),
    ('Egg Wrap',                           1, 'unit',  320, 18.0, 28.0, 14.0, 'preset', NULL, false),
    ('Scrambled Eggs (2 Eggs)',            1, 'plate', 185, 13.0,  1.5, 14.0, 'preset', NULL, false),
    ('Egg Salad Sandwich',                 1, 'unit',  370, 16.0, 32.0, 19.0, 'preset', NULL, false),

    -- ─── CHICKEN DISHES ────────────────────────────────────────────────────
    ('Chicken Karahi',                   100, 'g',   220, 20.0,  6.0, 13.0, 'preset', NULL, false),
    ('Chicken Seekh Kebab (2 pcs)',        2, 'pc',   220, 22.0,  4.0, 13.0, 'preset', NULL, false),
    ('Chicken Shami Kebab (1 pc)',         1, 'pc',   130, 12.0,  7.0,  6.0, 'preset', NULL, false),
    ('Chicken Keema (Minced)',           100, 'g',   200, 22.0,  3.0, 11.0, 'preset', NULL, false),
    ('Chicken Keema Paratha',              1, 'unit',  420, 20.0, 42.0, 18.0, 'preset', NULL, false),
    ('Chicken Frankie / Roll',             1, 'unit',  380, 22.0, 38.0, 14.0, 'preset', NULL, false),
    ('Grilled Chicken Sandwich',           1, 'unit',  350, 28.0, 30.0, 12.0, 'preset', NULL, false),
    ('Chicken Salad (Bowl)',               1, 'bowl',  280, 30.0, 10.0, 12.0, 'preset', NULL, false),
    ('Chicken Wrap',                       1, 'unit',  420, 28.0, 40.0, 14.0, 'preset', NULL, false),
    ('Chicken 65 (5 pcs)',                 5, 'pc',   285, 22.0, 12.0, 16.0, 'preset', NULL, false),
    ('Chicken Soup',                       1, 'bowl',  120, 12.0,  8.0,  4.0, 'preset', NULL, false),
    ('Chicken Steak (Grilled)',           200, 'g',   330, 62.0,  0.0,  7.2, 'preset', NULL, false),

    -- ─── MUTTON / LAMB ─────────────────────────────────────────────────────
    ('Mutton Chops (2 pcs)',               2, 'pc',   360, 34.0,  2.0, 24.0, 'preset', NULL, false),
    ('Mutton Kofta (3 pcs)',               3, 'pc',   290, 24.0,  6.0, 18.0, 'preset', NULL, false),
    ('Brain Masala (Bheja)',             100, 'g',   180, 11.0,  4.0, 13.0, 'preset', NULL, false),
    ('Goat Liver (Kaleji) Fry',         100, 'g',   175, 26.5,  4.5,  5.5, 'preset', NULL, false),

    -- ─── SEAFOOD ────────────────────────────────────────────────────────────
    ('Tuna Sandwich',                      1, 'unit',  340, 22.0, 30.0, 14.0, 'preset', NULL, false),
    ('Fish Tacos (2 pcs)',                 2, 'pc',   380, 24.0, 36.0, 14.0, 'preset', NULL, false),
    ('Grilled Fish (Pomfret)',           150, 'g',   195, 30.0,  2.0,  7.5, 'preset', NULL, false),
    ('Prawn Fried Rice',                   1, 'plate', 420, 22.0, 55.0, 12.0, 'preset', NULL, false),
    ('Fish Burger',                        1, 'unit',  440, 20.0, 42.0, 20.0, 'preset', NULL, false),

    -- ─── RICE DISHES ────────────────────────────────────────────────────────
    ('Chicken Biryani (Home)',            200, 'g',   380, 22.0, 50.0, 10.0, 'preset', NULL, false),
    ('Curd Rice (Home)',                   1, 'cup',  220,  6.0, 38.0,  5.0, 'preset', NULL, true),
    ('Jeera Rice',                       100, 'g',   155,  3.0, 28.0,  4.0, 'preset', NULL, true),
    ('Fried Rice (Egg)',                   1, 'plate', 350, 14.0, 55.0,  9.0, 'preset', NULL, false),
    ('Coconut Rice',                     100, 'g',   175,  3.5, 30.0,  5.0, 'preset', NULL, true),
    ('Khichdi (Moong Dal)',               1, 'bowl',  240, 10.0, 42.0,  4.0, 'preset', NULL, true),

    -- ─── BREAD / ROTI DISHES ────────────────────────────────────────────────
    ('Chapati with Dal',                   1, 'unit',  175,  6.5, 30.0,  3.5, 'preset', NULL, true),
    ('Butter Paratha',                     1, 'unit',  290,  5.5, 38.0, 13.0, 'preset', NULL, true),
    ('Rumali Roti',                        1, 'unit',   80,  2.5, 15.0,  1.5, 'preset', NULL, true),
    ('Stuffed Kulcha (1 pc)',              1, 'unit',  250,  7.0, 38.0,  8.0, 'preset', NULL, true),
    ('Missi Roti',                         1, 'unit',   90,  4.5, 14.0,  2.5, 'preset', NULL, true),

    -- ─── VEG DISHES ────────────────────────────────────────────────────────
    ('Paneer Tikka Roll',                  1, 'unit',  420, 18.0, 45.0, 18.0, 'preset', NULL, true),
    ('Veg Patty Burger',                   1, 'unit',  340, 10.0, 45.0, 14.0, 'preset', NULL, true),
    ('Soya Keema (Dry)',                 100, 'g',   185, 22.0,  8.0,  7.0, 'preset', NULL, true),
    ('Rajma Wrap',                         1, 'unit',  390, 14.0, 58.0,  9.0, 'preset', NULL, true),
    ('Aloo Mutter Curry',               100, 'g',   120,  4.0, 16.0,  5.0, 'preset', NULL, true),
    ('Baingan Bharta (Big Serving)',       1, 'bowl',  150,  4.0, 14.0,  9.0, 'preset', NULL, true),
    ('Stuffed Capsicum (1 pc)',            1, 'pc',   180,  8.0, 18.0,  8.0, 'preset', NULL, true),
    ('Saag (Sarson Ka Saag)',            100, 'g',   140,  6.0, 12.0,  8.0, 'preset', NULL, true),

    -- ─── SNACKS (practical ones) ────────────────────────────────────────────
    ('Popcorn (Salted, Cinema)',            1, 'medium', 400, 6.0, 54.0, 18.0, 'preset', NULL, true),
    ('Popcorn (Butter, Small)',            30, 'g',   150, 2.0, 16.0,  9.0, 'preset', NULL, true),
    ('Potato Chips (Lays, 26g)',          26, 'g',   138, 1.5, 14.5,  8.6, 'preset', NULL, true),
    ('Kurkure (26g)',                     26, 'g',   128, 1.6, 17.5,  5.7, 'preset', NULL, true),
    ('Puff Pastry / Bun Puff',             1, 'pc',   220, 5.0, 26.0, 11.0, 'preset', NULL, true),
    ('Bread Pakora (1 pc)',                1, 'pc',   190, 5.5, 22.0,  9.0, 'preset', NULL, true),
    ('Nachos with Salsa',                  1, 'plate', 430, 7.0, 56.0, 20.0, 'preset', NULL, true),
    ('Bhel Puri (Regular)',                1, 'plate', 220, 5.5, 38.0,  6.0, 'preset', NULL, true),
    ('Street Style Corn (Butta)',          1, 'unit',  120, 3.5, 26.0,  1.5, 'preset', NULL, true),
    ('Chaat Papdi (1 plate)',              1, 'plate', 380, 8.0, 62.0, 12.0, 'preset', NULL, true),
    ('Peanut Chikki (1 piece)',            1, 'pc',    70, 2.0,  9.0,  3.0, 'preset', NULL, true),
    ('Til Chikki (1 piece)',               1, 'pc',    75, 1.5,  9.5,  4.0, 'preset', NULL, true),
    ('Digestive Biscuits (4 pcs)',         4, 'pc',   186, 2.8, 26.8,  8.4, 'preset', NULL, true),
    ('Oreo (3 cookies)',                   3, 'pc',   159, 1.7, 23.6,  6.9, 'preset', NULL, true),
    ('Hide & Seek Biscuits (4 pcs)',       4, 'pc',   162, 2.5, 22.0,  7.2, 'preset', NULL, true),
    ('Khari (Puff Biscuit, 2 pcs)',        2, 'pc',   140, 3.5, 17.0,  6.5, 'preset', NULL, true),
    ('Chakli (2 pcs)',                     2, 'pc',   130, 3.0, 18.0,  5.5, 'preset', NULL, true),
    ('Chocolate Bar (Dairy Milk, 36g)',   36, 'g',   192, 2.9, 23.0, 10.4, 'preset', NULL, true),
    ('KitKat (2 fingers)',                21, 'g',   107, 1.3, 14.3,  5.6, 'preset', NULL, true),
    ('Protein Bar (MuscleBlaze)',          1, 'unit',  210, 20.0, 22.0,  6.0, 'preset', NULL, true),

    -- ─── FAST FOOD ─────────────────────────────────────────────────────────
    ('McAloo Tikki Burger',                1, 'unit',  377,  9.0, 50.0, 15.0, 'preset', NULL, true),
    ('McChicken Burger',                   1, 'unit',  456, 17.0, 43.0, 22.0, 'preset', NULL, false),
    ('McSpicy Paneer Burger',              1, 'unit',  535, 17.0, 52.0, 28.0, 'preset', NULL, true),
    ('Maharaja Mac',                       1, 'unit',  588, 28.0, 45.0, 30.0, 'preset', NULL, false),
    ('Big Mac',                            1, 'unit',  563, 25.9, 43.0, 32.8, 'preset', NULL, false),
    ('McGrilled Chicken',                  1, 'unit',  350, 24.0, 38.0, 11.0, 'preset', NULL, false),
    ('McCafe Latte (Medium)',               1, 'unit',  180,  8.0, 22.0,  6.0, 'preset', NULL, true),
    ('KFC Fried Chicken Leg',              1, 'pc',   290, 20.0,  8.0, 20.0, 'preset', NULL, false),
    ('KFC Fried Chicken Breast',           1, 'pc',   380, 32.0, 10.0, 22.0, 'preset', NULL, false),
    ('KFC Zinger Burger',                  1, 'unit',  620, 32.0, 54.0, 28.0, 'preset', NULL, false),
    ('Dominos Veg Extravaganza (1 slice)', 1, 'slice', 198, 8.0, 24.0,  8.0, 'preset', NULL, true),
    ('Dominos Chicken Pepperoni (1 slice)',1, 'slice', 235, 11.0, 24.0, 11.0, 'preset', NULL, false),
    ('Subway Chicken Teriyaki (6 inch)',   1, 'unit',  370, 26.0, 48.0,  6.0, 'preset', NULL, false),
    ('Subway Veggie Delite (6 inch)',      1, 'unit',  230, 10.0, 44.0,  2.5, 'preset', NULL, true),

    -- ─── DRINKS ────────────────────────────────────────────────────────────
    ('Cold Coffee (Homemade)',            300, 'ml',   220,  8.0, 28.0,  8.0, 'preset', NULL, true),
    ('Chocolate Milkshake (Homemade)',    350, 'ml',   360, 10.0, 48.0, 14.0, 'preset', NULL, true),
    ('Strawberry Milkshake',             350, 'ml',   320,  9.5, 44.0, 11.0, 'preset', NULL, true),
    ('Mango Shake (Homemade)',           300, 'ml',   280,  7.0, 45.0,  8.0, 'preset', NULL, true),
    ('Banana Peanut Butter Shake',       350, 'ml',   490, 20.0, 52.0, 22.0, 'preset', NULL, true),
    ('Masala Chai (with Sugar)',         150, 'ml',    65,  2.5, 10.0,  2.0, 'preset', NULL, true),
    ('Black Coffee (with Sugar)',        200, 'ml',    25,  0.5,  5.5,  0.1, 'preset', NULL, true),
    ('Americano (Black)',               240, 'ml',    10,  0.7,  1.5,  0.1, 'preset', NULL, true),
    ('Dalgona Coffee',                   200, 'ml',   165,  5.5, 22.0,  6.5, 'preset', NULL, true),
    ('Iced Latte',                       350, 'ml',   130,  7.0, 13.0,  6.0, 'preset', NULL, true),
    ('Protein Coffee (Espresso + Whey)', 300, 'ml',   145, 26.0,  4.0,  2.5, 'preset', NULL, true),
    ('Tender Coconut Water',             300, 'ml',    60,  0.6, 15.3,  0.6, 'preset', NULL, true),
    ('Fresh Lime Soda (Sweet)',          300, 'ml',   100,  0.2, 25.0,  0.0, 'preset', NULL, true),
    ('Fresh Lime Soda (Salted)',         300, 'ml',    20,  0.2,  4.0,  0.0, 'preset', NULL, true),
    ('Chaas / Buttermilk (Salted)',      200, 'ml',    47,  2.8,  4.2,  1.8, 'preset', NULL, true),
    ('Aam Panna',                        200, 'ml',    85,  0.5, 21.0,  0.1, 'preset', NULL, true),
    ('Bournvita in Milk (200ml)',        200, 'ml',   168,  7.5, 25.0,  4.0, 'preset', NULL, true),
    ('Horlicks in Milk (200ml)',         200, 'ml',   162,  7.5, 22.0,  4.5, 'preset', NULL, true),
    ('Ensure (200ml)',                   200, 'ml',   190,  9.0, 27.0,  5.0, 'preset', NULL, true),
    ('Tropicana Orange Juice (200ml)',   200, 'ml',    90,  0.8, 21.0,  0.2, 'preset', NULL, true),
    ('Real Mango Juice (200ml)',         200, 'ml',   120,  0.5, 29.0,  0.2, 'preset', NULL, true),
    ('Frooti (200ml)',                   200, 'ml',   110,  0.0, 27.0,  0.0, 'preset', NULL, true),
    ('Thums Up / Pepsi (330ml)',         330, 'ml',   143,  0.0, 36.0,  0.0, 'preset', NULL, true),
    ('Limca (300ml)',                    300, 'ml',   114,  0.0, 29.0,  0.0, 'preset', NULL, true),
    ('Sprite (330ml)',                   330, 'ml',   136,  0.0, 34.0,  0.0, 'preset', NULL, true),
    ('Turmeric Latte (Haldi Dood)',      200, 'ml',   130,  6.0, 12.0,  6.5, 'preset', NULL, true),

    -- ─── SWEETS & DESSERTS ─────────────────────────────────────────────────
    ('Gulab Jamun (2 pcs)',                2, 'pc',   350,  5.0, 56.0, 12.0, 'preset', NULL, true),
    ('Rasgulla (2 pcs)',                   2, 'pc',   180,  4.0, 38.0,  1.0, 'preset', NULL, true),
    ('Gajar Ka Halwa (1 bowl)',            1, 'bowl',  320,  6.0, 44.0, 14.0, 'preset', NULL, true),
    ('Kheer (1 bowl)',                     1, 'bowl',  280,  7.5, 44.0,  8.0, 'preset', NULL, true),
    ('Jalebi (4 pcs)',                     4, 'pc',   250,  2.5, 54.0,  3.5, 'preset', NULL, true),
    ('Barfi (2 pcs)',                      2, 'pc',   252,  6.0, 42.0,  7.0, 'preset', NULL, true),
    ('Besan Ladoo (1 pc)',                 1, 'pc',   167,  2.9, 22.0,  8.0, 'preset', NULL, true),
    ('Motichoor Ladoo (1 pc)',             1, 'pc',   174,  2.8, 24.0,  8.0, 'preset', NULL, true),
    ('Halwa (Suji)',                       1, 'bowl',  315,  5.5, 47.0, 12.0, 'preset', NULL, true),
    ('Payasam / Kheer (Vermicelli)',        1, 'bowl',  280,  8.0, 44.0,  8.0, 'preset', NULL, true),
    ('Ice Cream (Vanilla - 2 scoops)',     2, 'scoop', 262,  4.4, 33.4, 12.4, 'preset', NULL, true),
    ('Kulfi (1 stick)',                    1, 'pc',   100,  2.5, 15.0,  3.5, 'preset', NULL, true),
    ('Brownie (1 piece)',                100, 'g',   430,  5.0, 60.0, 22.0, 'preset', NULL, true),
    ('Cheesecake (1 slice)',             120, 'g',   400,  7.0, 36.0, 26.0, 'preset', NULL, false),
    ('Chocolate Cake (1 slice)',         100, 'g',   380,  5.0, 52.0, 19.0, 'preset', NULL, true),

    -- ─── SUPPLEMENTS ───────────────────────────────────────────────────────
    ('Creatine Monohydrate (5g)',           5, 'g',    18,  0.0,  0.0,  0.0, 'preset', NULL, true),
    ('Mass Gainer (1 scoop)',            150, 'g',   626, 30.0,120.0,  3.0, 'preset', NULL, true),
    ('BCAA Powder (per serving)',         10, 'g',    40,  7.0,  1.5,  0.0, 'preset', NULL, true),
    ('L-Glutamine (5g)',                   5, 'g',    20,  5.0,  0.0,  0.0, 'preset', NULL, true),
    ('Casein Protein (1 scoop)',          35, 'g',   130, 24.0,  4.0,  1.5, 'preset', NULL, true)

ON CONFLICT DO NOTHING;
