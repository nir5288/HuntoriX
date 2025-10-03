import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Briefcase, Clock, CheckCircle, MessageCircle, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const HeadhunterDashboard = () => {
  const { user, profile, loading } = useRequireAuth('headhunter');
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      fetchDashboardData();
    }
  }, [user, loading]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's applications with employer info
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*, job:jobs(*, employer:profiles!jobs_created_by_fkey(*))')
        .eq('headhunter_id', user?.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(appsData || []);

      // Get job IDs that user has already applied to
      const appliedJobIds = new Set(appsData?.map(app => app.job_id) || []);

      // Fetch public jobs excluding ones user has already applied to
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, employer:profiles!jobs_created_by_fkey(*)')
        .eq('visibility', 'public')
        .in('status', ['open', 'shortlisted'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) throw jobsError;
      
      // Filter out jobs user has already applied to
      const filteredJobs = (jobsData || []).filter(job => !appliedJobIds.has(job.id));
      setJobs(filteredJobs);

      // Fetch saved jobs count
      const { count, error: savedError } = await supabase
        .from('saved_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (savedError) throw savedError;
      setSavedJobsCount(count || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
              Headhunter Dashboard
            </h1>
            <p className="text-muted-foreground">Browse jobs and manage your applications</p>
            {!profile?.verified && (
              <Badge variant="outline" className="mt-2 bg-[hsl(var(--warning))]/10">
                Pending Verification
              </Badge>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/saved-jobs')}
              className="relative"
            >
              <Heart className="mr-2 h-5 w-5" />
              My Saved Jobs
              {savedJobsCount > 0 && (
                <Badge className="ml-2 bg-[hsl(var(--accent-pink))] opacity-95">
                  {savedJobsCount}
                </Badge>
              )}
            </Button>
            <Button 
              size="lg" 
              onClick={() => navigate('/opportunities')}
              className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90 opacity-95"
            >
              <Search className="mr-2 h-5 w-5" />
              Browse All Jobs
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Active Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(a => ['submitted', 'shortlisted'].includes(a.status)).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Successful Placements</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(a => a.status === 'selected').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Response Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.length > 0 
                  ? `${Math.round((applications.filter(a => a.status !== 'submitted').length / applications.length) * 100)}%`
                  : '0%'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Applications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="opacity-90">My Applications</CardTitle>
            <CardDescription>Track your application status</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No applications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => navigate(`/jobs/${app.job_id}`, { state: { from: 'dashboard' } })} style={{ cursor: 'pointer' }}>
                          <CardTitle className="text-lg opacity-90">{app.job?.title}</CardTitle>
                          <CardDescription className="mt-1">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="opacity-90">Recommended Jobs</CardTitle>
            <CardDescription>Jobs matching your expertise</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No jobs available at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`, { state: { from: 'dashboard' } })}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl opacity-90">{job.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {job.employer?.company_name || job.employer?.name} • {job.location}
                          </CardDescription>
                          {job.skills_must && job.skills_must.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {job.skills_must.slice(0, 5).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="opacity-90">{skill}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge className="bg-[hsl(var(--accent-mint))] opacity-95">
                          {job.fee_model === 'percent_fee' ? `${job.fee_value}%` : `${job.fee_value} ${job.budget_currency}`}
                        </Badge>
                      </div>
                    </CardHeader>
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

export default HeadhunterDashboard;
