-- Add missing columns to profiles table for headhunters
ALTER TABLE public.profiles
ADD COLUMN industries TEXT[],
ADD COLUMN skills TEXT[],
ADD COLUMN expertise TEXT[],
ADD COLUMN rating_avg NUMERIC DEFAULT 0,
ADD COLUMN success_rate NUMERIC DEFAULT 0,
ADD COLUMN verified BOOLEAN DEFAULT false,
ADD COLUMN hourly_rate NUMERIC,
ADD COLUMN placement_fee_percent NUMERIC,
ADD COLUMN years_experience INTEGER,
ADD COLUMN specializations TEXT[],
ADD COLUMN certifications TEXT[],
ADD COLUMN languages TEXT[],
ADD COLUMN placements_count INTEGER DEFAULT 0,
ADD COLUMN active_searches INTEGER DEFAULT 0,
ADD COLUMN response_time TEXT;

-- Add missing columns to profiles table for employers
ALTER TABLE public.profiles
ADD COLUMN cover_image_url TEXT,
ADD COLUMN company_name TEXT,
ADD COLUMN company_mission TEXT,
ADD COLUMN company_sector TEXT,
ADD COLUMN company_size TEXT,
ADD COLUMN founded_year INTEGER,
ADD COLUMN company_benefits TEXT[],
ADD COLUMN company_culture TEXT,
ADD COLUMN team_size INTEGER,
ADD COLUMN open_positions INTEGER DEFAULT 0;

-- Add missing column to jobs table
ALTER TABLE public.jobs
ADD COLUMN industry TEXT,
ADD COLUMN seniority TEXT,
ADD COLUMN skills_must TEXT[],
ADD COLUMN skills_nice TEXT[],
ADD COLUMN benefits TEXT[],
ADD COLUMN remote_policy TEXT,
ADD COLUMN company_name TEXT;

-- Add payload column to notifications table
ALTER TABLE public.notifications
ADD COLUMN payload JSONB;