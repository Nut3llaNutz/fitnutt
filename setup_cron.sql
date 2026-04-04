-- 1. Add Timezone to User Settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- 2. Ensure pg_cron and pg_net are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Create the webhook function to invoke the edge function securely
CREATE OR REPLACE FUNCTION invoke_send_reminders()
RETURNS void AS $$
DECLARE
  -- Replace this with your actual Anon Key or Service Role Key
  auth_header TEXT := 'Bearer YOUR_SUPABASE_ANON_KEY';
BEGIN
  PERFORM net.http_post(
      -- Replace YOUR_PROJECT_ID with the part from your .supabase.co url
      url:='https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-reminders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', auth_header
      )
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Remove any old hourly schedule first (safe to run even if it doesn't exist)
SELECT cron.unschedule('send-supplement-reminders-hourly');

-- 5. Schedule the cron job to run every 15 minutes
SELECT cron.schedule(
    'send-supplement-reminders-15min',
    '*/15 * * * *', 
    'SELECT invoke_send_reminders()'
);
