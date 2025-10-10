import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Briefcase, Users, ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { PlanSelection } from '@/components/PlanSelection';

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(8, { message: "Password must be at least 8 characters" });
const nameSchema = z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'employer' | 'headhunter'>(
    (searchParams.get('role') as 'employer' | 'headhunter') || 'employer'
  );
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') === 'signin');
  const [loading, setLoading] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [preSelectedPlan, setPreSelectedPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check for pre-selected plan from pricing page
  useEffect(() => {
    const selectedPlan = localStorage.getItem('selectedPlan');
    if (selectedPlan) {
      setPreSelectedPlan(selectedPlan);
      // If coming with a plan, set to signup mode for headhunter
      if (searchParams.get('mode') !== 'signin') {
        setIsLogin(false);
        setActiveTab('headhunter');
      }
    }
  }, [searchParams]);

  // Handle OAuth callback and role assignment
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const roleParam = searchParams.get('role') as 'employer' | 'headhunter' | null;
      
      if (roleParam && user && profile) {
        // If user just signed in with Google and we have a role preference
        if (profile.role !== roleParam) {
          try {
            const { error } = await supabase
              .from('profiles')
              .update({ role: roleParam })
              .eq('id', user.id);

            if (error) {
              console.error('Error updating role:', error);
            } else {
              window.history.replaceState({}, '', '/');
              await refreshProfile(); // Refresh instead of full reload
            }
          } catch (error) {
            console.error('Error in OAuth callback:', error);
          }
        }
      }
    };

    handleOAuthCallback();
  }, [searchParams, user, profile, refreshProfile]);

  useEffect(() => {
    if (user && profile && !showPlanSelection) {
      // Employers always go to their dashboard
      if (profile.role === 'employer') {
        navigate('/dashboard/employer');
        return;
      }
      
      // Headhunters: check if they have a subscription
      const checkSubscription = async () => {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        // If no subscription, redirect to plans page
        if (!subscription) {
          navigate('/plans');
          return;
        }

        // If they have a subscription, check onboarding
        if (profile.onboarding_completed) {
          navigate('/dashboard/headhunter');
        } else {
          // If not completed, go to root and let VerificationWrapper handle welcome screen
          navigate('/');
        }
      };

      if (profile.role === 'headhunter') {
        checkSubscription();
      }
    }
  }, [user, profile, navigate, showPlanSelection]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(formData.email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.email = error.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.password = error.errors[0].message;
      }
    }

    if (!isLogin) {
      try {
        nameSchema.parse(formData.name);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.name = error.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          // Fetch the user's profile to check their role
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            toast.error('Error loading profile');
            return;
          }

          // Verify the selected role matches their profile role
          if (profileData.role !== activeTab) {
            await supabase.auth.signOut();
            toast.error(`This account is registered as a ${profileData.role}. Please select the correct role and try again.`);
            return;
          }

          toast.success('Welcome back!');
        }
      } else {
        // Sign up flow
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: formData.name,
              role: activeTab,
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(signUpError.message);
          }
          return;
        }

        if (data.user) {
          // Send verification email for headhunters
          if (activeTab === 'headhunter') {
            try {
              await supabase.functions.invoke('send-verification-email', {
                body: {
                  userId: data.user.id,
                  email: formData.email,
                  name: formData.name,
                },
              });
            } catch (emailError) {
              console.error('Error sending verification email:', emailError);
            }
            
            // Always redirect to plans page for headhunters after signup
            toast.success('Account created! Please select your subscription plan.');
            navigate('/plans');
          } else {
            // Employers don't need plan selection
            toast.success('Account created! Please check your email to verify your account.');
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelected = async () => {
    // Clear the pre-selected plan from localStorage
    localStorage.removeItem('selectedPlan');
    setPreSelectedPlan(null);
    await refreshProfile();
    setShowPlanSelection(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/?role=${activeTab}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Avoid redirecting inside the preview iframe
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const url = data?.url;
      if (url) {
        try {
          // Try navigating the top window first (best UX)
          if (window.top) {
            (window.top as Window).location.href = url;
          } else {
            window.location.href = url;
          }
        } catch {
          // Fallback: open in a new tab if cross-origin blocks top navigation
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } else {
        toast.error('Failed to start Google sign-in.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Failed to sign in with Google');
      setLoading(false);
    }
  };

  // Show plan selection for headhunters after signup
  if (showPlanSelection) {
    const uid = newUserId || user?.id || null;
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Welcome to Huntorix!</CardTitle>
              <CardDescription>Complete your registration by selecting a subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              {uid ? (
                <PlanSelection 
                  userId={uid} 
                  onPlanSelected={handlePlanSelected}
                  initialSelectedPlan={preSelectedPlan}
                />
              ) : (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-foreground mb-6 hover:opacity-80 transition">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to continue' : 'Choose your role to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'employer' | 'headhunter')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="employer" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employer
                </TabsTrigger>
                <TabsTrigger value="headhunter" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Headhunter
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              type="button"
              variant="outline"
              className="w-full mb-4"
              onClick={handleGoogleAuth}
              disabled={loading}
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" variant="hero" disabled={loading} size="lg">
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {isLogin ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;