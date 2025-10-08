import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, Users, Clock, Check, X, MessageCircle, Eye, EyeOff, Heart, Star, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PostJobModal } from '@/components/PostJobModal';
import { EditJobModal } from '@/components/EditJobModal';
import { JobEditHistory } from '@/components/JobEditHistory';
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
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [jobEditCounts, setJobEditCounts] = useState<Record<string, number>>({});
  const [visibleJobCount, setVisibleJobCount] = useState(3);
  
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
      open: 'bg-[hsl(var(--accent-mint))]',
      shortlisted: 'bg-[hsl(var(--accent-lilac))]',
      awarded: 'bg-[hsl(var(--success))]',
      closed: 'bg-gray-400',
      on_hold: 'bg-[hsl(var(--warning))]'
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
  if (loading || loadingData) {
    return (
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
    );
  }
  return (
    <>
      <div className="w-full px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold mb-1 bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
              Employer Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage your job postings and applications</p>
          </div>
          <Button size="sm" onClick={() => setPostJobModalOpen(true)} className="w-full sm:w-auto bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950">
            <Plus className="mr-1.5 h-4 w-4" />
            Post Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl font-bold">{jobs.filter(j => j.status === 'open').length}</div>
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium">Pending Review</CardTitle>
              <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl font-bold">
                {applications.filter(a => a.status === 'submitted').length}
              </div>
              {applications.filter(a => a.status === 'submitted').length > 0 && (
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">
                  Click to {showPendingOnly ? 'show all' : 'filter'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card onClick={() => navigate('/saved-headhunters')} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium">Saved Headhunters</CardTitle>
              <Star className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl font-bold">{savedHeadhuntersCount}</div>
            </CardContent>
          </Card>

          <Card onClick={() => navigate('/saved-jobs')} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium">Saved Jobs</CardTitle>
              <Heart className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-2 sm:pb-3">
              <div className="text-lg sm:text-xl font-bold">{savedJobsCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <Card>
          <CardHeader className="px-4 py-4">
            <div>
              <CardTitle className="text-base sm:text-lg">My Jobs</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">View and manage your job postings</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 pt-3 border-t mt-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="sort-jobs" className="text-[10px] sm:text-xs font-medium shrink-0">Sort:</Label>
                <Select value={sortBy} onValueChange={(value: 'latest' | 'oldest') => setSortBy(value)}>
                  <SelectTrigger id="sort-jobs" className="h-7 sm:h-8 w-full sm:w-[120px] text-[10px] sm:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="pending-only" 
                  checked={showPendingOnly} 
                  onCheckedChange={(checked) => setShowPendingOnly(checked as boolean)}
                  className="h-3.5 sm:h-4 w-3.5 sm:w-4"
                />
                <Label htmlFor="pending-only" className="text-[10px] sm:text-xs font-medium cursor-pointer">
                  Pending Review
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="private-only" 
                  checked={showPrivateOnly} 
                  onCheckedChange={(checked) => setShowPrivateOnly(checked as boolean)}
                  className="h-3.5 sm:h-4 w-3.5 sm:w-4"
                />
                <Label htmlFor="private-only" className="text-[10px] sm:text-xs font-medium cursor-pointer">
                  Private Only
                </Label>
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
                      <CardHeader className="px-4 py-3">
                        {/* Mobile layout - stacked */}
                        <div className="flex flex-col gap-3 sm:hidden">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-sm break-words">{job.title}</CardTitle>
                              {job.job_id_number && (
                                <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                                  #{job.job_id_number}
                                </Badge>
                              )}
                            </div>
                            {job.is_exclusive && (
                              <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-[10px] h-5 px-2 mb-2">
                                HuntoriX Exclusive
                              </Badge>
                            )}
                            {pendingCount > 0 && (
                              <Badge className="bg-[hsl(var(--warning))] text-white text-[10px] h-5 mb-2">
                                {pendingCount} Pending
                              </Badge>
                            )}
                            <CardDescription className="text-xs">
                              {job.location} • {job.employment_type?.replace('_', ' ')}
                            </CardDescription>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-2 border-t">
                            <Badge className={`text-[10px] h-5 ${getStatusColor(job.status)}`}>
                              {job.status}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              <div className="relative">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/headhunters');
                                  }}
                                  className="h-7 text-[10px] px-2 gap-1"
                                  title="Invite headhunters to this job"
                                >
                                  <Users className="h-3 w-3" />
                                </Button>
                                <Badge className="absolute -top-1 -right-1 bg-[hsl(var(--accent-pink))] text-white text-[8px] h-3.5 px-1">
                                  New
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleEditJob(job, e)}
                                className="h-7 w-7"
                                title="Edit job"
                              >
                                <Pencil className="h-3 w-3 text-[hsl(var(--accent-pink))]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                                className="h-7 w-7"
                                title={job.visibility === 'public' ? 'Make private' : 'Make public'}
                              >
                                {job.visibility === 'public' ? (
                                  <Eye className="h-3 w-3 text-[hsl(var(--accent-mint))]" />
                                ) : (
                                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Tablet & Desktop layout - side by side */}
                        <div className="hidden sm:flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <CardTitle className="text-sm sm:text-base break-words">{job.title}</CardTitle>
                              {job.job_id_number && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs h-5 shrink-0">
                                  #{job.job_id_number}
                                </Badge>
                              )}
                              {job.is_exclusive && (
                                <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-[10px] sm:text-xs h-5 px-2">
                                  HuntoriX Exclusive
                                </Badge>
                              )}
                            </div>
                            {pendingCount > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-[hsl(var(--warning))] text-white text-[10px] sm:text-xs h-5">
                                  {pendingCount} Pending
                                </Badge>
                              </div>
                            )}
                            <CardDescription className="text-xs">
                              {job.location} • {job.employment_type?.replace('_', ' ')}
                            </CardDescription>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Badge className={`text-[10px] sm:text-xs h-5 ${getStatusColor(job.status)}`}>
                              {job.status}
                            </Badge>
                            <div className="relative">
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
                                <span className="hidden sm:inline">Invite</span>
                              </Button>
                              <Badge className="absolute -top-1 -right-1 bg-[hsl(var(--accent-pink))] text-white text-[8px] sm:text-[10px] h-3.5 sm:h-4 px-1">
                                New
                              </Badge>
                            </div>
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
                      <CardContent className="px-4 pb-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{jobApplications.length} applications</span>
                          <span>•</span>
                          <span>Posted {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
                          {jobEditCounts[job.id] > 0 && (
                            <>
                              <span>•</span>
                              <span 
                                className="underline cursor-pointer hover:text-[hsl(var(--accent-pink))] transition-colors"
                                onClick={(e) => handleViewEditHistory(job, e)}
                              >
                                Last edited ({jobEditCounts[job.id]} {jobEditCounts[job.id] === 1 ? 'edit' : 'edits'})
                              </span>
                            </>
                          )}
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
    </>
  );
};
export default EmployerDashboard;