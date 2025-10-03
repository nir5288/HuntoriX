-- Create saved_jobs table for users to bookmark/like jobs
CREATE TABLE public.saved_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved jobs
CREATE POLICY "Users can view their own saved jobs"
ON public.saved_jobs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can save jobs
CREATE POLICY "Users can save jobs"
ON public.saved_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own jobs
CREATE POLICY "Users can delete their own saved jobs"
ON public.saved_jobs
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job_id ON public.saved_jobs(job_id);