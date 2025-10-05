-- Create starred_conversations table
CREATE TABLE public.starred_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID,
  other_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.starred_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own starred conversations"
ON public.starred_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can star conversations"
ON public.starred_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar conversations"
ON public.starred_conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Create unique index to prevent duplicate stars
CREATE UNIQUE INDEX starred_conversations_unique_idx 
ON public.starred_conversations(user_id, COALESCE(job_id, '00000000-0000-0000-0000-000000000000'::uuid), other_user_id);