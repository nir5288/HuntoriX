import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      // Check if headhunter account is verified and active
      if (data.role === 'headhunter' && data.account_status === 'deactivated') {
        await supabase.auth.signOut();
        toast.error('Your account has been deactivated. Please contact support.');
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      // Clear sidebar state cookie on logout
      document.cookie = 'sidebar:state=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(requiredRole?: string) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only run auth checks after loading is complete and we have stable data
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Only check role if we have a profile and a required role
    if (requiredRole && profile?.role && profile.role !== requiredRole) {
      // More defensive check: only navigate if we're actually ON a page that requires the wrong role
      // This prevents redirects when components briefly mount during render
      const isOnEmployerPage = location.pathname.startsWith('/dashboard/employer') || 
                               location.pathname.startsWith('/my-jobs') || 
                               location.pathname.startsWith('/saved-headhunters');
      const isOnHeadhunterPage = location.pathname.startsWith('/dashboard/headhunter') || 
                                 location.pathname.startsWith('/applications');
      
      // Only redirect if user is actually viewing a page that requires different access
      const shouldRedirect = 
        (requiredRole === 'employer' && isOnEmployerPage && profile.role !== 'employer') ||
        (requiredRole === 'headhunter' && isOnHeadhunterPage && profile.role !== 'headhunter');
      
      if (shouldRedirect) {
        const correctPath = profile.role === 'employer' ? '/dashboard/employer' : '/dashboard/headhunter';
        toast.error(`This page requires ${requiredRole} access`);
        navigate(correctPath, { replace: true });
      }
    }
  }, [user, profile?.role, loading, requiredRole, navigate, location.pathname]);

  return { user, profile, loading };
}
