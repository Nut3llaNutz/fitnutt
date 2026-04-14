-- 1. Deduplicate existing records (Keep the latest seen for each fingerprint)
DELETE FROM public.guest_analytics 
WHERE id NOT IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY fingerprint ORDER BY last_seen_at DESC) as r 
        FROM public.guest_analytics
    ) t 
    WHERE r = 1
);

-- 2. Add Unique Constraint to Fingerprint
ALTER TABLE public.guest_analytics 
ADD CONSTRAINT guest_analytics_fingerprint_key UNIQUE (fingerprint);

-- 3. Update track_guest_session to perform an UPSERT
CREATE OR REPLACE FUNCTION public.track_guest_session(p_fingerprint TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.guest_analytics (fingerprint, last_seen_at)
    VALUES (p_fingerprint, NOW())
    ON CONFLICT (fingerprint) DO UPDATE 
    SET last_seen_at = EXCLUDED.last_seen_at;
END;
$$;
