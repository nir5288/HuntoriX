-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
DROP FUNCTION IF EXISTS public.get_public_profiles(text);

-- Recreate get_public_profile function to include last_seen
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(
  id uuid, 
  email text, 
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.email, p.name, p.role, p.bio, p.company, p.location,
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
END;
$$;

-- Recreate get_public_profiles function to include last_seen
CREATE OR REPLACE FUNCTION public.get_public_profiles(profile_role text DEFAULT NULL::text)
RETURNS TABLE(
  id uuid, 
  email text, 
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF profile_role IS NULL THEN
    RETURN QUERY
    SELECT 
      p.id, p.email, p.name, p.role, p.bio, p.company, p.location, 
      p.website, p.linkedin, p.avatar_url, p.created_at,
      p.industries, p.skills, p.expertise, p.rating_avg, p.success_rate,
      p.verified, p.hourly_rate, p.placement_fee_percent, p.years_experience,
      p.specializations, p.certifications, p.languages, p.placements_count,
      p.active_searches, p.response_time, p.cover_image_url, p.company_name,
      p.company_mission, p.company_sector, p.company_size, p.founded_year,
      p.company_benefits, p.company_culture, p.team_size, p.open_positions,
      p.last_seen
    FROM public.profiles p;
  ELSE
    RETURN QUERY
    SELECT 
      p.id, p.email, p.name, p.role, p.bio, p.company, p.location,
      p.website, p.linkedin, p.avatar_url, p.created_at,
      p.industries, p.skills, p.expertise, p.rating_avg, p.success_rate,
      p.verified, p.hourly_rate, p.placement_fee_percent, p.years_experience,
      p.specializations, p.certifications, p.languages, p.placements_count,
      p.active_searches, p.response_time, p.cover_image_url, p.company_name,
      p.company_mission, p.company_sector, p.company_size, p.founded_year,
      p.company_benefits, p.company_culture, p.team_size, p.open_positions,
      p.last_seen
    FROM public.profiles p
    WHERE p.role = profile_role;
  END IF;
END;
$$;