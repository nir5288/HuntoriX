import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlanSelection } from './PlanSelection';

interface SubscriptionPlanBadgeProps {
  userId: string;
}

interface Plan {
  name: string;
  price_usd: number;
  is_recommended: boolean;
}

export function SubscriptionPlanBadge({ userId }: SubscriptionPlanBadgeProps) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    fetchCurrentPlan();
  }, [userId]);

  const fetchCurrentPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          plan_id,
          subscription_plans (
            name,
            price_usd,
            is_recommended
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.subscription_plans) {
        setPlan(data.subscription_plans as Plan);
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChanged = async () => {
    setShowUpgrade(false);
    await fetchCurrentPlan();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">No active subscription</p>
          <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
            <DialogTrigger asChild>
              <Button className="w-full">Select a Plan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Choose Your Subscription Plan</DialogTitle>
                <DialogDescription>Select the plan that best fits your needs</DialogDescription>
              </DialogHeader>
              <PlanSelection userId={userId} onPlanSelected={handlePlanChanged} />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              {plan.name === 'Huntorix' && (
                <Crown className="h-5 w-5 text-yellow-500" />
              )}
              {plan.is_recommended && (
                <Badge variant="default">Recommended</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ${plan.price_usd}/month
            </p>
          </div>
        </div>

        <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              Change Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Change Your Subscription Plan</DialogTitle>
              <DialogDescription>Select a new plan to upgrade or downgrade</DialogDescription>
            </DialogHeader>
            <PlanSelection userId={userId} onPlanSelected={handlePlanChanged} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
