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

const Applications = () => {
  const { user, loading } = useRequireAuth('headhunter');
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    if (user && !loading) {
      fetchApplications();
    }
  }, [user, loading]);

  const fetchApplications = async () => {
    try {
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*, job:jobs(*, employer:profiles!jobs_created_by_fkey(*))')
        .eq('headhunter_id', user?.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(appsData || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-[hsl(var(--accent-pink))]',
      shortlisted: 'bg-[hsl(var(--success))]',
      selected: 'bg-[hsl(var(--success))]',
      rejected: 'bg-[hsl(var(--destructive))]',
      withdrawn: 'bg-gray-400',
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

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
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
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard/headhunter')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            {filteredApplications.length} {filteredApplications.length === 1 ? 'Application' : 'Applications'}
          </h1>
          <p className="text-muted-foreground mb-4">
            Track your application status
          </p>
        </div>

        <Card>
          <CardHeader>
            
            {/* Filters */}
            <div className="flex gap-3 mt-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No applications yet</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/opportunities')}
                >
                  Browse Jobs
                </Button>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No applications match your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((app) => (
                  <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/jobs/${app.job_id}`, { state: { from: 'applications' } })}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg opacity-90">{app.job?.title}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              #{app.job?.job_id_number}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">
                            {app.job?.employer?.company_name || app.job?.employer?.name} • 
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(app.status)} opacity-95`}>
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {app.status === 'shortlisted' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleChat(app.job_id)}
                            className="opacity-95"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Chat with Employer
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/jobs/${app.job_id}`, { state: { from: 'applications' } })}
                        >
                          View Job Details
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
    </div>
  );
};

export default Applications;
