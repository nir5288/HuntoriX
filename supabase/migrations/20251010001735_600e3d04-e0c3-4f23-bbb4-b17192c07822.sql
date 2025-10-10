-- Add credits tracking to user_subscriptions table
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS credits_used integer NOT NULL DEFAULT 0;

-- Create function to get credits info based on plan
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id uuid)
RETURNS TABLE(
  total_credits integer,
  credits_used integer,
  credits_remaining integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name text;
  v_credits_used integer;
  v_total_credits integer;
BEGIN
  -- Get user's current plan and credits used
  SELECT sp.name, COALESCE(us.credits_used, 0)
  INTO v_plan_name, v_credits_used
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id AND us.status = 'active'
  LIMIT 1;

  -- If no subscription found, default to free plan
  IF v_plan_name IS NULL THEN
    v_plan_name := 'free';
    v_credits_used := 0;
  END IF;

  -- Set total credits based on plan
  CASE LOWER(v_plan_name)
    WHEN 'free' THEN v_total_credits := 20;
    WHEN 'core' THEN v_total_credits := 250;
    WHEN 'huntorix' THEN v_total_credits := 999999; -- unlimited
    WHEN 'pro' THEN v_total_credits := 999999; -- unlimited
    ELSE v_total_credits := 20; -- default to free
  END CASE;

  RETURN QUERY SELECT 
    v_total_credits,
    v_credits_used,
    GREATEST(0, v_total_credits - v_credits_used) as remaining;
END;
$$;

-- Create function to deduct credits when application is submitted
CREATE OR REPLACE FUNCTION public.deduct_application_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only deduct credit for new applications (not updates)
  IF TG_OP = 'INSERT' THEN
    UPDATE user_subscriptions
    SET credits_used = credits_used + 1
    WHERE user_id = NEW.headhunter_id 
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically deduct credits on application
DROP TRIGGER IF EXISTS deduct_credit_on_application ON applications;
CREATE TRIGGER deduct_credit_on_application
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION deduct_application_credit();