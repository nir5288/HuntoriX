-- Update the handle_new_user function to set users as verified by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role,
    email_verified,
    account_status,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'headhunter'),
    true,
    'active',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'headhunter') = 'headhunter' 
      THEN false
      ELSE true
    END
  );
  RETURN NEW;
END;
$$;