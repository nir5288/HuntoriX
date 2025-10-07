-- Add show_ai_assistant column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN show_ai_assistant boolean DEFAULT true;