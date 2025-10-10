-- Update the jobs_status_check constraint to include 'pending_review'
ALTER TABLE public.jobs 
DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_status_check 
CHECK (status IN ('open', 'closed', 'on_hold', 'shortlisted', 'awarded', 'success', 'pending_review'));