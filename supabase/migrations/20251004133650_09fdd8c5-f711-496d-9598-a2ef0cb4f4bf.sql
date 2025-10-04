-- Add show_status column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_status boolean DEFAULT true;