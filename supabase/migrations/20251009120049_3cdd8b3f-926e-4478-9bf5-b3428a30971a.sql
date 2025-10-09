-- Update existing hold history entries to mark them as resolved 
-- if their associated job is no longer on hold
UPDATE public.job_hold_history
SET resolved_at = NOW()
WHERE resolved_at IS NULL
AND job_id IN (
  SELECT id FROM public.jobs
  WHERE status != 'on_hold'
);