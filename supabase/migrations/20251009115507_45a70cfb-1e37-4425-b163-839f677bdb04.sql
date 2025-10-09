-- Create table to track job hold history
CREATE TABLE public.job_hold_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.job_hold_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all hold history"
ON public.job_hold_history
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Job owners can view their job hold history"
ON public.job_hold_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_hold_history.job_id
    AND jobs.created_by = auth.uid()
  )
);

CREATE POLICY "Job owners can insert hold history"
ON public.job_hold_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_hold_history.job_id
    AND jobs.created_by = auth.uid()
  )
);

-- Index for faster queries
CREATE INDEX idx_job_hold_history_job_id ON public.job_hold_history(job_id);
CREATE INDEX idx_job_hold_history_created_at ON public.job_hold_history(created_at DESC);