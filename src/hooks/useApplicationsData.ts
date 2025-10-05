import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Application {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  type: 'application' | 'invitation';
  job?: any;
}

export const useApplicationsData = (userId: string | undefined) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchApplicationsAndInvitations = async () => {
      try {
        // Fetch both in parallel for better performance
        const [appsResult, invitesResult] = await Promise.all([
          supabase
            .from('applications')
            .select('*, job:jobs(*, employer:profiles!jobs_created_by_fkey(*))')
            .eq('headhunter_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('job_invitations')
            .select('*, job:jobs(*, employer:profiles!jobs_created_by_fkey(*))')
            .eq('headhunter_id', userId)
            .order('created_at', { ascending: false })
        ]);

        if (appsResult.error) throw appsResult.error;
        if (invitesResult.error) throw invitesResult.error;

        // Combine and mark types
        const combinedData = [
          ...(appsResult.data || []).map(app => ({ ...app, type: 'application' as const })),
          ...(invitesResult.data || []).map(invite => ({ ...invite, type: 'invitation' as const }))
        ];

        // Sort by priority (application first) then by date desc
        const sorted = [...combinedData].sort((a, b) => {
          const prioA = a.type === 'application' ? 0 : 1;
          const prioB = b.type === 'application' ? 0 : 1;
          if (prioA !== prioB) return prioA - prioB;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        // Deduplicate by job_id (prefer applications over invitations)
        const deduped = Array.from(
          new Map(sorted.map(item => [item.job_id, item])).values()
        );

        setApplications(deduped);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationsAndInvitations();
  }, [userId]);

  return { applications, loading, refetch: () => {
    if (userId) {
      setLoading(true);
      // Re-run the effect logic would be here, but for simplicity we'll just refresh
      window.location.reload();
    }
  }};
};