-- Add new fields to profiles table for employer profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS company_mission text,
ADD COLUMN IF NOT EXISTS company_sector text,
ADD COLUMN IF NOT EXISTS company_hq text,
ADD COLUMN IF NOT EXISTS team_members jsonb DEFAULT '[]'::jsonb;