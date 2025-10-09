-- Drop the existing check constraint
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Add the new check constraint with on_hold included
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('open', 'closed', 'on_hold', 'shortlisted', 'awarded', 'success'));