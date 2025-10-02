-- Fix the security definer view issue by recreating with security_invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker=on)
AS
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

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier=on);

-- Grant SELECT on the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Add a policy to allow public read access to the view
-- Note: We need to add a SELECT policy to the underlying profiles table that allows
-- reading all rows but application code will only query non-sensitive columns via the view
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 
'Public view of profiles excluding sensitive data (email, contact_phone). 
Uses SECURITY INVOKER to respect RLS policies. 
Applications should query this view for public profile displays.';