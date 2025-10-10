import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Briefcase, Clock, CheckCircle, MessageCircle, Heart, AlertCircle, Filter, ArrowUpDown, Mail, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
const HeadhunterDashboard = () => {
  const {
    user,
    profile,
    loading
  } = useRequireAuth('headhunter');
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return localStorage.getItem('headhunter_status_filter') || 'all';
  });
  const [sortBy, setSortBy] = useState<string>(() => {
    return localStorage.getItem('headhunter_sort_by') || 'newest';
  });
  const [resendingVerification, setResendingVerification] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(() => {
    return localStorage.getItem('headhunter_show_pending') === 'true';
  });
  
  // Show loading screen while auth is loading
  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }
  useEffect(() => {
    if (user && !loading) {
      fetchDashboardData();
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
  const fetchDashboardData = async () => {
    try {
      // Fetch user's applications with employer info
      const {
        data: appsData,
        error: appsError
      } = await supabase.from('applications').select('*, job:jobs(id, title, job_id_number, is_exclusive, created_by, employer:profiles!jobs_created_by_fkey(*))').eq('headhunter_id', user?.id).order('created_at', {
        ascending: false
      });
      if (appsError) throw appsError;

      // Fetch job invitations
      const {
        data: invitesData,
        error: invitesError
      } = await supabase.from('job_invitations').select('*, job:jobs(id, title, job_id_number, is_exclusive, created_by, employer:profiles!jobs_created_by_fkey(*))').eq('headhunter_id', user?.id).order('created_at', {
        ascending: false
      });
      if (invitesError) throw invitesError;

      // Combine applications and invitations then prefer applications and most recent
      const combinedData = [...(appsData || []).map(app => ({
        ...app,
        type: 'application'
      })), ...(invitesData || []).map(invite => ({
        ...invite,
        type: 'invitation'
      }))];

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

      // Get job IDs that user has already applied to
      const appliedJobIds = new Set(appsData?.map(app => app.job_id) || []);

      // Fetch public jobs excluding ones user has already applied to
      const {
        data: jobsData,
        error: jobsError
      } = await supabase.from('jobs').select('*, employer:profiles!jobs_created_by_fkey(*)').eq('visibility', 'public').in('status', ['open', 'shortlisted']).order('created_at', {
        ascending: false
      }).limit(10);
      if (jobsError) throw jobsError;

      // Filter out jobs user has already applied to
      const filteredJobs = (jobsData || []).filter(job => !appliedJobIds.has(job.id));
      setJobs(filteredJobs);

      // Fetch saved jobs count
      const {
        count,
        error: savedError
      } = await supabase.from('saved_jobs').select('*', {
        count: 'exact',
        head: true
      }).eq('user_id', user?.id);
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
      pending: 'bg-[hsl(var(--warning))]',
      submitted: 'bg-[hsl(var(--accent-pink))]',
      shortlisted: 'bg-[hsl(var(--success))]',
      selected: 'bg-[hsl(var(--success))]',
      rejected: 'bg-[hsl(var(--destructive))]',
      withdrawn: 'bg-gray-400',
      accepted: 'bg-[hsl(var(--success))]',
      declined: 'bg-gray-400'
    };
    return colors[status] || 'bg-gray-400';
  };
  const handleChat = (jobId: string) => {
    const app = applications.find(a => a.job_id === jobId);
    if (app?.job?.created_by) {
      navigate(`/messages?job=${jobId}&with=${app.job.created_by}`);
    }
  };
  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('send-verification-email', {
        body: {
          userId: user?.id,
          email: user?.email,
          name: profile?.name || 'there'
        }
      });
      if (error) throw error;
      if (data?.error || data?.emailResponse?.error) {
        toast.error('Failed to send email. Please try again.');
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setResendingVerification(false);
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
        return app.type === 'invitation' && app.status === 'pending' || app.type === 'application' && app.status === 'submitted';
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
          return app.type === 'invitation' && app.status === 'pending' || app.type === 'application' && app.status === 'submitted';
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
    return <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>;
  }
  return <div className="container px-6 pb-4 sm:pb-6 max-w-7xl -mt-6 sm:-mt-8">
        {/* Verification Banner */}
        {!profile?.email_verified && <Alert className="mb-4 border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10">
            <Mail className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">Verify your email to unlock full access</AlertTitle>
            <AlertDescription className="flex items-center gap-3 mt-2 text-xs">
              <span>Please check your inbox and verify your email address.</span>
              <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={resendingVerification} className="h-7 text-xs">
                {resendingVerification ? 'Sending...' : 'Resend'}
              </Button>
            </AlertDescription>
          </Alert>}

        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between mb-6 gap-4">
          <div className="w-full sm:w-auto text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
              Headhunter Dashboard
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Browse jobs and manage your applications</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button size="lg" onClick={() => navigate('/opportunities')} className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950 h-14 text-lg px-8 flex-1 sm:flex-initial">
              <Search className="mr-2 h-6 w-6" />
              Browse Jobs
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/saved-jobs')} className="relative h-14 text-lg px-8 flex-1 sm:flex-initial">
              <Heart className="mr-2 h-6 w-6" />
              Saved Jobs
              {savedJobsCount > 0 && <Badge className="ml-2 bg-[hsl(var(--accent-pink))] text-white h-6 px-2.5 text-sm">
                  {savedJobsCount}
                </Badge>}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <TooltipProvider delayDuration={0}>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <Card className={`cursor-pointer transition-all ${applications.filter(a => a.type === 'invitation' && a.status === 'pending' || a.type === 'application' && a.status === 'submitted').length > 0 ? 'bg-[hsl(var(--warning))]/10 hover:bg-[hsl(var(--warning))]/20 border-[hsl(var(--warning))]/30' : ''}`} onClick={() => {
          const pendingCount = applications.filter(a => a.type === 'invitation' && a.status === 'pending' || a.type === 'application' && a.status === 'submitted').length;
          if (pendingCount > 0) {
            setShowPendingOnly(!showPendingOnly);
          }
        }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4 min-h-[60px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-xs sm:text-sm font-medium cursor-help flex items-center gap-1 leading-tight">
                      Pending Review
                      <AlertCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Job invitations and applications pending your action</p>
                  </TooltipContent>
                </Tooltip>
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 min-h-[72px] flex flex-col justify-start">
                <div className="text-2xl sm:text-3xl font-bold">
                  {applications.filter(a => a.type === 'invitation' && a.status === 'pending' || a.type === 'application' && a.status === 'submitted').length}
                </div>
                {applications.filter(a => a.type === 'invitation' && a.status === 'pending' || a.type === 'application' && a.status === 'submitted').length > 0 && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Click to {showPendingOnly ? 'show all' : 'filter'}
                  </p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4 min-h-[60px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-xs sm:text-sm font-medium cursor-help flex items-center gap-1 leading-tight">
                      Active Applications
                      <AlertCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Applications that are currently submitted or shortlisted</p>
                  </TooltipContent>
                </Tooltip>
                <Briefcase className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 min-h-[72px] flex flex-col justify-start">
                <div className="text-2xl sm:text-3xl font-bold">
                  {applications.filter(a => a.type === 'application' && ['submitted', 'shortlisted'].includes(a.status)).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4 min-h-[60px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-xs sm:text-sm font-medium cursor-help flex items-center gap-1 leading-tight">
                      Successful Placements
                      <AlertCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Applications where you were selected for the position</p>
                  </TooltipContent>
                </Tooltip>
                <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 min-h-[72px] flex flex-col justify-start">
                <div className="text-2xl sm:text-3xl font-bold">
                  {applications.filter(a => a.type === 'application' && a.status === 'selected').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4 min-h-[60px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-xs sm:text-sm font-medium cursor-help flex items-center gap-1 leading-tight">
                      Response Time
                      <AlertCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average response time for employer communications</p>
                  </TooltipContent>
                </Tooltip>
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 min-h-[72px] flex flex-col justify-start">
                <div className="text-2xl sm:text-3xl font-bold">
                  {profile?.response_time_hours ? profile.response_time_hours < 2 ? <span className="text-[hsl(var(--success))]">Under 2h</span> : profile.response_time_hours < 24 ? <span className="text-[hsl(var(--accent-mint))]">Under 24h</span> : <span className="text-[hsl(var(--warning))]">Over 24h</span> : <span className="text-muted-foreground text-base">N/A</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4 min-h-[60px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-xs sm:text-sm font-medium cursor-help flex items-center gap-1 leading-tight">
                      Success Rate
                      <AlertCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>% of submitted candidates marked as relevant by employers</p>
                  </TooltipContent>
                </Tooltip>
                <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 min-h-[72px] flex flex-col justify-start">
                <div className="text-2xl sm:text-3xl font-bold">
                  {profile?.success_rate ? `${profile.success_rate}%` : '0%'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TooltipProvider>

        {/* My Applications */}
        <Card className="mb-6">
          <CardHeader className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center sm:text-left flex-1 sm:flex-initial">
                <CardTitle className="text-xl sm:text-2xl font-bold">My Applications</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1">Track your application status</CardDescription>
              </div>
              {applications.length > 5 && <Button size="sm" onClick={() => navigate('/applications')} className="hidden sm:inline-flex bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950 h-8 text-xs">
                  View All
                </Button>}
            </div>
            
            {/* Filters */}
            {applications.length > 0 && <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-3 border-t items-center">
                <Button
                  variant={showPendingOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPendingOnly(!showPendingOnly)}
                  className="w-full sm:w-auto h-10 sm:h-8 text-sm sm:text-xs gap-2"
                >
                  {showPendingOnly && <Check className="h-4 sm:h-3.5 w-4 sm:w-3.5" />}
                  Pending Review
                </Button>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 sm:h-8 w-full sm:w-[140px] text-sm sm:text-xs">
                    <Filter className="mr-1.5 h-4 sm:h-3 w-4 sm:w-3" />
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
                  <SelectTrigger className="h-10 sm:h-8 w-full sm:w-[140px] text-sm sm:text-xs">
                    <ArrowUpDown className="mr-1.5 h-4 sm:h-3 w-4 sm:w-3" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="status">By Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>}
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {applications.length === 0 ? <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No applications yet</p>
              </div> : filteredApplications.length === 0 ? <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No applications match your filters</p>
              </div> : <>
                <div className="space-y-3">
                {filteredApplications.slice(0, 5).map(app => <Card key={`${app.type}-${app.id}`} className={`group hover:shadow-md transition-shadow cursor-pointer ${
                    app.job?.is_exclusive ? 'exclusive-job-card' : ''
                  }`} onClick={() => navigate(`/jobs/${app.job_id}`, { state: { from: 'dashboard' } })}>
                    <CardHeader className="px-5 sm:px-6 py-5 sm:py-6">
                      {/* Mobile layout */}
                      <div className="flex flex-col gap-4 sm:hidden">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg font-semibold leading-tight">{app.job?.title}</CardTitle>
                            {app.job?.job_id_number && (
                              <Badge variant="outline" className="text-xs h-6 px-2 shrink-0">
                                #{app.job?.job_id_number}
                              </Badge>
                            )}
                          </div>
                          
                          <CardDescription className="text-sm leading-relaxed">
                            {app.job?.employer?.company_name || app.job?.employer?.name} • {app.type === 'invitation' ? 'Invited' : 'Applied'} {new Date(app.created_at).toLocaleDateString()}
                          </CardDescription>
                          
                          <div className="flex flex-wrap gap-2">
                            {app.job?.is_exclusive && (
                              <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-xs h-6 px-2">
                                HuntoriX Exclusive
                              </Badge>
                            )}
                            {app.type === 'invitation' && (
                              <Badge className="bg-[hsl(var(--accent-lilac))] text-white text-xs h-6 px-2">
                                Invitation
                              </Badge>
                            )}
                            <Badge className={`text-xs h-6 px-2 ${getStatusColor(app.status)}`}>
                              {app.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-3 border-t">
                          {app.status === 'shortlisted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChat(app.job_id);
                              }}
                              className="w-full h-10 text-sm justify-start"
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Chat with Employer
                            </Button>
                          )}
                          {app.type === 'invitation' && app.status === 'pending' && (
                            <Button
                              variant="hero"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/job-review/${app.job_id}`, { state: { from: 'dashboard' } });
                              }}
                              className="w-full h-10 text-sm justify-start"
                            >
                              Review Invitation
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Tablet & Desktop layout */}
                      <div className="hidden sm:flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => navigate(`/jobs/${app.job_id}`, {
                  state: {
                    from: 'dashboard'
                  }
                })}>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base sm:text-lg">{app.job?.title}</CardTitle>
                            <Badge variant="outline" className="text-xs sm:text-sm h-6 px-3">
                              #{app.job?.job_id_number}
                            </Badge>
                            {app.job?.is_exclusive && (
                              <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-xs sm:text-sm h-6">
                                HuntoriX Exclusive
                              </Badge>
                            )}
                            {app.type === 'invitation' && <Badge className="bg-[hsl(var(--accent-lilac))] text-white text-xs sm:text-sm h-6">
                                Invitation
                              </Badge>}
                          </div>
                          <CardDescription className="text-sm sm:text-base">
                            {app.type === 'invitation' ? 'Invited' : 'Applied'} {new Date(app.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-xs sm:text-sm h-6 px-3 ${getStatusColor(app.status)}`}>
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 hidden sm:block">
                      <div className="flex gap-2">
                        {app.status === 'shortlisted' && <Button size="sm" variant="outline" onClick={e => {
                  e.stopPropagation();
                  handleChat(app.job_id);
                }} className="h-8 text-sm">
                            <MessageCircle className="mr-1.5 h-4 w-4" />
                            Chat
                          </Button>}
                        <Button size="sm" variant="outline" onClick={e => {
                  e.stopPropagation();
                  navigate(`/jobs/${app.job_id}`, {
                    state: {
                      from: 'dashboard'
                    }
                  });
                }} className="h-8 text-sm">
                          View Details
                        </Button>
                        {app.type === 'invitation' && app.status === 'pending' && <Button size="sm" variant="hero" onClick={e => {
                  e.stopPropagation();
                  navigate(`/job-review/${app.job_id}`, {
                    state: {
                      from: 'dashboard'
                    }
                  });
                }} className="h-8 text-sm">
                            Review
                          </Button>}
                      </div>
                    </CardContent>
                  </Card>)}
              </div>
              {applications.length > 5 && (
                <div className="mt-4 text-center">
                  <Button 
                    onClick={() => navigate('/applications')}
                    className="w-full bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950"
                  >
                    View All Applications
                  </Button>
                </div>
              )}
              </>}
          </CardContent>
        </Card>

        {/* Recommended Jobs */}
        <Card>
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-lg">Recommended Jobs</CardTitle>
            <CardDescription className="text-xs">Jobs matching your expertise</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {jobs.length === 0 ? <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No jobs available at the moment</p>
              </div> : <div className="space-y-3">
                {jobs.map(job => <Card key={job.id} className={`hover:shadow-md transition-shadow cursor-pointer ${
                  job.is_exclusive ? 'exclusive-job-card' : ''
                }`} onClick={() => navigate(`/jobs/${job.id}`, {
            state: {
              from: 'dashboard'
            }
          })}>
                    <CardHeader className="px-5 sm:px-6 py-5 sm:py-6">
                      {/* Mobile layout */}
                      <div className="flex flex-col gap-4 sm:hidden">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg font-semibold leading-tight">{job.title}</CardTitle>
                            {job.job_id_number && (
                              <Badge variant="outline" className="text-xs h-6 px-2 shrink-0">
                                #{job.job_id_number}
                              </Badge>
                            )}
                          </div>
                          
                          <CardDescription className="text-sm leading-relaxed">
                            {job.employer?.company_name || job.employer?.name} • {job.location}
                          </CardDescription>
                          
                          <div className="flex flex-wrap gap-2">
                            {job.is_exclusive && (
                              <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-xs h-6 px-2">
                                HuntoriX Exclusive
                              </Badge>
                            )}
                            <Badge className="bg-[hsl(var(--accent-mint))] text-white text-xs h-6 px-2">
                              {job.fee_model === 'percent_fee' ? `${job.fee_value}%` : `${job.fee_value} ${job.budget_currency}`}
                            </Badge>
                          </div>

                          {job.skills_must && job.skills_must.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-3 border-t">
                              {job.skills_must.slice(0, 3).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs h-6 px-2">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop & Tablet layout - original */}
                      <div className="hidden sm:flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <CardTitle className="text-base sm:text-lg">{job.title}</CardTitle>
                            <Badge variant="outline" className="text-xs sm:text-sm h-6 px-3">
                              #{job.job_id_number}
                            </Badge>
                            {job.is_exclusive && (
                              <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-xs sm:text-sm h-6">
                                HuntoriX Exclusive
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm sm:text-base">
                            {job.employer?.company_name || job.employer?.name} • {job.location}
                          </CardDescription>
                          {job.skills_must && job.skills_must.length > 0 && <div className="flex flex-wrap gap-2 mt-2">
                              {job.skills_must.slice(0, 4).map((skill: string, idx: number) => <Badge key={idx} variant="secondary" className="text-xs sm:text-sm h-6 px-3">{skill}</Badge>)}
                            </div>}
                        </div>
                        <Badge className="bg-[hsl(var(--accent-mint))] text-white text-xs sm:text-sm h-6 px-3">
                          {job.fee_model === 'percent_fee' ? `${job.fee_value}%` : `${job.fee_value} ${job.budget_currency}`}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>)}
              </div>}
          </CardContent>
        </Card>
      </div>;
};
export default HeadhunterDashboard;