import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Filter, ArrowUpDown, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/DashboardLayout';

const Applications = () => {
  const { user, loading } = useRequireAuth('headhunter');
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return localStorage.getItem('headhunter_status_filter') || 'all';
  });
  const [sortBy, setSortBy] = useState<string>(() => {
    return localStorage.getItem('headhunter_sort_by') || 'newest';
  });
  const [showPendingOnly, setShowPendingOnly] = useState(() => {
    return localStorage.getItem('headhunter_show_pending') === 'true';
  });

  useEffect(() => {
    if (user && !loading) {
      fetchApplications();
    }
  }, [user, loading]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('headhunter_status_filter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('headhunter_sort_by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('headhunter_show_pending', showPendingOnly.toString());
  }, [showPendingOnly]);

  const fetchApplications = async () => {
    try {
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*, job:jobs(*, employer:profiles!jobs_created_by_fkey(*))')
        .eq('headhunter_id', user?.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch job invitations
      const { data: invitesData, error: invitesError } = await supabase
        .from('job_invitations')
        .select('*, job:jobs(*, employer:profiles!jobs_created_by_fkey(*))')
        .eq('headhunter_id', user?.id)
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;

      // Combine applications and invitations then prefer applications and most recent
      const combinedData = [
        ...(appsData || []).map(app => ({ ...app, type: 'application' })),
        ...(invitesData || []).map(invite => ({ ...invite, type: 'invitation' }))
      ];

      // Sort by priority (application first) then by date desc
      const sorted = [...combinedData].sort((a: any, b: any) => {
        const prioA = a.type === 'application' ? 0 : 1;
        const prioB = b.type === 'application' ? 0 : 1;
        if (prioA !== prioB) return prioA - prioB;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Deduplicate by job_id so first occurrence (preferred) wins
      const map = new Map();
      for (const item of sorted) {
        if (!map.has(item.job_id)) map.set(item.job_id, item);
      }
      const dedupedByJob = Array.from(map.values());

      setApplications(dedupedByJob || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-[hsl(var(--warning))]',
      submitted: 'bg-[hsl(var(--accent-pink))]',
      shortlisted: 'bg-[hsl(var(--success))]',
      selected: 'bg-[hsl(var(--success))]',
      rejected: 'bg-[hsl(var(--destructive))]',
      withdrawn: 'bg-gray-400',
      accepted: 'bg-[hsl(var(--success))]',
      declined: 'bg-gray-400',
    };
    return colors[status] || 'bg-gray-400';
  };

  const handleChat = (jobId: string) => {
    const app = applications.find(a => a.job_id === jobId);
    if (app?.job?.created_by) {
      navigate(`/messages?job=${jobId}&with=${app.job.created_by}`);
    }
  };

  // Filter and sort applications
  const getFilteredAndSortedApplications = () => {
    let filtered = applications;

    // Apply pending review filter - explicitly exclude rejected/declined
    if (showPendingOnly) {
      filtered = filtered.filter(app => {
        // Exclude rejected and declined statuses
        if (app.status === 'rejected' || app.status === 'declined') {
          return false;
        }
        // Include pending invitations and submitted applications
        return (app.type === 'invitation' && app.status === 'pending') ||
               (app.type === 'application' && app.status === 'submitted');
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter(app => {
          // Exclude rejected and declined statuses
          if (app.status === 'rejected' || app.status === 'declined') {
            return false;
          }
          return (app.type === 'invitation' && app.status === 'pending') ||
                 (app.type === 'application' && app.status === 'submitted');
        });
      } else {
        filtered = filtered.filter(app => app.status === statusFilter);
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredApplications = getFilteredAndSortedApplications();

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container px-6 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            My Applications
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your application status
          </p>
        </div>

        <Card>
          <CardHeader className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-lg">{filteredApplications.length} {filteredApplications.length === 1 ? 'Application' : 'Applications'}</CardTitle>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3 pt-3 border-t">
              <Button
                variant={showPendingOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPendingOnly(!showPendingOnly)}
                className="h-8 text-xs"
              >
                Pending Review
              </Button>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <Filter className="mr-1.5 h-3 w-3" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <ArrowUpDown className="mr-1.5 h-3 w-3" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {applications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No applications yet</p>
                <Button 
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate('/opportunities')}
                >
                  Browse Jobs
                </Button>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No applications match your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app) => (
                  <Card key={`${app.type}-${app.id}`} className="hover:shadow-md transition-shadow">
                    <CardHeader className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/jobs/${app.job_id}`, { state: { from: 'applications' } })}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{app.job?.title}</CardTitle>
                            <Badge variant="outline" className="text-xs h-5">
                              #{app.job?.job_id_number}
                            </Badge>
                            {app.type === 'invitation' && (
                              <Badge className="bg-[hsl(var(--accent-lilac))] text-white text-xs h-5">
                                Invitation
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs">
                            {app.job?.employer?.company_name || app.job?.employer?.name} • 
                            {app.type === 'invitation' ? 'Invited' : 'Applied'} {new Date(app.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-xs h-5 ${getStatusColor(app.status)}`}>
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="flex gap-2">
                        {app.status === 'shortlisted' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleChat(app.job_id)}
                            className="h-7 text-xs"
                          >
                            <MessageCircle className="mr-1.5 h-3 w-3" />
                            Chat
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/jobs/${app.job_id}`, { state: { from: 'applications' } })}
                          className="h-7 text-xs"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Applications;
