import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { PlanSelection } from '@/components/PlanSelection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';

const Plans = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handlePlanSelected = async () => {
    await refreshProfile();
    // Navigate to dashboard based on role
    if (profile?.role === 'employer') {
      navigate('/dashboard/employer');
    } else {
      navigate('/dashboard/headhunter');
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))]">
      <Header />
      <div className="flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-6xl">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Subscription Plans</CardTitle>
              <CardDescription>Choose the plan that best fits your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanSelection userId={user.id} onPlanSelected={handlePlanSelected} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Plans;
