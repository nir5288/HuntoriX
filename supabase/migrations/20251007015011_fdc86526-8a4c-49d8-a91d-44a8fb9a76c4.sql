-- Update jobs status check to allow pending_review
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status = ANY (ARRAY['open'::text, 'closed'::text, 'filled'::text, 'pending_review'::text]));