-- Admin stats function to securely aggregate global data
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS
SET search_path = public
AS $$
DECLARE
    total_users bigint;
    total_logs bigint;
    active_today bigint;
    total_calories numeric;
BEGIN
    -- 1. Count total users from user_settings (which is 1:1 with auth.users)
    SELECT count(*) INTO total_users FROM public.user_settings;

    -- 2. Count total meal entries
    SELECT count(*) INTO total_logs FROM public.meal_entries;

    -- 3. Calculate active users today (users who have a log for today)
    SELECT count(DISTINCT user_id) INTO active_today 
    FROM public.daily_logs 
    WHERE date = CURRENT_DATE;

    -- 4. Aggregate total calories logged today
    SELECT COALESCE(sum(calories * quantity), 0) INTO total_calories
    FROM public.meal_entries
    WHERE daily_log_id IN (SELECT id FROM public.daily_logs WHERE date = CURRENT_DATE);

    RETURN json_build_object(
        'total_users', total_users,
        'total_logs', total_logs,
        'active_today', active_today,
        'total_calories_today', total_calories
    );
END;
$$;
