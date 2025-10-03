-- Add reply_to column to messages table
ALTER TABLE public.messages 
ADD COLUMN reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL;