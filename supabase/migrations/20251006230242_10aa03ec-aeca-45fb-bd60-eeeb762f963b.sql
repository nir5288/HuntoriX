-- Add location column to promotional_banners table
ALTER TABLE public.promotional_banners 
ADD COLUMN location text NOT NULL DEFAULT 'home_top';

-- Add index for faster location-based queries
CREATE INDEX idx_promotional_banners_location ON public.promotional_banners(location);

-- Add comment to explain the column
COMMENT ON COLUMN public.promotional_banners.location IS 'Where the banner will be displayed (e.g., home_top, opportunities_top, sidebar, etc.)';