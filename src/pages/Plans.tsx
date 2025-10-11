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
      <main className="flex-1 flex items-center justify-center p-4 py-12 mt-16">
        <div className="w-full max-w-7xl">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
              Choose the perfect plan for your needs
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {user 
                ? "Unlock powerful features to accelerate your recruiting success" 
                : "Get started with a plan that fits your recruiting goals"}
            </p>
          </div>
          
          <PlanSelection 
            userId={user?.id || ''} 
            onPlanSelected={handlePlanSelected}
            initialSelectedPlan={initialPlan}
          />
        </div>
      </main>
    </div>
  );
};

export default Plans;
