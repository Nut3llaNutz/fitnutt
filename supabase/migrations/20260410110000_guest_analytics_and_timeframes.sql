-- 1. Create Guest Analytics table
CREATE TABLE IF NOT EXISTS public.guest_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint TEXT, -- Simplified anonymous identifier
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow public inserts/updates via RPC
ALTER TABLE public.guest_analytics ENABLE ROW LEVEL SECURITY;

-- 2. Public RPC for Guest Heartbeat
CREATE OR REPLACE FUNCTION public.track_guest_session(p_fingerprint TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.guest_analytics (fingerprint, last_seen_at)
    VALUES (p_fingerprint, NOW())
    ON CONFLICT (id) DO UPDATE -- This assumes we pass the UUID if we have it locally
    SET last_seen_at = EXCLUDED.last_seen_at;
    
    -- Actually, if we use fingerprint as key:
    -- But let's stick to a simpler logic: just track a 'ping'
    INSERT INTO public.guest_analytics (fingerprint, last_seen_at)
    VALUES (p_fingerprint, NOW())
    ON CONFLICT DO NOTHING; -- We'll just insert a new record for every unique fingerprint per day or session
END;
$$;

-- 3. Advanced Admin Stats with Timeframes
DROP FUNCTION IF EXISTS public.get_admin_detailed_stats();
CREATE OR REPLACE FUNCTION public.get_admin_detailed_stats(p_timeframe TEXT DEFAULT '7d')
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
    v_interval INTERVAL;
    v_days INTEGER;
BEGIN
    -- Set interval based on timeframe param
    CASE p_timeframe
        WHEN '7d' THEN v_interval := '7 days'; v_days := 6;
        WHEN '30d' THEN v_interval := '30 days'; v_days := 29;
        WHEN '6m' THEN v_interval := '6 months'; v_days := 179;
        WHEN '1y' THEN v_interval := '1 year'; v_days := 364;
        ELSE v_interval := '100 years'; v_days := 3650; -- All time effectively
    END CASE;

    -- 1. Summary Block
    SELECT json_build_object(
        'total_users', (SELECT count(*) FROM public.user_settings),
        'total_logs_all_time', (SELECT count(*) FROM public.meal_entries),
        'total_logs_today', (SELECT count(*) FROM public.meal_entries WHERE daily_log_id IN (SELECT id FROM public.daily_logs WHERE date = CURRENT_DATE)),
        'total_calories_all_time', (SELECT COALESCE(sum(calories * quantity), 0) FROM public.meal_entries),
        'total_calories_today', (SELECT COALESCE(sum(calories * quantity), 0) FROM public.meal_entries WHERE daily_log_id IN (SELECT id FROM public.daily_logs WHERE date = CURRENT_DATE)),
        'active_residents_today', (SELECT count(DISTINCT user_id) FROM public.user_settings WHERE updated_at >= CURRENT_DATE),
        'active_guests_today', (SELECT count(*) FROM public.guest_analytics WHERE last_seen_at >= CURRENT_DATE),
        'total_guests_ever', (SELECT count(*) FROM public.guest_analytics)
    ) INTO summary_data;

    -- 2. Trends Block
    SELECT json_agg(t) INTO trend_data
    FROM (
        SELECT 
            d.date::text as date,
            COUNT(DISTINCT dl.user_id) as users,
            COUNT(me.id) as logs
        FROM (
            SELECT (CURRENT_DATE - i) as date 
            FROM generate_series(0, v_days) i
        ) d
        LEFT JOIN daily_logs dl ON dl.date = d.date
        LEFT JOIN meal_entries me ON me.daily_log_id = dl.id
        GROUP BY d.date
        ORDER BY d.date ASC
    ) t;

    -- 3. Rank Distribution
    SELECT json_agg(r) INTO rank_data
    FROM (
        SELECT 
            CASE 
                WHEN total_xp >= 100000 THEN 'GOD OF IRON'
                WHEN total_xp >= 50000 THEN 'TITAN'
                WHEN total_xp >= 25000 THEN 'GENETIC FREAK'
                WHEN total_xp >= 15000 THEN 'IRON LEGEND'
                WHEN total_xp >= 7500 THEN 'MASS BUILDER'
                WHEN total_xp >= 3000 THEN 'PUMP APPRENTICE'
                WHEN total_xp >= 1000 THEN 'IRON INITIATE'
                ELSE 'GYM NOVICE'
            END as rank,
            COUNT(*) as count
        FROM public.user_settings
        GROUP BY rank
        ORDER BY count DESC
    ) r;

    -- 4. Top Fuel (Preset Only + Respect Timeframe)
    SELECT json_agg(i) INTO top_items_data
    FROM (
        SELECT me.food_name as name, COUNT(*) as count
        FROM public.meal_entries me
        JOIN public.foods f ON me.food_id = f.id
        WHERE f.source = 'preset'
        AND me.food_name IS NOT NULL 
        AND me.food_name != ''
        AND me.created_at >= (NOW() - v_interval)
        GROUP BY me.food_name
        ORDER BY count DESC
        LIMIT 5
    ) i;

    SELECT json_build_object(
        'summary', summary_data,
        'trends', trend_data,
        'ranks', rank_data,
        'top_items', top_items_data
    ) INTO result;

    RETURN result;
END;
$$;
