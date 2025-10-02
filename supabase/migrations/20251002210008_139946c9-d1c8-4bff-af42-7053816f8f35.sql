-- Add visibility column to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));