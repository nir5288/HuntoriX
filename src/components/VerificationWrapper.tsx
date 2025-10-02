import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { WelcomeScreen } from './WelcomeScreen';
import { VerificationPending } from './VerificationPending';
import { supabase } from '@/integrations/supabase/client';

interface VerificationWrapperProps {
  children: React.ReactNode;
}

export function VerificationWrapper({ children }: VerificationWrapperProps) {
  const { user, profile, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user || !profile || loading) return;

      // Only check for headhunters
      if (profile.role !== 'headhunter') return;

      // If just verified and onboarding not completed, show welcome
      if (profile.email_verified && !profile.onboarding_completed) {
        setShowWelcome(true);
      }
    };

    checkVerificationStatus();
  }, [user, profile, loading]);

  const handleWelcomeComplete = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    }
    setShowWelcome(false);
  };

  // Show loading state
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  // Show verification pending for unverified headhunters
  if (
    user &&
    profile &&
    profile.role === 'headhunter' &&
    !profile.email_verified &&
    profile.account_status === 'pending_verification'
  ) {
    return <VerificationPending email={user.email || ''} userName={profile.name || 'there'} />;
  }

  // Show welcome screen for newly verified headhunters
  if (showWelcome && profile) {
    return <WelcomeScreen userName={profile.name || 'there'} onComplete={handleWelcomeComplete} />;
  }

  return <>{children}</>;
}
