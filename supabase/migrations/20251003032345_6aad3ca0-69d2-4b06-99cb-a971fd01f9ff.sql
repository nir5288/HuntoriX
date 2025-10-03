-- Add message editing and file attachment support
ALTER TABLE public.messages 
ADD COLUMN edited_at timestamp with time zone,
ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- Add delete conversation function
CREATE OR REPLACE FUNCTION delete_conversation(p_job_id uuid, p_user1_id uuid, p_user2_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.messages
  WHERE job_id = p_job_id
    AND ((from_user = p_user1_id AND to_user = p_user2_id)
         OR (from_user = p_user2_id AND to_user = p_user1_id));
END;
$$;

-- Add last_seen column to profiles
ALTER TABLE public.profiles
ADD COLUMN last_seen timestamp with time zone DEFAULT now();