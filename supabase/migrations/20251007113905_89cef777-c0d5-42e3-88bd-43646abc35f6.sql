-- Function to notify Huntorix headhunters about new exclusive jobs
CREATE OR REPLACE FUNCTION public.notify_huntorix_headhunters_exclusive_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  headhunter_record RECORD;
  job_creator_name TEXT;
BEGIN
  -- Only process if the job is exclusive
  IF NEW.is_exclusive = true THEN
    -- Get job creator name
    SELECT name INTO job_creator_name
    FROM public.profiles
    WHERE id = NEW.created_by;
    
    -- Find all headhunters with Huntorix subscription
    FOR headhunter_record IN
      SELECT DISTINCT p.id as user_id, p.name
      FROM public.profiles p
      INNER JOIN public.user_subscriptions us ON p.id = us.user_id
      INNER JOIN public.subscription_plans sp ON us.plan_id = sp.id
      WHERE p.role = 'headhunter'
        AND us.status = 'active'
        AND sp.name = 'Huntorix'
    LOOP
      -- Create notification for each Huntorix headhunter
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        related_id,
        payload
      ) VALUES (
        headhunter_record.user_id,
        'exclusive_job_posted',
        'New Exclusive Huntorix Job',
        'Exclusive job "' || NEW.title || '" posted by ' || COALESCE(job_creator_name, 'Unknown') || '. Pending approval.',
        NEW.id,
        jsonb_build_object(
          'job_id', NEW.id,
          'job_title', NEW.title,
          'created_by', NEW.created_by,
          'created_at', NEW.created_at,
          'status', NEW.status
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for exclusive job notifications
DROP TRIGGER IF EXISTS on_exclusive_job_created ON public.jobs;
CREATE TRIGGER on_exclusive_job_created
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  WHEN (NEW.is_exclusive = true)
  EXECUTE FUNCTION public.notify_huntorix_headhunters_exclusive_job();