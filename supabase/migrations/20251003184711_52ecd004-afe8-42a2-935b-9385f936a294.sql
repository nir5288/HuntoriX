-- Fix search_path for functions to address security warnings

-- Update generate_job_id_number function with proper search_path
CREATE OR REPLACE FUNCTION generate_job_id_number()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update set_job_id_number function with proper search_path
CREATE OR REPLACE FUNCTION set_job_id_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.job_id_number IS NULL THEN
    NEW.job_id_number := generate_job_id_number();
  END IF;
  RETURN NEW;
END;
$$;