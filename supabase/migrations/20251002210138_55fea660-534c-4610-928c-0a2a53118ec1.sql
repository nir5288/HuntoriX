-- Add missing columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS budget_min NUMERIC,
ADD COLUMN IF NOT EXISTS budget_max NUMERIC;

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS regions TEXT[],
ADD COLUMN IF NOT EXISTS response_time_hours INTEGER,
ADD COLUMN IF NOT EXISTS avg_time_to_fill_days INTEGER,
ADD COLUMN IF NOT EXISTS portfolio_links TEXT[];

-- Rename messages columns to match code expectations
ALTER TABLE public.messages
RENAME COLUMN sender_id TO from_user;

ALTER TABLE public.messages
RENAME COLUMN receiver_id TO to_user;

ALTER TABLE public.messages
RENAME COLUMN content TO body;

-- Update foreign key names for messages
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_from_user_fkey FOREIGN KEY (from_user) REFERENCES public.profiles(id),
ADD CONSTRAINT messages_to_user_fkey FOREIGN KEY (to_user) REFERENCES public.profiles(id);

-- Update RLS policies for messages with new column names
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE
USING (auth.uid() = to_user);

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = from_user OR auth.uid() = to_user);