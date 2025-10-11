import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

export function useUpdateLastSeen() {
  const { user } = useAuth();
  const { status } = useUserPreferences();

  useEffect(() => {
    if (!user) return;

    // Update last_seen and status on mount
    const updateLastSeen = async () => {
      try {
        // Verify session is still valid before updating
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No valid session for last_seen update');
          return;
        }
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            last_seen: new Date().toISOString(),
            status: status 
          })
          .eq('id', user.id);
        
        // Silently ignore errors to prevent console spam
        if (error && error.code !== 'PGRST116') {
          console.error('Error updating last_seen:', error);
        }
      } catch (error) {
        // Silently catch errors to prevent breaking the app
        console.error('Caught error in updateLastSeen:', error);
      }
    };

    updateLastSeen();

    // Update every 60 seconds while the user is active
    const interval = setInterval(updateLastSeen, 60000);

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateLastSeen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, status]);
}
