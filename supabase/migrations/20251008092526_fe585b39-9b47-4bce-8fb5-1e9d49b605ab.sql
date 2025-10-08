-- Create global_hiring_applications table
CREATE TABLE public.global_hiring_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  headhunter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  motivation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(headhunter_id)
);

-- Enable RLS
ALTER TABLE public.global_hiring_applications ENABLE ROW LEVEL SECURITY;

-- Headhunters can view their own application
CREATE POLICY "Headhunters can view their own application"
ON public.global_hiring_applications
FOR SELECT
TO authenticated
USING (auth.uid() = headhunter_id);

-- Headhunters can create their own application
CREATE POLICY "Headhunters can create their own application"
ON public.global_hiring_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = headhunter_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.global_hiring_applications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update applications
CREATE POLICY "Admins can update applications"
ON public.global_hiring_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_global_hiring_applications_updated_at
BEFORE UPDATE ON public.global_hiring_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();