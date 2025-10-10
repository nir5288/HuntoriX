import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, Users, Clock, Check, X, MessageCircle, Eye, EyeOff, Heart, Star, Pencil, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PostJobModal } from '@/components/PostJobModal';
import { EditJobModal } from '@/components/EditJobModal';
import { JobEditHistory } from '@/components/JobEditHistory';
import { OnHoldReasonModal } from '@/components/OnHoldReasonModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
const EmployerDashboard = () => {
  const {
    user,
    profile,
    loading
  } = useRequireAuth('employer');
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [postJobModalOpen, setPostJobModalOpen] = useState(false);
  const [editJobModalOpen, setEditJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [editHistoryModalOpen, setEditHistoryModalOpen] = useState(false);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [savedHeadhuntersCount, setSavedHeadhuntersCount] = useState(0);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>(() => {
    return (localStorage.getItem('employer_dashboard_sort_by') as 'latest' | 'oldest') || 'latest';
  });
  const [showPendingOnly, setShowPendingOnly] = useState(() => {
    return localStorage.getItem('employer_dashboard_show_pending') === 'true';
  });
  const [showPrivateOnly, setShowPrivateOnly] = useState(() => {
    return localStorage.getItem('employer_dashboard_show_private') === 'true';
  });
  const [jobEditCounts, setJobEditCounts] = useState<Record<string, number>>({});
  const [visibleJobCount, setVisibleJobCount] = useState(3);
  const [onHoldModalOpen, setOnHoldModalOpen] = useState(false);
  const [jobToUpdateStatus, setJobToUpdateStatus] = useState<any>(null);
  
  useEffect(() => {
    if (user && !loading) {
      fetchDashboardData();
    }
  }, [user, loading]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('employer_dashboard_sort_by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('employer_dashboard_show_pending', showPendingOnly.toString());
  }, [showPendingOnly]);

  useEffect(() => {
    localStorage.setItem('employer_dashboard_show_private', showPrivateOnly.toString());
  }, [showPrivateOnly]);
  const fetchDashboardData = async () => {
    try {
      // Fetch jobs
      const {
        data: jobsData,
        error: jobsError
      } = await supabase.from('jobs').select('*').eq('created_by', user?.id).order('created_at', {
        ascending: false
      });
      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // Fetch edit counts for all jobs
      if (jobsData && jobsData.length > 0) {
        const jobIds = jobsData.map(job => job.id);
        
        const { data: editCountsData } = await supabase
          .from('job_edit_history')
          .select('job_id')
          .in('job_id', jobIds);
        
        if (editCountsData) {
          const counts: Record<string, number> = {};
          editCountsData.forEach(entry => {
            counts[entry.job_id] = (counts[entry.job_id] || 0) + 1;
          });
          setJobEditCounts(counts);
        }
      }

      // Fetch applications for those jobs
      if (jobsData && jobsData.length > 0) {
        const jobIds = jobsData.map(job => job.id);
        const {
          data: appsData,
          error: appsError
        } = await supabase.from('applications').select('*, headhunter:profiles!applications_headhunter_id_fkey(*)').in('job_id', jobIds).order('created_at', {
          ascending: false
        });
        if (appsError) throw appsError;
        setApplications(appsData || []);
      }

      // Fetch saved jobs count
      const { count, error: savedError } = await supabase
        .from('saved_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      
      if (savedError) throw savedError;
      setSavedJobsCount(count || 0);

      // Fetch saved headhunters count
      const { count: headhuntersCount, error: savedHeadhuntersError } = await supabase
        .from('saved_headhunters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      
      if (savedHeadhuntersError) throw savedHeadhuntersError;
      setSavedHeadhuntersCount(headhuntersCount || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingData(false);
    }
  };
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-[hsl(var(--success))]',
      on_hold: 'bg-[hsl(var(--warning))]',
      success: 'bg-[hsl(var(--success))]'
    };
    return colors[status] || 'bg-gray-400';
  };
  const getApplicationStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-[hsl(var(--warning))]',
      shortlisted: 'bg-[hsl(var(--accent-lilac))]',
      rejected: 'bg-destructive',
      withdrawn: 'bg-muted'
    };
    return colors[status] || 'bg-gray-400';
  };
  const handleAccept = async (applicationId: string, headhunterId: string, jobId: string) => {
    try {
      const {
        error: updateError
      } = await supabase.from('applications').update({
        status: 'shortlisted'
      }).eq('id', applicationId);
      if (updateError) throw updateError;

      // Create notification for headhunter
      const {
        error: notifError
      } = await supabase.from('notifications').insert({
        user_id: headhunterId,
        type: 'status_change',
        payload: {
          job_id: jobId,
          application_id: applicationId,
          status: 'shortlisted'
        },
        is_read: false,
        title: 'Application Shortlisted',
        message: 'Your application has been shortlisted'
      } as any);
      if (notifError) console.error('Notification error:', notifError);
      toast.success('Application accepted and headhunter notified');
      fetchDashboardData();
    } catch (error) {
      console.error('Error accepting application:', error);
      toast.error('Failed to accept application');
    }
  };
  const handleDecline = async (applicationId: string, headhunterId: string, jobId: string) => {
    try {
      const {
        error: updateError
      } = await supabase.from('applications').update({
        status: 'rejected'
      }).eq('id', applicationId);
      if (updateError) throw updateError;

      // Create notification for headhunter
      const {
        error: notifError
      } = await supabase.from('notifications').insert({
        user_id: headhunterId,
        type: 'status_change',
        payload: {
          job_id: jobId,
          application_id: applicationId,
          status: 'rejected'
        },
        is_read: false,
        title: 'Application Rejected',
        message: 'Your application has been rejected'
      } as any);
      if (notifError) console.error('Notification error:', notifError);
      toast.success('Application declined');
      fetchDashboardData();
    } catch (error) {
      console.error('Error declining application:', error);
      toast.error('Failed to decline application');
    }
  };
  const handleChat = (jobId: string, headhunterId: string) => {
    navigate(`/messages?job=${jobId}&with=${headhunterId}`);
  };

  const toggleVisibility = async (jobId: string, currentVisibility: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to job detail
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ visibility: newVisibility })
        .eq('id', jobId);
      
      if (error) throw error;
      
      toast.success(`Job is now ${newVisibility}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update job visibility');
    }
  };

  const handleEditJob = (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJob(job);
    setEditJobModalOpen(true);
  };

  const handleViewEditHistory = async (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data, error } = await supabase
        .from('job_edit_history')
        .select('*, editor:profiles!job_edit_history_edited_by_fkey(name)')
        .eq('job_id', job.id)
        .order('edited_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedHistory = data?.map(entry => ({
        id: entry.id,
        edited_at: entry.edited_at,
        edited_by: entry.edited_by,
        changes: entry.changes as any,
        editor_name: (entry.editor as any)?.name,
      })) || [];
      
      setEditHistory(formattedHistory);
      setSelectedJob(job);
      setEditHistoryModalOpen(true);
    } catch (error) {
      console.error('Error fetching edit history:', error);
      toast.error('Failed to load edit history');
    }
  };

  const handleStatusChange = async (job: any, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (newStatus === 'on_hold') {
      setJobToUpdateStatus(job);
      setOnHoldModalOpen(true);
    } else {
      // Direct update for other statuses
      try {
        const { error: jobError } = await supabase
          .from('jobs')
          .update({ status: newStatus })
          .eq('id', job.id);
        
        if (jobError) throw jobError;

        // If changing FROM on_hold to another status, mark history as resolved
        if (job.status === 'on_hold') {
          const { error: historyError } = await supabase
            .from('job_hold_history')
            .update({ resolved_at: new Date().toISOString() })
            .eq('job_id', job.id)
            .is('resolved_at', null);

          if (historyError) {
            console.error('Error updating hold history:', historyError);
          }
        }
        
        toast.success(`Job status updated to ${newStatus}`);
        fetchDashboardData();
      } catch (error) {
        console.error('Error updating job status:', error);
        toast.error('Failed to update job status');
      }
    }
  };

  const handleOnHoldConfirm = async (reason: string) => {
    if (!jobToUpdateStatus) return;
    
    try {
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'on_hold' })
        .eq('id', jobToUpdateStatus.id);
      
      if (jobError) throw jobError;

      // Store the hold reason in history
      const { error: historyError } = await supabase
        .from('job_hold_history')
        .insert({
          job_id: jobToUpdateStatus.id,
          reason: reason,
          created_by: user?.id,
        });

      if (historyError) throw historyError;
      
      toast.success(`Job put on hold: ${reason}`);
      fetchDashboardData();
      setJobToUpdateStatus(null);
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to put job on hold');
    }
  };

  const handleRejectAll = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Get all submitted applications for this job
      const jobApplications = applications.filter(a => a.job_id === jobId && a.status === 'submitted');
      
      if (jobApplications.length === 0) {
        toast.info('No pending applications to reject');
        return;
      }

      // Update all applications to rejected
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('job_id', jobId)
        .eq('status', 'submitted');

      if (updateError) throw updateError;

      // Create notifications for all headhunters
      const notifications = jobApplications.map(app => ({
        user_id: app.headhunter_id,
        type: 'status_change',
        payload: {
          job_id: jobId,
          application_id: app.id,
          status: 'rejected'
        },
        is_read: false,
        title: 'Application Rejected',
        message: 'Your application has been rejected'
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications as any);

      if (notifError) console.error('Notification error:', notifError);

      toast.success(`Rejected ${jobApplications.length} applications`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting applications:', error);
      toast.error('Failed to reject applications');
    }
  };

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

  if (loadingData) {
    return (
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
    );
  }
  // Render different UI variants
  const renderVariant1 = () => (
    <>
      <div className="w-full px-4 sm:px-6 pb-4 sm:pb-6 -mt-2 sm:-mt-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between mb-6 gap-4">
          <div className="w-full sm:w-auto text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
              Employer Dashboard
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Manage your job postings and applications</p>
          </div>
          <Button size="lg" onClick={() => setPostJobModalOpen(true)} className="w-full sm:w-auto h-12 text-base bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950">
            <Plus className="mr-2 h-5 w-5" />
            Post Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4 min-h-[60px]">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{jobs.filter(j => j.status === 'open').length}</div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              applications.filter(a => a.status === 'submitted').length > 0 
                ? 'bg-[hsl(var(--warning))]/10 hover:bg-[hsl(var(--warning))]/20 border-[hsl(var(--warning))]/30' 
                : ''
            }`}
            onClick={() => {
              if (applications.filter(a => a.status === 'submitted').length > 0) {
                setShowPendingOnly(!showPendingOnly);
              }
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4 min-h-[60px]">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-2xl sm:text-3xl font-bold">
                {applications.filter(a => a.status === 'submitted').length}
              </div>
              {applications.filter(a => a.status === 'submitted').length > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Click to {showPendingOnly ? 'show all' : 'filter'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card onClick={() => navigate('/saved-headhunters')} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4 min-h-[60px]">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Saved Headhunters</CardTitle>
              <Star className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{savedHeadhuntersCount}</div>
            </CardContent>
          </Card>

          <Card onClick={() => navigate('/saved-jobs')} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4 min-h-[60px]">
              <CardTitle className="text-xs sm:text-sm font-medium">Saved Jobs</CardTitle>
              <Heart className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{savedJobsCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <Card>
          <CardHeader className="px-4 py-4">
            <div className="text-center sm:text-left">
              <CardTitle className="text-xl sm:text-2xl font-bold">My Jobs</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">View and manage your job postings</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 pt-4 border-t mt-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="sort-jobs" className="text-sm sm:text-base font-medium shrink-0">Sort:</Label>
                <Select value={sortBy} onValueChange={(value: 'latest' | 'oldest') => setSortBy(value)}>
                  <SelectTrigger id="sort-jobs" className="h-10 sm:h-11 w-full sm:w-[140px] text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant={showPendingOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPendingOnly(!showPendingOnly)}
                  className="w-full sm:w-auto h-10 text-sm sm:text-base"
                >
                  Pending Review
                </Button>
                <Button
                  variant={showPrivateOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPrivateOnly(!showPrivateOnly)}
                  className="w-full sm:w-auto h-10 text-sm sm:text-base"
                >
                  Private Only
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {jobs.length === 0 ? <div className="text-center py-8">
                <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-semibold mb-1.5">No jobs yet</h3>
                <p className="text-sm text-muted-foreground mb-3">Post your first job to get started</p>
                <Button size="sm" variant="hero" onClick={() => setPostJobModalOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Post a Job
                </Button>
              </div> : <div className="space-y-3">
                {(() => {
                  // Filter jobs
                  let filteredJobs = [...jobs];
                  
                  // Filter by pending review
                  if (showPendingOnly) {
                    filteredJobs = filteredJobs.filter(job => {
                      const jobApplications = applications.filter(a => a.job_id === job.id);
                      return jobApplications.some(a => a.status === 'submitted');
                    });
                  }
                  
                  // Filter by private visibility
                  if (showPrivateOnly) {
                    filteredJobs = filteredJobs.filter(job => job.visibility === 'private');
                  }
                  
                  // Sort jobs
                  filteredJobs.sort((a, b) => {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
                  });
                  
                  if (filteredJobs.length === 0) {
                    return (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No jobs match your filters
                      </div>
                    );
                  }
                  
                  // Show only visible jobs based on pagination
                  const visibleJobs = filteredJobs.slice(0, visibleJobCount);
                  const hasMore = filteredJobs.length > visibleJobCount;
                  
                  return (
                    <>
                      {visibleJobs.map(job => {
              const jobApplications = applications.filter(a => a.job_id === job.id);
              const pendingCount = jobApplications.filter(a => a.status === 'submitted').length;
              return <Card key={job.id} className={`group hover:shadow-md transition-shadow cursor-pointer ${
                job.is_exclusive ? 'exclusive-job-card' : ''
              }`} onClick={() => navigate(`/jobs/${job.id}`, { state: { from: 'dashboard' } })}>
                      <CardHeader className="px-5 sm:px-6 py-5 sm:py-6">
                        {/* Mobile layout - enhanced */}
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
                              {job.location} • {job.employment_type?.replace('_', ' ')}
                            </CardDescription>
                            
                            <div className="flex flex-wrap gap-2">
                              {job.is_exclusive && (
                                <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-xs h-6 px-2">
                                  HuntoriX Exclusive
                                </Badge>
                              )}
                              {pendingCount > 0 && (
                                <Badge className="bg-[hsl(var(--warning))] text-white text-xs h-6 px-2">
                                  {pendingCount} Pending
                                </Badge>
                              )}
                              <Badge className={`text-xs h-6 px-2 ${getStatusColor(job.status)}`}>
                                {job.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleEditJob(job, e)}
                              className="w-full h-10 text-sm justify-start"
                            >
                              <Pencil className="h-4 w-4 mr-2 text-[hsl(var(--accent-pink))]" />
                              Edit Job
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                              className="w-full h-10 text-sm justify-start"
                            >
                              {job.visibility === 'public' ? (
                                <>
                                  <Eye className="h-4 w-4 mr-2 text-[hsl(var(--accent-mint))]" />
                                  Make Private
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2 text-muted-foreground" />
                                  Make Public
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/headhunters');
                              }}
                              className="w-full h-10 text-sm justify-start"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Invite to Job
                            </Button>
                            {jobEditCounts[job.id] > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleViewEditHistory(job, e)}
                                className="w-full h-10 text-sm justify-start"
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Last Edited ({jobEditCounts[job.id]} {jobEditCounts[job.id] === 1 ? 'edit' : 'edits'})
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Tablet & Desktop layout - side by side */}
                        <div className="hidden sm:flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-base sm:text-lg break-words">{job.title}</CardTitle>
                              {job.job_id_number && (
                                <Badge variant="outline" className="text-xs sm:text-sm h-6 shrink-0">
                                  #{job.job_id_number}
                                </Badge>
                              )}
                              {job.is_exclusive && (
                                <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-xs sm:text-sm h-6 px-3">
                                  HuntoriX Exclusive
                                </Badge>
                              )}
                            </div>
                            {pendingCount > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-[hsl(var(--warning))] text-white text-xs sm:text-sm h-6">
                                  {pendingCount} Pending
                                </Badge>
                              </div>
                            )}
                            <CardDescription className="text-sm sm:text-base">
                              {job.location} • {job.employment_type?.replace('_', ' ')}
                            </CardDescription>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-6 text-[10px] sm:text-xs px-2 gap-1 ${getStatusColor(job.status)} border-0 hover:opacity-80`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {job.status.replace('_', ' ')}
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-36 p-1" align="start">
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start h-8 text-xs"
                                    onClick={(e) => handleStatusChange(job, 'open', e)}
                                  >
                                    Open
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start h-8 text-xs"
                                    onClick={(e) => handleStatusChange(job, 'on_hold', e)}
                                  >
                                    On Hold
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleEditJob(job, e)}
                              className="h-7 w-7"
                              title="Edit job"
                            >
                              <Pencil className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-[hsl(var(--accent-pink))]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                              className="h-7 w-7"
                              title={job.visibility === 'public' ? 'Make private' : 'Make public'}
                            >
                              {job.visibility === 'public' ? (
                                <Eye className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-[hsl(var(--accent-mint))]" />
                              ) : (
                                <EyeOff className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                           <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                             <span>{jobApplications.length} applications</span>
                             <span className="hidden sm:inline">•</span>
                             <span>Posted {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
                           </div>
                           <div className="flex items-center gap-1.5 shrink-0">
                             {jobEditCounts[job.id] > 0 && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={(e) => handleViewEditHistory(job, e)}
                                 className="hidden sm:flex h-7 text-[10px] sm:text-xs px-2 gap-1"
                                 title="View edit history"
                               >
                                 <Clock className="h-3 w-3" />
                                 <span>Last edited ({jobEditCounts[job.id]})</span>
                               </Button>
                             )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => handleRejectAll(job.id, e)}
                              className="hidden sm:flex h-7 text-[10px] sm:text-xs px-2 gap-1"
                              title="Reject all pending applications"
                            >
                              <X className="h-3 w-3" />
                              <span>Reject All</span>
                            </Button>
                            <div className="relative hidden sm:block">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/headhunters');
                                }}
                                className="h-7 text-[10px] sm:text-xs px-2 gap-1"
                                title="Invite headhunters to this job"
                              >
                                <Users className="h-3 w-3" />
                                <span>Invite to Job</span>
                              </Button>
                              <Badge className="absolute -top-1 -right-1 bg-[hsl(var(--accent-pink))] text-white text-[8px] sm:text-[10px] h-3.5 sm:h-4 px-1">
                                New
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                      })}
                      
                      {hasMore && (
                        <div className="flex justify-center mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/my-jobs')}
                            className="w-full max-w-xs"
                          >
                            See All Jobs
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>}
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <>
      {renderVariant1()}

      <PostJobModal open={postJobModalOpen} onOpenChange={setPostJobModalOpen} userId={user?.id || ''} />
      {selectedJob && (
        <>
          <EditJobModal 
            open={editJobModalOpen} 
            onOpenChange={setEditJobModalOpen} 
            job={selectedJob}
            onSuccess={fetchDashboardData}
          />
          <JobEditHistory
            open={editHistoryModalOpen}
            onOpenChange={setEditHistoryModalOpen}
            history={editHistory}
            jobTitle={selectedJob.title}
          />
        </>
      )}
      <OnHoldReasonModal
        open={onHoldModalOpen}
        onOpenChange={setOnHoldModalOpen}
        onConfirm={handleOnHoldConfirm}
      />
    </>
  );
};
export default EmployerDashboard;