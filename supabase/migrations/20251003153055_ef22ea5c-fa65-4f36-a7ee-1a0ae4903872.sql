-- Create saved_headhunters table for employers to save headhunters
CREATE TABLE public.saved_headhunters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  headhunter_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, headhunter_id)
);

-- Enable RLS
ALTER TABLE public.saved_headhunters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved headhunters"
ON public.saved_headhunters
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save headhunters"
ON public.saved_headhunters
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved headhunters"
ON public.saved_headhunters
FOR DELETE
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.saved_headhunters
ADD CONSTRAINT saved_headhunters_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.saved_headhunters
ADD CONSTRAINT saved_headhunters_headhunter_id_fkey 
FOREIGN KEY (headhunter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;