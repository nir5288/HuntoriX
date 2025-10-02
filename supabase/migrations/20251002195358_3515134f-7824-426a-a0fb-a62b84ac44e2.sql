-- Remove the policy that exposes all data
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Drop the view since it won't work with SECURITY INVOKER given our RLS constraints  
DROP VIEW IF EXISTS public.public_profiles;

-- Create a secure function to return public profile data
-- This function uses SECURITY DEFINER but only exposes non-sensitive columns
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  role app_role,
  avatar_url text,
  bio text,
  company_name text,
  company_size text,
  company_culture text,
  company_mission text,
  company_sector text,
  company_hq text,
  industries text[],
  expertise text[],
  skills text[],
  languages text[],
  regions text[],
  portfolio_links text[],
  team_members jsonb,
  hourly_rate numeric,
  placement_fee_percent numeric,
  pricing_model pricing_model,
  verified boolean,
  rating_avg numeric,
  success_rate numeric,
  placements_count integer,
  years_experience integer,
  response_time_hours integer,
  avg_time_to_fill_days integer,
  availability boolean,
  status user_status,
  cover_image_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id,
    name,
    role,
    avatar_url,
    bio,
    company_name,
    company_size,
    company_culture,
    company_mission,
    company_sector,
    company_hq,
    industries,
    expertise,
    skills,
    languages,
    regions,
    portfolio_links,
    team_members,
    hourly_rate,
    placement_fee_percent,
    pricing_model,
    verified,
    rating_avg,
    success_rate,
    placements_count,
    years_experience,
    response_time_hours,
    avg_time_to_fill_days,
    availability,
    status,
    cover_image_url,
    created_at
  FROM public.profiles;
$$;

-- Create function to get a single public profile by ID
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  role app_role,
  avatar_url text,
  bio text,
  company_name text,
  company_size text,
  company_culture text,
  company_mission text,
  company_sector text,
  company_hq text,
  industries text[],
  expertise text[],
  skills text[],
  languages text[],
  regions text[],
  portfolio_links text[],
  team_members jsonb,
  hourly_rate numeric,
  placement_fee_percent numeric,
  pricing_model pricing_model,
  verified boolean,
  rating_avg numeric,
  success_rate numeric,
  placements_count integer,
  years_experience integer,
  response_time_hours integer,
  avg_time_to_fill_days integer,
  availability boolean,
  status user_status,
  cover_image_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id,
    name,
    role,
    avatar_url,
    bio,
    company_name,
    company_size,
    company_culture,
    company_mission,
    company_sector,
    company_hq,
    industries,
    expertise,
    skills,
    languages,
    regions,
    portfolio_links,
    team_members,
    hourly_rate,
    placement_fee_percent,
    pricing_model,
    verified,
    rating_avg,
    success_rate,
    placements_count,
    years_experience,
    response_time_hours,
    avg_time_to_fill_days,
    availability,
    status,
    cover_image_url,
    created_at
  FROM public.profiles
  WHERE profiles.id = profile_id;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated, anon;

-- Add comments explaining the security model
COMMENT ON FUNCTION public.get_public_profiles() IS 
'Returns all profiles excluding sensitive data (email, contact_phone, contact_person). 
Uses SECURITY DEFINER to bypass RLS but explicitly excludes sensitive columns.';

COMMENT ON FUNCTION public.get_public_profile(uuid) IS 
'Returns a single profile by ID excluding sensitive data (email, contact_phone, contact_person). 
Uses SECURITY DEFINER to bypass RLS but explicitly excludes sensitive columns.';