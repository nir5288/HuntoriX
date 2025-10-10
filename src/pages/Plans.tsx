import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { PlanSelection } from '@/components/PlanSelection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useEffect, useState } from 'react';

const Plans = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [initialPlan, setInitialPlan] = useState<string | null>(null);

  useEffect(() => {
    // Check for pre-selected plan from URL or localStorage
    const selectedPlan = localStorage.getItem('selectedPlan');
    if (selectedPlan) {
      setInitialPlan(selectedPlan);
    }
  }, []);

  console.log('Plans page rendering, user:', user?.id, 'profile:', profile?.role);

  const handlePlanSelected = async (planId?: string) => {
    if (!user) {
      // Store selected plan in localStorage and redirect to signup
      if (planId) {
        localStorage.setItem('selectedPlan', planId);
      }
      navigate('/auth?mode=signup&role=headhunter');
      return;
    }
    
    // Clear the stored plan after successful selection
    localStorage.removeItem('selectedPlan');
    await refreshProfile();
    
    // Navigate to home to trigger welcome screen (for headhunters) or dashboard (for employers)
    if (profile?.role === 'employer') {
      navigate('/dashboard/employer');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 py-8 mt-8">
        <div className="w-full max-w-6xl space-y-6">
          {/* Employer Notice */}
          {!user && (
            <Card className="shadow-lg bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-mint))] border-2 border-border">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-semibold text-primary mb-3">
                  Are you an employer looking to hire?
                </p>
                <Button 
                  variant="default" 
                  size="lg"
                  className="font-bold bg-primary hover:bg-primary/90"
                  onClick={() => navigate('/auth?mode=signup&role=employer')}
                >
                  Register as Employer
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-2xl bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-foreground">Subscription Plans</CardTitle>
              <CardDescription className="text-muted-foreground">
                {user 
                  ? "Choose the plan that best fits your needs" 
                  : "Choose a plan and sign up to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <PlanSelection 
                userId={user?.id || ''} 
                onPlanSelected={handlePlanSelected}
                initialSelectedPlan={initialPlan}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Plans;
