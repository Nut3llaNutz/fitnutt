-- 1. Create the push_subscriptions table (safe to re-run)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop old policy if exists before recreating
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Create/replace the webhook function
-- NOTE: Uses service_role key (not anon key) for reliable auth
CREATE OR REPLACE FUNCTION invoke_send_reminders()
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
      url:='https://yjlbhksiyivcnjqrcsvg.supabase.co/functions/v1/send-reminders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the cron job to run every 15 minutes
-- Unschedule first to avoid duplicates
SELECT cron.unschedule('send-supplement-reminders-15min');

SELECT cron.schedule(
    'send-supplement-reminders-15min',
    '*/15 * * * *', 
    'SELECT invoke_send_reminders()'
);

-- Verify it's scheduled
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'send-supplement-reminders-15min';
