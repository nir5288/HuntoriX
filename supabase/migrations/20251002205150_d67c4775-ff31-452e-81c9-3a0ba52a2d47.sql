-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_public_profiles(TEXT);
DROP FUNCTION IF EXISTS public.get_public_profile(UUID);

-- Recreate get_public_profiles function with all columns
CREATE FUNCTION public.get_public_profiles(profile_role TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  bio TEXT,
  company TEXT,
  location TEXT,
  website TEXT,
  linkedin TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  industries TEXT[],
  skills TEXT[],
  expertise TEXT[],
  rating_avg NUMERIC,
  success_rate NUMERIC,
  verified BOOLEAN,
  hourly_rate NUMERIC,
  placement_fee_percent NUMERIC,
  years_experience INTEGER,
  specializations TEXT[],
  certifications TEXT[],
  languages TEXT[],
  placements_count INTEGER,
  active_searches INTEGER,
  response_time TEXT,
  cover_image_url TEXT,
  company_name TEXT,
  company_mission TEXT,
  company_sector TEXT,
  company_size TEXT,
  founded_year INTEGER,
  company_benefits TEXT[],
  company_culture TEXT,
  team_size INTEGER,
  open_positions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF profile_role IS NULL THEN
    RETURN QUERY
    SELECT p.id, p.email, p.name, p.role, p.bio, p.company, p.location, 
           p.website, p.linkedin, p.avatar_url, p.created_at,
           p.industries, p.skills, p.expertise, p.rating_avg, p.success_rate,
           p.verified, p.hourly_rate, p.placement_fee_percent, p.years_experience,
           p.specializations, p.certifications, p.languages, p.placements_count,
           p.active_searches, p.response_time, p.cover_image_url, p.company_name,
           p.company_mission, p.company_sector, p.company_size, p.founded_year,
           p.company_benefits, p.company_culture, p.team_size, p.open_positions
    FROM public.profiles p;
  ELSE
    RETURN QUERY
    SELECT p.id, p.email, p.name, p.role, p.bio, p.company, p.location,
           p.website, p.linkedin, p.avatar_url, p.created_at,
           p.industries, p.skills, p.expertise, p.rating_avg, p.success_rate,
           p.verified, p.hourly_rate, p.placement_fee_percent, p.years_experience,
           p.specializations, p.certifications, p.languages, p.placements_count,
           p.active_searches, p.response_time, p.cover_image_url, p.company_name,
           p.company_mission, p.company_sector, p.company_size, p.founded_year,
           p.company_benefits, p.company_culture, p.team_size, p.open_positions
    FROM public.profiles p
    WHERE p.role = profile_role;
  END IF;
END;
$$;

-- Recreate get_public_profile function with all columns
CREATE FUNCTION public.get_public_profile(profile_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  bio TEXT,
  company TEXT,
  location TEXT,
  website TEXT,
  linkedin TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  industries TEXT[],
  skills TEXT[],
  expertise TEXT[],
  rating_avg NUMERIC,
  success_rate NUMERIC,
  verified BOOLEAN,
  hourly_rate NUMERIC,
  placement_fee_percent NUMERIC,
  years_experience INTEGER,
  specializations TEXT[],
  certifications TEXT[],
  languages TEXT[],
  placements_count INTEGER,
  active_searches INTEGER,
  response_time TEXT,
  cover_image_url TEXT,
  company_name TEXT,
  company_mission TEXT,
  company_sector TEXT,
  company_size TEXT,
  founded_year INTEGER,
  company_benefits TEXT[],
  company_culture TEXT,
  team_size INTEGER,
  open_positions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.name, p.role, p.bio, p.company, p.location,
         p.website, p.linkedin, p.avatar_url, p.created_at,
         p.industries, p.skills, p.expertise, p.rating_avg, p.success_rate,
         p.verified, p.hourly_rate, p.placement_fee_percent, p.years_experience,
         p.specializations, p.certifications, p.languages, p.placements_count,
         p.active_searches, p.response_time, p.cover_image_url, p.company_name,
         p.company_mission, p.company_sector, p.company_size, p.founded_year,
         p.company_benefits, p.company_culture, p.team_size, p.open_positions
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$$;