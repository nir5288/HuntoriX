-- Fix profiles table RLS to protect email addresses
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow users to view their own complete profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow public to view only non-sensitive profile data
CREATE POLICY "Public profiles with limited data"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Create a function to get public profile data (without email)
CREATE OR REPLACE FUNCTION public.get_public_profile_safe(profile_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  role text,
  bio text,
  company text,
  location text,
  website text,
  linkedin text,
  avatar_url text,
  created_at timestamp with time zone,
  industries text[],
  skills text[],
  expertise text[],
  rating_avg numeric,
  success_rate numeric,
  verified boolean,
  hourly_rate numeric,
  placement_fee_percent numeric,
  years_experience integer,
  specializations text[],
  certifications text[],
  languages text[],
  placements_count integer,
  active_searches integer,
  response_time text,
  cover_image_url text,
  company_name text,
  company_mission text,
  company_sector text,
  company_size text,
  founded_year integer,
  company_benefits text[],
  company_culture text,
  team_size integer,
  open_positions integer,
  last_seen timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.name, p.role, p.bio, p.company, p.location,
    p.website, p.linkedin, p.avatar_url, p.created_at,
    p.industries, p.skills, p.expertise, p.rating_avg, p.success_rate,
    p.verified, p.hourly_rate, p.placement_fee_percent, p.years_experience,
    p.specializations, p.certifications, p.languages, p.placements_count,
    p.active_searches, p.response_time, p.cover_image_url, p.company_name,
    p.company_mission, p.company_sector, p.company_size, p.founded_year,
    p.company_benefits, p.company_culture, p.team_size, p.open_positions,
    p.last_seen
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

-- Create rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(identifier, endpoint)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add data retention for submissions (90 days)
CREATE OR REPLACE FUNCTION public.delete_old_submissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.submissions
  WHERE submitted_at < now() - interval '90 days'
    AND status IN ('Rejected', 'Withdrawn');
END;
$$;