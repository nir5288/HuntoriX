-- Backfill existing exclusive jobs with 14-day lock period
UPDATE public.jobs
SET 
  exclusive_since = created_at,
  exclusive_until = created_at + INTERVAL '14 days'
WHERE is_exclusive = true
  AND (exclusive_since IS NULL OR exclusive_until IS NULL);