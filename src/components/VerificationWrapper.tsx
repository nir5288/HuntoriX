import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { WelcomeScreen } from './WelcomeScreen';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlanSelection } from '@/components/PlanSelection';

interface VerificationWrapperProps {
  children: React.ReactNode;
}

export function VerificationWrapper({ children }: VerificationWrapperProps) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [preSelectedPlan, setPreSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user || !profile || loading) return;

      // Only check for headhunters
      if (profile.role !== 'headhunter') return;

      // Read preselected plan from localStorage (if any)
      const lsPlan = localStorage.getItem('selectedPlan');
      if (lsPlan) setPreSelectedPlan(lsPlan);

      // Check if user has a subscription plan
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no subscription, show plan selection and stop here
      if (!subscription) {
        setShowPlanSelection(true);
        setShowWelcome(false);
        return;
      } else {
        setShowPlanSelection(false);
      }

      // Only show welcome if they have a plan AND onboarding not completed
      if (subscription && profile.email_verified && !profile.onboarding_completed) {
        setShowWelcome(true);
      } else {
        setShowWelcome(false);
      }
    };

    checkVerificationStatus();

    // Listen for subscription changes
    const channel = supabase
      .channel('user_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user?.id}`
        },
        async () => {
          await refreshProfile();
          await checkVerificationStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, loading, refreshProfile]);

  const handleWelcomeComplete = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      await refreshProfile();
    }
    setShowWelcome(false);
  };

  const handlePlanSelected = async () => {
    // Clear any preselected plan stored by pricing flow
    localStorage.removeItem('selectedPlan');
    setPreSelectedPlan(null);
    await refreshProfile();
    setShowPlanSelection(false);
  };

  // Show loading state
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  // Force plan selection for headhunters without a subscription
  if (showPlanSelection && user) {
    const uid = user.id;
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-6xl my-8">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Choose your plan</CardTitle>
              <CardDescription>Select a subscription to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanSelection 
                userId={uid} 
                onPlanSelected={handlePlanSelected}
                initialSelectedPlan={preSelectedPlan}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show welcome screen for newly verified headhunters
  if (showWelcome && profile) {
    return <WelcomeScreen userName={profile.name || 'there'} onComplete={handleWelcomeComplete} />;
  }

  return <>{children}</>;
}
