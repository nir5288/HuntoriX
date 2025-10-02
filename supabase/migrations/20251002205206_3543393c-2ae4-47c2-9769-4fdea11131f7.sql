-- Add remaining missing columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_hq TEXT,
ADD COLUMN IF NOT EXISTS regions TEXT[],
ADD COLUMN IF NOT EXISTS availability TEXT,
ADD COLUMN IF NOT EXISTS response_time_hours INTEGER,
ADD COLUMN IF NOT EXISTS avg_time_to_fill_days INTEGER,
ADD COLUMN IF NOT EXISTS portfolio_links TEXT[];