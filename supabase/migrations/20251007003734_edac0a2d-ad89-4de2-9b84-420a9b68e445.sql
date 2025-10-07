-- Create table to store AI assistant conversations
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store individual AI messages and feedback
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  liked BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track AI assistant visibility events
CREATE TABLE public.ai_assistant_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('opened', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_events ENABLE ROW LEVEL SECURITY;

-- Policies for ai_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
  ON public.ai_conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for ai_messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.ai_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can create messages in their conversations"
  ON public.ai_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their messages"
  ON public.ai_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all messages"
  ON public.ai_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for ai_assistant_events
CREATE POLICY "Users can create their own events"
  ON public.ai_assistant_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all events"
  ON public.ai_assistant_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_liked ON public.ai_messages(liked) WHERE liked IS NOT NULL;
CREATE INDEX idx_ai_assistant_events_user_id ON public.ai_assistant_events(user_id);
CREATE INDEX idx_ai_assistant_events_type ON public.ai_assistant_events(event_type);
CREATE INDEX idx_ai_assistant_events_created_at ON public.ai_assistant_events(created_at);

-- Create trigger for updating ai_conversations updated_at
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();