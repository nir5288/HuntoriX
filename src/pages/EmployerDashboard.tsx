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
  const [uiVariant, setUiVariant] = useState<1 | 2 | 3>(1);
  
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
                        {/* Mobile layout - enhanced */}
                        <div className="flex flex-col gap-2.5 sm:hidden">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-sm font-semibold leading-tight">{job.title}</CardTitle>
                              {job.job_id_number && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0">
                                  #{job.job_id_number}
                                </Badge>
                              )}
                            </div>
                            
                            <CardDescription className="text-[11px] leading-tight">
                              {job.location} • {job.employment_type?.replace('_', ' ')}
                            </CardDescription>
                            
                            <div className="flex flex-wrap gap-1.5">
                              {job.is_exclusive && (
                                <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-[9px] h-4 px-1.5">
                                  HuntoriX Exclusive
                                </Badge>
                              )}
                              {pendingCount > 0 && (
                                <Badge className="bg-[hsl(var(--warning))] text-white text-[9px] h-4 px-1.5">
                                  {pendingCount} Pending
                                </Badge>
                              )}
                              <Badge className={`text-[9px] h-4 px-1.5 ${getStatusColor(job.status)}`}>
                                {job.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-end gap-1 pt-1.5 border-t">
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/headhunters');
                                }}
                                className="h-8 w-8 p-0"
                                title="Invite headhunters"
                              >
                                <Users className="h-3.5 w-3.5" />
                              </Button>
                              <Badge className="absolute -top-0.5 -right-0.5 bg-[hsl(var(--accent-pink))] text-white text-[7px] h-2.5 w-2.5 p-0 flex items-center justify-center rounded-full">
                                
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleEditJob(job, e)}
                              className="h-8 w-8"
                              title="Edit job"
                            >
                              <Pencil className="h-3.5 w-3.5 text-[hsl(var(--accent-pink))]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                              className="h-8 w-8"
                              title={job.visibility === 'public' ? 'Make private' : 'Make public'}
                            >
                              {job.visibility === 'public' ? (
                                <Eye className="h-3.5 w-3.5 text-[hsl(var(--accent-mint))]" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
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
                        <div className="flex items-center justify-between gap-3">
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
                          <div className="relative shrink-0">
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

  const renderVariant2 = () => (
    <>
      {/* Variant 2: Kanban-Style Board */}
      <div className="w-full px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold mb-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Job Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Track your jobs through their lifecycle</p>
          </div>
          <Button size="sm" onClick={() => setPostJobModalOpen(true)} className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90">
            <Plus className="mr-1.5 h-4 w-4" />
            New Position
          </Button>
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Active Jobs Column */}
          <Card className="border-t-4 border-t-[hsl(var(--accent-mint))]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--accent-mint))] animate-pulse"></div>
                  Active
                </CardTitle>
                <Badge variant="secondary">{jobs.filter(j => j.status === 'open').length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {jobs.filter(j => j.status === 'open').map(job => (
                <Card 
                  key={job.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-2 border-l-[hsl(var(--accent-mint))]"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm mb-1">{job.title}</p>
                    <p className="text-xs text-muted-foreground mb-2">{job.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {applications.filter(a => a.job_id === job.id).length} apps
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => handleEditJob(job, e)}
                        className="h-6 px-2"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Pending Review Column */}
          <Card className="border-t-4 border-t-[hsl(var(--warning))]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[hsl(var(--warning))]" />
                  Review
                </CardTitle>
                <Badge variant="secondary">{applications.filter(a => a.status === 'submitted').length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {applications.filter(a => a.status === 'submitted').map(app => {
                const job = jobs.find(j => j.id === app.job_id);
                return (
                  <Card 
                    key={app.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-2 border-l-[hsl(var(--warning))]"
                  >
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm mb-1">{app.headhunter?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground mb-2">{job?.title}</p>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAccept(app.id, app.headhunter_id, app.job_id)}
                          className="h-6 px-2 text-xs flex-1"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDecline(app.id, app.headhunter_id, app.job_id)}
                          className="h-6 px-2 text-xs flex-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          {/* Shortlisted Column */}
          <Card className="border-t-4 border-t-[hsl(var(--accent-lilac))]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-[hsl(var(--accent-lilac))]" />
                  Shortlisted
                </CardTitle>
                <Badge variant="secondary">{applications.filter(a => a.status === 'shortlisted').length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {applications.filter(a => a.status === 'shortlisted').map(app => {
                const job = jobs.find(j => j.id === app.job_id);
                return (
                  <Card 
                    key={app.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-2 border-l-[hsl(var(--accent-lilac))]"
                  >
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm mb-1">{app.headhunter?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground mb-2">{job?.title}</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleChat(app.job_id, app.headhunter_id)}
                        className="h-6 px-2 text-xs w-full"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => navigate('/saved-headhunters')}>
                  <Star className="h-3.5 w-3.5 mr-1.5" />
                  Saved Headhunters ({savedHeadhuntersCount})
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/saved-jobs')}>
                  <Heart className="h-3.5 w-3.5 mr-1.5" />
                  Saved Jobs ({savedJobsCount})
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/my-jobs')}>
                View All Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderVariant3 = () => (
    <>
      {/* Variant 3: Analytics Dashboard */}
      <div className="w-full px-4 sm:px-6 py-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold mb-1 text-white font-mono">
              {'>'} COMMAND CENTER
            </h1>
            <p className="text-xs sm:text-sm text-emerald-400 font-mono">System operational • All systems green</p>
          </div>
          <Button 
            size="sm" 
            onClick={() => setPostJobModalOpen(true)} 
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-black font-semibold border border-emerald-400"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            DEPLOY NEW JOB
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="bg-slate-800/50 border-emerald-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-400 font-mono uppercase">Active</span>
                <Briefcase className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                {jobs.filter(j => j.status === 'open').length}
              </div>
              <div className="h-1 w-full bg-slate-700 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${(jobs.filter(j => j.status === 'open').length / Math.max(jobs.length, 1)) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-amber-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-400 font-mono uppercase">Pending</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                {applications.filter(a => a.status === 'submitted').length}
              </div>
              <div className="h-1 w-full bg-slate-700 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-purple-400 font-mono uppercase">Hunters</span>
                <Star className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white font-mono">{savedHeadhuntersCount}</div>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => navigate('/saved-headhunters')}
                className="text-purple-400 hover:text-purple-300 p-0 h-auto mt-1 font-mono text-xs"
              >
                ACCESS {'->'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-cyan-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-cyan-400 font-mono uppercase">Saved</span>
                <Heart className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-white font-mono">{savedJobsCount}</div>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => navigate('/saved-jobs')}
                className="text-cyan-400 hover:text-cyan-300 p-0 h-auto mt-1 font-mono text-xs"
              >
                ACCESS {'->'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Terminal View */}
        <Card className="bg-slate-900/80 border-emerald-500/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-emerald-500/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-mono text-emerald-400">
                {'>'} JOB_LISTINGS.log
              </CardTitle>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: 'latest' | 'oldest') => setSortBy(value)}>
                  <SelectTrigger className="h-7 w-[100px] text-xs bg-slate-800 border-emerald-500/30 text-white font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-emerald-500/30">
                    <SelectItem value="latest" className="text-white">LATEST</SelectItem>
                    <SelectItem value="oldest" className="text-white">OLDEST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-emerald-400 font-mono text-sm mb-4">
                  {'>'} NO_JOBS_FOUND
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setPostJobModalOpen(true)}
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                >
                  INITIALIZE_JOB
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  let filteredJobs = [...jobs];
                  if (showPendingOnly) {
                    filteredJobs = filteredJobs.filter(job => {
                      const jobApplications = applications.filter(a => a.job_id === job.id);
                      return jobApplications.some(a => a.status === 'submitted');
                    });
                  }
                  if (showPrivateOnly) {
                    filteredJobs = filteredJobs.filter(job => job.visibility === 'private');
                  }
                  filteredJobs.sort((a, b) => {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
                  });

                  const visibleJobs = filteredJobs.slice(0, visibleJobCount);
                  const hasMore = filteredJobs.length > visibleJobCount;

                  return (
                    <>
                      {visibleJobs.map((job, index) => {
                        const jobApplications = applications.filter(a => a.job_id === job.id);
                        const pendingCount = jobApplications.filter(a => a.status === 'submitted').length;
                        
                        return (
                          <Card 
                            key={job.id}
                            className="bg-slate-800/50 border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer backdrop-blur-sm group"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-emerald-500 font-mono text-xs">
                                      [{String(index + 1).padStart(2, '0')}]
                                    </span>
                                    <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                      {job.title}
                                    </h3>
                                    {job.is_exclusive && (
                                      <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xs">
                                        EXCLUSIVE
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-3 text-xs font-mono">
                                    <span className="text-slate-400">
                                      LOC: <span className="text-cyan-400">{job.location}</span>
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-400">
                                      TYPE: <span className="text-cyan-400">{job.employment_type?.replace('_', ' ')}</span>
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-400">
                                      APPS: <span className="text-emerald-400">{jobApplications.length}</span>
                                    </span>
                                    {pendingCount > 0 && (
                                      <>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-amber-400 animate-pulse">
                                          PENDING: {pendingCount}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => handleEditJob(job, e)}
                                    className="h-8 px-3 bg-slate-700/50 border-emerald-500/30 text-emerald-400 hover:bg-slate-700 hover:border-emerald-500"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                                    className="h-8 px-3 bg-slate-700/50 border-cyan-500/30 text-cyan-400 hover:bg-slate-700 hover:border-cyan-500"
                                  >
                                    {job.visibility === 'public' ? (
                                      <Eye className="h-3.5 w-3.5" />
                                    ) : (
                                      <EyeOff className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/headhunters');
                                    }}
                                    className="h-8 px-3 bg-slate-700/50 border-purple-500/30 text-purple-400 hover:bg-slate-700 hover:border-purple-500"
                                  >
                                    <Users className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {hasMore && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/my-jobs')}
                          className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-mono"
                        >
                          LOAD_MORE_JOBS {'->'}
                        </Button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <>
      {/* UI Variant Switcher */}
      <div className="fixed top-20 right-6 z-50 flex gap-2 p-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg">
        <Button
          size="sm"
          variant={uiVariant === 1 ? "default" : "outline"}
          onClick={() => setUiVariant(1)}
          className="w-10 h-10 p-0 font-bold"
        >
          1
        </Button>
        <Button
          size="sm"
          variant={uiVariant === 2 ? "default" : "outline"}
          onClick={() => setUiVariant(2)}
          className="w-10 h-10 p-0 font-bold"
        >
          2
        </Button>
        <Button
          size="sm"
          variant={uiVariant === 3 ? "default" : "outline"}
          onClick={() => setUiVariant(3)}
          className="w-10 h-10 p-0 font-bold"
        >
          3
        </Button>
      </div>

      {/* Render Selected Variant */}
      {uiVariant === 1 && renderVariant1()}
      {uiVariant === 2 && renderVariant2()}
      {uiVariant === 3 && renderVariant3()}

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