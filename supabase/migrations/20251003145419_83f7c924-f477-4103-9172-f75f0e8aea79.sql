-- Add user preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN sort_preference text DEFAULT 'recent',
ADD COLUMN show_applied_jobs boolean DEFAULT false;