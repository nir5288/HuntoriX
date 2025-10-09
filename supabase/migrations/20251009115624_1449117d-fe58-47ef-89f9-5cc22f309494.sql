-- Add foreign key relationship from job_hold_history to profiles
ALTER TABLE public.job_hold_history
ADD CONSTRAINT job_hold_history_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;