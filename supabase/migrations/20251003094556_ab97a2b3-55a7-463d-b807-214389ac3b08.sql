-- Create function to delete conversations (all messages between two users for a specific job)
CREATE OR REPLACE FUNCTION public.delete_conversation(
  p_job_id uuid,
  p_user1_id uuid,
  p_user2_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all messages between the two users for the specified job
  -- Only allow deletion if the caller is one of the participants
  IF auth.uid() = p_user1_id OR auth.uid() = p_user2_id THEN
    DELETE FROM public.messages
    WHERE (
      (job_id = p_job_id OR (job_id IS NULL AND p_job_id IS NULL))
      AND (
        (from_user = p_user1_id AND to_user = p_user2_id) OR
        (from_user = p_user2_id AND to_user = p_user1_id)
      )
    );
  ELSE
    RAISE EXCEPTION 'Not authorized to delete this conversation';
  END IF;
END;
$$;