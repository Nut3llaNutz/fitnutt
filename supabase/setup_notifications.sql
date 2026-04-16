-- 1. Create the push_subscriptions table
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Create the webhook function to invoke the edge function securely
CREATE OR REPLACE FUNCTION invoke_send_reminders()
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
      url:='https://yjlbhksiyivcnjqrcsvg.supabase.co/functions/v1/send-reminders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbGJoa3NpeWl2Y25qcXJjc3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzIwMjIsImV4cCI6MjA5MDcwODAyMn0.LQZdYOmS3KeeUERb52nyelxt_R9stlS1A3TTTuii0_w'
      )
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Schedule the cron job to run every 15 minutes
-- First unschedule to avoid duplicates if rerun
SELECT cron.unschedule('send-supplement-reminders-15min') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-supplement-reminders-15min');

SELECT cron.schedule(
    'send-supplement-reminders-15min',
    '*/15 * * * *', 
    'SELECT invoke_send_reminders()'
);
