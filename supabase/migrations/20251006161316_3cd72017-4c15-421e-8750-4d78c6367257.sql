-- Add job_id column to promotional_banners
ALTER TABLE public.promotional_banners 
ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

-- Create storage bucket for banner images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for banner images
CREATE POLICY "Admins can upload banner images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banner-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update banner images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banner-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete banner images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'banner-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Banner images are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banner-images');