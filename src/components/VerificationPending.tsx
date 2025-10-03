import { useState } from 'react';
import { Mail, Clock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerificationPendingProps {
  email: string;
  userName: string;
}

export function VerificationPending({ email, userName }: VerificationPendingProps) {
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in again');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          userId: user.id,
          email,
          name: userName,
        },
      });

      if (error) throw error;

      if (data?.error || data?.emailResponse?.error) {
        console.error('Send verification email failed:', data?.error || data?.emailResponse?.error);
        toast.error('Failed to send email. Please update email settings and try again.');
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <Mail className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a verification email to <strong>{email}</strong>
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-medium">What happens next?</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Check your inbox for the verification email</li>
                <li>Click the verification link to activate your account</li>
                <li>You'll be redirected to complete your profile</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-border">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-amber-700 dark:text-amber-500">Important</p>
              <p className="text-muted-foreground">
                Your account will be deactivated if not verified within 7 days. 
                We'll send reminder emails after 24 hours and 7 days.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-center text-muted-foreground">
            Didn't receive the email?
          </p>
          <Button
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full"
            variant="outline"
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full"
          >
            Sign Out
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          Check your spam folder if you don't see the email within a few minutes.
        </div>
      </Card>
    </div>
  );
}
