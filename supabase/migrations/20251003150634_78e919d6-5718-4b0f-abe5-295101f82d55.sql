-- Add foreign key constraint for saved_jobs to jobs
ALTER TABLE public.saved_jobs
ADD CONSTRAINT saved_jobs_job_id_fkey
FOREIGN KEY (job_id) 
REFERENCES public.jobs(id) 
ON DELETE CASCADE;