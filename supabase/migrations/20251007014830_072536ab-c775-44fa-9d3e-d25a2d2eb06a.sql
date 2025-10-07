-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_job_id_number_trigger ON public.jobs;
DROP TRIGGER IF EXISTS set_auto_approve_time_trigger ON public.jobs;
DROP TRIGGER IF EXISTS notify_admins_new_job_trigger ON public.jobs;

-- Recreate trigger for job_id_number generation
CREATE TRIGGER set_job_id_number_trigger
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_job_id_number();

-- Recreate trigger for auto approval time
CREATE TRIGGER set_auto_approve_time_trigger
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_auto_approve_time();

-- Recreate trigger for admin notifications
CREATE TRIGGER notify_admins_new_job_trigger
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_job();