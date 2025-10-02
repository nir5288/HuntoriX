-- Create function to generate notifications on new messages
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_name text;
  job_title text;
BEGIN
  -- Fetch optional metadata
  SELECT name INTO sender_name FROM public.profiles WHERE id = NEW.from_user;
  SELECT title INTO job_title FROM public.jobs WHERE id = NEW.job_id;

  INSERT INTO public.notifications (user_id, type, payload, is_read)
  VALUES (
    NEW.to_user,
    'new_message',
    jsonb_build_object(
      'sender_id', NEW.from_user,
      'sender_name', COALESCE(sender_name, 'Someone'),
      'job_id', NEW.job_id,
      'job_title', COALESCE(job_title, ''),
      'message_preview', LEFT(COALESCE(NEW.body, ''), 50)
    ),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on messages to call the function after insert
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.create_message_notification();