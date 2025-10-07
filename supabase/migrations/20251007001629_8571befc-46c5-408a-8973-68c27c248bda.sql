-- Add target_audience column to promotional_banners table
ALTER TABLE public.promotional_banners 
ADD COLUMN target_audience text NOT NULL DEFAULT 'all';

-- Add a check constraint to ensure only valid values
ALTER TABLE public.promotional_banners
ADD CONSTRAINT promotional_banners_target_audience_check 
CHECK (target_audience IN ('all', 'headhunter', 'employer'));