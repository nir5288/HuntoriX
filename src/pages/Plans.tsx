import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { PlanSelection } from '@/components/PlanSelection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';

const Plans = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  console.log('Plans page rendering, user:', user?.id, 'profile:', profile?.role);

  const handlePlanSelected = async () => {
    if (!user) {
      navigate('/auth?role=headhunter');
      return;
    }
    
    await refreshProfile();
    // Navigate to dashboard based on role
    if (profile?.role === 'employer') {
      navigate('/dashboard/employer');
    } else {
      navigate('/dashboard/headhunter');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 py-8 mt-8">
        <div className="w-full max-w-6xl">
          <Card className="shadow-2xl bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-foreground">Subscription Plans</CardTitle>
              <CardDescription className="text-muted-foreground">Choose the plan that best fits your needs</CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              {user ? (
                <PlanSelection userId={user.id} onPlanSelected={handlePlanSelected} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Please sign in to select a plan</p>
                  <button 
                    onClick={() => navigate('/auth?role=headhunter')}
                    className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950 px-6 py-2 rounded-lg font-medium"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Plans;
