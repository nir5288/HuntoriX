-- Update get_user_credits function to return 0 credits for users without a subscription
DROP FUNCTION IF EXISTS public.get_user_credits(uuid);

CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id uuid)
RETURNS TABLE(
  total_credits integer,
  credits_used integer,
  credits_remaining integer,
  credits_reset_at timestamp with time zone,
  plan_will_change boolean,
  next_plan_name text,
  plan_change_effective_date timestamp with time zone
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
  v_next_plan_id uuid;
  v_plan_change_date timestamp with time zone;
BEGIN
  -- Get user's current plan and credits used
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
    v_plan_change_date,
    v_next_plan_id
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  LIMIT 1;

  -- If no subscription found, return 0 credits
  IF v_plan_name IS NULL THEN
    RETURN QUERY SELECT 
      0 as total_credits,
      0 as credits_used,
      0 as remaining,
      now() as reset_at,
      false as plan_will_change,
      NULL::text as next_plan,
      NULL::timestamp with time zone as change_date;
    RETURN;
  END IF;

  -- Check if it's time for monthly reset or plan change
  IF v_reset_at IS NOT NULL AND v_reset_at <= now() THEN
    -- Handle plan change if scheduled
    IF v_next_plan_id IS NOT NULL AND v_plan_change_date IS NOT NULL AND v_plan_change_date <= now() THEN
      UPDATE user_subscriptions
        SET 
          plan_id = next_plan_id,
          next_plan_id = NULL,
          plan_change_effective_date = NULL,
          credits_used = 0,
          credits_reset_at = now()
        WHERE id = v_subscription_id;
        
      -- Get new plan name
      SELECT name INTO v_plan_name
      FROM subscription_plans
      WHERE id = v_next_plan_id;
      
      v_next_plan_id := NULL;
      v_plan_change_date := NULL;
    ELSE
      -- Regular monthly reset
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
    ELSE v_total_credits := 0;  -- Changed from 20 to 0 for unknown plans
  END CASE;

  -- Get next plan name if plan change is scheduled
  IF v_next_plan_id IS NOT NULL THEN
    SELECT name INTO v_plan_name
    FROM subscription_plans
    WHERE id = v_next_plan_id;
  END IF;

  RETURN QUERY SELECT 
    v_total_credits,
    v_credits_used,
    GREATEST(0, v_total_credits - v_credits_used) as remaining,
    v_reset_at,
    v_next_plan_id IS NOT NULL as plan_will_change,
    v_plan_name as next_plan,
    v_plan_change_date as change_date;
END;
$$;