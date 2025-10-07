import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlanSelection } from './PlanSelection';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlanBadgeProps {
  userId: string;
}

interface Plan {
  id: string;
  name: string;
  price_usd: number;
  is_recommended: boolean;
}

const PLAN_ORDER = ['Free', 'Pro', 'Premium', 'Huntorix'];

export function SubscriptionPlanBadge({ userId }: SubscriptionPlanBadgeProps) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch all plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_usd', { ascending: true });

      if (plansError) throw plansError;
      setAllPlans(plansData || []);

      // Fetch current subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          plan_id,
          subscription_plans (
            id,
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
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextPlan = () => {
    if (!plan) return null;
    const currentIndex = PLAN_ORDER.indexOf(plan.name);
    if (currentIndex === -1 || currentIndex === PLAN_ORDER.length - 1) return null;
    
    const nextPlanName = PLAN_ORDER[currentIndex + 1];
    return allPlans.find(p => p.name === nextPlanName);
  };

  const handleUpgrade = async () => {
    const nextPlan = getNextPlan();
    if (!nextPlan) return;

    setUpgrading(true);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ plan_id: nextPlan.id })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      toast({
        title: 'Plan upgraded!',
        description: `You've successfully upgraded to ${nextPlan.name}.`,
      });

      await fetchData();
      setShowUpgradeDialog(false);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: 'Upgrade failed',
        description: 'There was an error upgrading your plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handlePlanChanged = async () => {
    setShowUpgrade(false);
    await fetchData();
  };

  const nextPlan = getNextPlan();

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
    <>
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

          {nextPlan ? (
            <Button 
              onClick={() => setShowUpgradeDialog(true)}
              className="w-full"
            >
              Upgrade to {nextPlan.name}
            </Button>
          ) : (
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
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upgrade to {nextPlan?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to upgrade from {plan.name} (${plan.price_usd}/month) to {nextPlan?.name} (${nextPlan?.price_usd}/month)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={upgrading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upgrading...
                </>
              ) : (
                'Yes, Upgrade'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
