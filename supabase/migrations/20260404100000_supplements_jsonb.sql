
-- Add supplements list to user_settings (which supplements the user has configured)
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS supplements JSONB NOT NULL DEFAULT '[]';

-- Add supplements_taken to daily_logs (which ones were taken today, keyed by supplement id)
ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS supplements_taken JSONB NOT NULL DEFAULT '{}';
