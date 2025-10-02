-- Add verification tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS first_reminder_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS second_reminder_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'pending_verification', 'deactivated')),
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Update existing profiles to set account status based on role
UPDATE public.profiles 
SET account_status = CASE 
  WHEN role = 'headhunter' AND email_verified = false THEN 'pending_verification'
  ELSE 'active'
END
WHERE account_status IS NULL;

-- Update the handle_new_user function to set initial verification status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role,
    email_verified,
    account_status,
    verification_sent_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'headhunter'),
    false,
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'headhunter') = 'headhunter' 
      THEN 'pending_verification'
      ELSE 'active'
    END,
    NOW()
  );
  RETURN NEW;
END;
$function$;