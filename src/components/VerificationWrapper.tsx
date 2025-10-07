import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { WelcomeScreen } from './WelcomeScreen';
import { VerificationPending } from './VerificationPending';
import { supabase } from '@/integrations/supabase/client';

interface VerificationWrapperProps {
  children: React.ReactNode;
}

export function VerificationWrapper({ children }: VerificationWrapperProps) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user || !profile || loading) return;

      // Only check for headhunters
      if (profile.role !== 'headhunter') return;

      // Check if user has a subscription plan
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Only show welcome if they have a plan AND onboarding not completed
      if (subscription && profile.email_verified && !profile.onboarding_completed) {
        setShowWelcome(true);
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
      
      // Refresh the profile to update the local state
      await refreshProfile();
    }
    setShowWelcome(false);
  };

  // Show loading state
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  // Show welcome screen for newly verified headhunters
  if (showWelcome && profile) {
    return <WelcomeScreen userName={profile.name || 'there'} onComplete={handleWelcomeComplete} />;
  }

  return <>{children}</>;
}
