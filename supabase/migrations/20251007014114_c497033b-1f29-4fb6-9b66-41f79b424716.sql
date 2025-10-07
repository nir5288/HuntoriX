-- Add auto_approve_at field to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS auto_approve_at TIMESTAMP WITH TIME ZONE;

-- Create function to set auto approval time
CREATE OR REPLACE FUNCTION public.set_auto_approve_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  random_minutes INTEGER;
BEGIN
  IF NEW.status = 'pending_review' AND NEW.auto_approve_at IS NULL THEN
    -- Random delay between 3 and 7 minutes (180-420 seconds)
    random_minutes := floor(random() * 5 + 3)::INTEGER;
    -- Set auto approve time to 30 minutes + random delay
    NEW.auto_approve_at := NEW.created_at + INTERVAL '30 minutes' + (random_minutes || ' minutes')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto approval time
DROP TRIGGER IF EXISTS set_auto_approve_time_trigger ON public.jobs;
CREATE TRIGGER set_auto_approve_time_trigger
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_auto_approve_time();

-- Create function to notify admins of new job submissions
CREATE OR REPLACE FUNCTION public.notify_admins_new_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record RECORD;
  job_creator_name TEXT;
BEGIN
  IF NEW.status = 'pending_review' THEN
    -- Get job creator name
    SELECT name INTO job_creator_name
    FROM public.profiles
    WHERE id = NEW.created_by;
    
    -- Notify all admins
    FOR admin_record IN 
      SELECT user_id 
      FROM public.user_roles 
      WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        related_id,
        payload
      ) VALUES (
        admin_record.user_id,
        'job_review_required',
        'New Job Requires Review',
        'Job "' || NEW.title || '" from ' || COALESCE(job_creator_name, 'Unknown') || ' is awaiting approval',
        NEW.id,
        jsonb_build_object(
          'job_id', NEW.id,
          'job_title', NEW.title,
          'created_by', NEW.created_by,
          'created_at', NEW.created_at
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for admin notifications
DROP TRIGGER IF EXISTS notify_admins_new_job_trigger ON public.jobs;
CREATE TRIGGER notify_admins_new_job_trigger
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_job();

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cron job to auto-approve jobs (runs every minute)
SELECT cron.schedule(
  'auto-approve-jobs',
  '* * * * *',
  $$
  UPDATE public.jobs
  SET status = 'open'
  WHERE status = 'pending_review'
    AND auto_approve_at IS NOT NULL
    AND auto_approve_at <= NOW();
  $$
);