-- Add job_id column to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id);