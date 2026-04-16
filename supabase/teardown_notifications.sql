-- 1. Unschedule any notification cron jobs
SELECT cron.unschedule('send-supplement-reminders-15min');
SELECT cron.unschedule('send-supplement-reminders-hourly');

-- 2. Drop the webhook trigger function
DROP FUNCTION IF EXISTS invoke_send_reminders();

-- 3. Drop the push_subscriptions table
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
