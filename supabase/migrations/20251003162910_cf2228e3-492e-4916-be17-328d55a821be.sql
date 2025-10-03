-- Create job_edit_history table to track all changes made to jobs
CREATE TABLE IF NOT EXISTS public.job_edit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES public.profiles(id),
  edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_edit_history ENABLE ROW LEVEL SECURITY;

-- Policy: Job owners can view edit history
CREATE POLICY "Job owners can view edit history"
ON public.job_edit_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_edit_history.job_id
    AND jobs.created_by = auth.uid()
  )
);

-- Policy: System can insert edit history
CREATE POLICY "System can insert edit history"
ON public.job_edit_history
FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_job_edit_history_job_id ON public.job_edit_history(job_id);
CREATE INDEX idx_job_edit_history_edited_at ON public.job_edit_history(edited_at DESC);