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
import { Briefcase, Users, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { PlanSelection } from '@/components/PlanSelection';

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(8, { message: "Password must be at least 8 characters" });
const nameSchema = z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'employer' | 'headhunter'>(
    (searchParams.get('role') as 'employer' | 'headhunter') || 'employer'
  );
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') === 'signin');
  const [loading, setLoading] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && profile && !showPlanSelection) {
      const redirectPath = profile.role === 'employer' ? '/dashboard/employer' : '/dashboard/headhunter';
      navigate(redirectPath);
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
            
            // Show plan selection for headhunters
            setNewUserId(data.user.id);
            setShowPlanSelection(true);
            toast.success('Account created! Please select your subscription plan.');
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

  const handlePlanSelected = () => {
    setShowPlanSelection(false);
    toast.success('Welcome to Huntorix! Please check your email to verify your account.');
    navigate('/');
  };

  // Show plan selection for headhunters after signup
  if (showPlanSelection && newUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Welcome to Huntorix!</CardTitle>
              <CardDescription>Complete your registration by selecting a subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanSelection userId={newUserId} onPlanSelected={handlePlanSelected} />
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
