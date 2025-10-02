-- Step 1: Drop the existing public read policy on profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Step 2: Create a restricted SELECT policy - users can only see their own full profile
CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Step 3: Create a public_profiles view that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Step 4: Grant SELECT on the public view to authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Step 5: Create a helper function to get contact info (only for own profile)
CREATE OR REPLACE FUNCTION public.get_own_contact_info()
RETURNS TABLE (
  email text,
  contact_person text,
  contact_phone text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email, contact_person, contact_phone
  FROM public.profiles
  WHERE id = auth.uid();
$$;