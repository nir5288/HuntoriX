-- Add status column to profiles table to store user's current status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'online' CHECK (status IN ('online', 'away'));