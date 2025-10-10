-- Add columns to track monthly credit cycles and plan changes
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS credits_reset_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS plan_change_effective_date timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS previous_plan_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS next_plan_id uuid DEFAULT NULL;

-- Update existing records to have a reset date
UPDATE public.user_subscriptions 
SET credits_reset_at = created_at 
WHERE credits_reset_at IS NULL;

-- Drop and recreate the get_user_credits function with monthly reset logic
DROP FUNCTION IF EXISTS public.get_user_credits(uuid);

CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id uuid)
RETURNS TABLE(
  total_credits integer,
  credits_used integer,
  credits_remaining integer,
  credits_reset_at timestamp with time zone,
  plan_will_change boolean,
  next_plan_name text,
  plan_change_date timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name text;
  v_credits_used integer;
  v_total_credits integer;
  v_reset_at timestamp with time zone;
  v_subscription_id uuid;
  v_plan_change_effective_date timestamp with time zone;
  v_next_plan_id uuid;
  v_next_plan_name text;
BEGIN
  -- Get user's current subscription info
  SELECT 
    sp.name, 
    us.credits_used, 
    us.credits_reset_at,
    us.id,
    us.plan_change_effective_date,
    us.next_plan_id
  INTO 
    v_plan_name, 
    v_credits_used, 
    v_reset_at,
    v_subscription_id,
    v_plan_change_effective_date,
    v_next_plan_id
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id AND us.status = 'active'
  LIMIT 1;

  -- If no subscription found, default to free plan
  IF v_plan_name IS NULL THEN
    v_plan_name := 'free';
    v_credits_used := 0;
    v_reset_at := now();
  END IF;

  -- Check if it's time for a monthly reset
  IF v_reset_at + INTERVAL '1 month' <= now() THEN
    -- Check if there's a pending plan change
    IF v_plan_change_effective_date IS NOT NULL AND v_plan_change_effective_date <= now() THEN
      -- Apply the plan change
      IF v_next_plan_id IS NOT NULL THEN
        UPDATE user_subscriptions
        SET 
          previous_plan_id = plan_id,
          plan_id = v_next_plan_id,
          next_plan_id = NULL,
          plan_change_effective_date = NULL,
          credits_used = 0,
          credits_reset_at = now()
        WHERE id = v_subscription_id;
        
        -- Get the new plan name for current calculation
        SELECT name INTO v_plan_name
        FROM subscription_plans
        WHERE id = v_next_plan_id;
      END IF;
    ELSE
      -- Normal monthly reset without plan change
      UPDATE user_subscriptions
      SET 
        credits_used = 0,
        credits_reset_at = now()
      WHERE id = v_subscription_id;
    END IF;
    
    v_credits_used := 0;
    v_reset_at := now();
  END IF;

  -- Set total credits based on plan
  CASE LOWER(v_plan_name)
    WHEN 'free' THEN v_total_credits := 20;
    WHEN 'core' THEN v_total_credits := 250;
    WHEN 'huntorix' THEN v_total_credits := 999999;
    WHEN 'pro' THEN v_total_credits := 999999;
    ELSE v_total_credits := 20;
  END CASE;

  -- Get next plan name if there's a pending change
  IF v_next_plan_id IS NOT NULL THEN
    SELECT name INTO v_next_plan_name
    FROM subscription_plans
    WHERE id = v_next_plan_id;
  END IF;

  RETURN QUERY SELECT 
    v_total_credits,
    v_credits_used,
    GREATEST(0, v_total_credits - v_credits_used) as remaining,
    v_reset_at,
    v_next_plan_id IS NOT NULL as plan_will_change,
    v_next_plan_name,
    v_plan_change_effective_date;
END;
$$;