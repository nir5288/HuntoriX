-- Add new fields to profiles table for enhanced employer and headhunter profiles

-- Fields for employers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_size text,
ADD COLUMN IF NOT EXISTS company_culture text,
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- Fields for headhunters
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS regions text[],
ADD COLUMN IF NOT EXISTS availability boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS years_experience integer,
ADD COLUMN IF NOT EXISTS placements_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_time_hours integer;

-- Create invitations table for job invitations from employers to headhunters
CREATE TABLE IF NOT EXISTS public.job_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  headhunter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(job_id, headhunter_id)
);

-- Enable RLS on job_invitations
ALTER TABLE public.job_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_invitations
CREATE POLICY "Employers can create invitations"
ON public.job_invitations
FOR INSERT
TO authenticated
WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Employers can view their sent invitations"
ON public.job_invitations
FOR SELECT
TO authenticated
USING (employer_id = auth.uid());

CREATE POLICY "Headhunters can view invitations sent to them"
ON public.job_invitations
FOR SELECT
TO authenticated
USING (headhunter_id = auth.uid());

CREATE POLICY "Headhunters can update invitations sent to them"
ON public.job_invitations
FOR UPDATE
TO authenticated
USING (headhunter_id = auth.uid());

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_job_invitations_headhunter ON public.job_invitations(headhunter_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_employer ON public.job_invitations(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_status ON public.job_invitations(status);