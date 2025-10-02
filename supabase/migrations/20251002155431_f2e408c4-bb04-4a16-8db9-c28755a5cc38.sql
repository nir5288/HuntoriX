-- Create function to generate notifications on new job invitations
CREATE OR REPLACE FUNCTION public.create_job_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  employer_name text;
  job_title text;
BEGIN
  -- Fetch employer name and job title
  SELECT p.name INTO employer_name FROM public.profiles p WHERE p.id = NEW.employer_id;
  SELECT j.title INTO job_title FROM public.jobs j WHERE j.id = NEW.job_id;

  INSERT INTO public.notifications (user_id, type, payload, is_read)
  VALUES (
    NEW.headhunter_id,
    'job_invitation',
    jsonb_build_object(
      'employer_id', NEW.employer_id,
      'employer_name', COALESCE(employer_name, 'An employer'),
      'job_id', NEW.job_id,
      'job_title', COALESCE(job_title, 'a position'),
      'message', NEW.message
    ),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on job_invitations
DROP TRIGGER IF EXISTS trigger_notify_job_invitation ON public.job_invitations;
CREATE TRIGGER trigger_notify_job_invitation
AFTER INSERT ON public.job_invitations
FOR EACH ROW
EXECUTE FUNCTION public.create_job_invitation_notification();

-- Create function to generate notifications on new applications
CREATE OR REPLACE FUNCTION public.create_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  headhunter_name text;
  job_title text;
  employer_id uuid;
BEGIN
  -- Fetch headhunter name, job title, and employer id
  SELECT p.name INTO headhunter_name FROM public.profiles p WHERE p.id = NEW.headhunter_id;
  SELECT j.title, j.created_by INTO job_title, employer_id FROM public.jobs j WHERE j.id = NEW.job_id;

  INSERT INTO public.notifications (user_id, type, payload, is_read)
  VALUES (
    employer_id,
    'new_application',
    jsonb_build_object(
      'application_id', NEW.id,
      'headhunter_id', NEW.headhunter_id,
      'headhunter_name', COALESCE(headhunter_name, 'A headhunter'),
      'job_id', NEW.job_id,
      'job_title', COALESCE(job_title, 'your position')
    ),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on applications
DROP TRIGGER IF EXISTS trigger_notify_application ON public.applications;
CREATE TRIGGER trigger_notify_application
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.create_application_notification();