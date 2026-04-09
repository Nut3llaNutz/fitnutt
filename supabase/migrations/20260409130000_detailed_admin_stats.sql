-- Drop old function
DROP FUNCTION IF EXISTS public.get_admin_stats();

-- Comprehensive Admin detailed stats function
CREATE OR REPLACE FUNCTION public.get_admin_detailed_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    summary_data json;
    trend_data json;
    rank_data json;
    top_items_data json;
BEGIN
    -- 1. Summary Block (Current Stats)
    SELECT json_build_object(
        'total_users', (SELECT count(*) FROM public.user_settings),
        'total_logs', (SELECT count(*) FROM public.meal_entries),
        'active_today', (SELECT count(DISTINCT user_id) FROM public.daily_logs WHERE date = CURRENT_DATE),
        'total_calories_today', (SELECT COALESCE(sum(calories * quantity), 0) FROM public.meal_entries WHERE daily_log_id IN (SELECT id FROM public.daily_logs WHERE date = CURRENT_DATE))
    ) INTO summary_data;

    -- 2. Trends Block (Last 7 Days)
    SELECT json_agg(t) INTO trend_data
    FROM (
        SELECT 
            d.date::text as date,
            COUNT(DISTINCT dl.user_id) as users,
            COUNT(me.id) as logs
        FROM (
            SELECT (CURRENT_DATE - i) as date 
            FROM generate_series(0, 6) i
        ) d
        LEFT JOIN daily_logs dl ON dl.date = d.date
        LEFT JOIN meal_entries me ON me.daily_log_id = dl.id
        GROUP BY d.date
        ORDER BY d.date ASC
    ) t;

    -- 3. Rank Distribution Block
    SELECT json_agg(r) INTO rank_data
    FROM (
        SELECT 
            CASE 
                WHEN total_xp >= 100000 THEN 'GOD OF IRON (50+)'
                WHEN total_xp >= 50000 THEN 'TITAN (40+)'
                WHEN total_xp >= 25000 THEN 'GENETIC FREAK (30+)'
                WHEN total_xp >= 15000 THEN 'IRON LEGEND (20+)'
                WHEN total_xp >= 7500 THEN 'MASS BUILDER (15+)'
                WHEN total_xp >= 3000 THEN 'PUMP APPRENTICE (10+)'
                WHEN total_xp >= 1000 THEN 'IRON INITIATE (5+)'
                ELSE 'GYM NOVICE'
            END as rank,
            COUNT(*) as count
        FROM public.user_settings
        GROUP BY rank
        ORDER BY count DESC
    ) r;

    -- 4. Top Fuel Items (Top 5)
    SELECT json_agg(i) INTO top_items_data
    FROM (
        SELECT food_name as name, COUNT(*) as count
        FROM public.meal_entries
        GROUP BY food_name
        ORDER BY count DESC
        LIMIT 5
    ) i;

    -- Combine all into one JSON result
    SELECT json_build_object(
        'summary', summary_data,
        'trends', trend_data,
        'ranks', rank_data,
        'top_items', top_items_data
    ) INTO result;

    RETURN result;
END;
$$;
