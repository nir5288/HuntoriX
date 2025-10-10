-- Function to notify employer when job is approved
CREATE OR REPLACE FUNCTION public.notify_employer_job_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  job_creator_name TEXT;
BEGIN
  -- Only notify if status changed from pending_review to open
  IF OLD.status = 'pending_review' AND NEW.status = 'open' THEN
    -- Get job creator name
    SELECT name INTO job_creator_name
    FROM public.profiles
    WHERE id = NEW.created_by;
    
    -- Create notification for job creator
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      payload
    ) VALUES (
      NEW.created_by,
      'job_approved',
      'Job Approved',
      'Your job "' || NEW.title || '" has been approved and is now live',
      NEW.id,
      jsonb_build_object(
        'job_id', NEW.id,
        'job_title', NEW.title,
        'approved_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for job approval notifications
DROP TRIGGER IF EXISTS notify_employer_on_job_approval ON public.jobs;
CREATE TRIGGER notify_employer_on_job_approval
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_employer_job_approved();

-- Enable realtime for jobs table
ALTER TABLE public.jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;