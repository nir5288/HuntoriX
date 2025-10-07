-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price_usd numeric NOT NULL,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  is_recommended boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (everyone can view plans)
CREATE POLICY "Plans are viewable by everyone"
ON public.subscription_plans
FOR SELECT
USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert default plans
INSERT INTO public.subscription_plans (name, price_usd, description, is_recommended, features) VALUES
('Free', 0, 'Get started with basic features', false, '["Access to public jobs", "Basic profile", "Limited applications"]'::jsonb),
('Core', 29, 'Essential tools for growing headhunters', false, '["Everything in Free", "Unlimited applications", "Priority support", "Advanced search filters"]'::jsonb),
('Pro', 39, 'Perfect for professional headhunters', true, '["Everything in Core", "Featured profile", "Analytics dashboard", "Custom branding", "API access"]'::jsonb),
('Huntorix', 79, 'Ultimate plan for top performers', false, '["Everything in Pro", "Dedicated account manager", "White-label solution", "Advanced AI tools", "Custom integrations"]'::jsonb);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_updated_at();