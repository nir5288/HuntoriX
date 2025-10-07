-- 1) Add exclusive period columns if missing
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS exclusive_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exclusive_until TIMESTAMPTZ;

-- 2) Create a trigger function to manage and enforce the 14-day exclusivity
CREATE OR REPLACE FUNCTION public.enforce_and_manage_exclusive_period()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: if job starts as exclusive, initialize the window
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.is_exclusive, false) = true THEN
      IF NEW.exclusive_since IS NULL THEN
        NEW.exclusive_since := now();
      END IF;
      IF NEW.exclusive_until IS NULL THEN
        NEW.exclusive_until := NEW.exclusive_since + INTERVAL '14 days';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: prevent unmarking before the window ends
  IF COALESCE(OLD.is_exclusive, false) = true AND COALESCE(NEW.is_exclusive, false) = false THEN
    IF OLD.exclusive_until IS NOT NULL AND now() < OLD.exclusive_until THEN
      RAISE EXCEPTION 'Cannot unmark exclusive before %', to_char(OLD.exclusive_until, 'YYYY-MM-DD');
    END IF;
  END IF;

  -- On UPDATE: when switching from non-exclusive to exclusive, start a new window
  IF COALESCE(OLD.is_exclusive, false) = false AND COALESCE(NEW.is_exclusive, false) = true THEN
    NEW.exclusive_since := now();
    NEW.exclusive_until := now() + INTERVAL '14 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3) Attach triggers for INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_manage_exclusive_jobs_insert ON public.jobs;
CREATE TRIGGER trg_manage_exclusive_jobs_insert
BEFORE INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_and_manage_exclusive_period();

DROP TRIGGER IF EXISTS trg_manage_exclusive_jobs_update ON public.jobs;
CREATE TRIGGER trg_manage_exclusive_jobs_update
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_and_manage_exclusive_period();