-- Add job_id_number column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN job_id_number integer;

-- Generate 7-digit random numbers for existing jobs
UPDATE public.jobs 
SET job_id_number = floor(random() * 9000000 + 1000000)::integer
WHERE job_id_number IS NULL;

-- Make it NOT NULL after populating existing records
ALTER TABLE public.jobs 
ALTER COLUMN job_id_number SET NOT NULL;

-- Add unique constraint
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_job_id_number_unique UNIQUE (job_id_number);

-- Create function to generate unique 7-digit job ID
CREATE OR REPLACE FUNCTION generate_job_id_number()
RETURNS INTEGER AS $$
DECLARE
  new_id INTEGER;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 7-digit number (1000000 to 9999999)
    new_id := floor(random() * 9000000 + 1000000)::INTEGER;
    
    -- Check if this ID already exists
    SELECT EXISTS(SELECT 1 FROM public.jobs WHERE job_id_number = new_id) INTO id_exists;
    
    -- If it doesn't exist, we can use it
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate job_id_number on insert
CREATE OR REPLACE FUNCTION set_job_id_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_id_number IS NULL THEN
    NEW.job_id_number := generate_job_id_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_job_id_number
BEFORE INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION set_job_id_number();