import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, Eye, EyeOff, Pencil, Check, X, Clock, ChevronDown, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PostJobModal } from '@/components/PostJobModal';
import { EditJobModal } from '@/components/EditJobModal';
import { JobEditHistory } from '@/components/JobEditHistory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

const MyJobs = () => {
  const { user, profile, loading } = useRequireAuth('employer');
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [postJobModalOpen, setPostJobModalOpen] = useState(false);
  const [editJobModalOpen, setEditJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [editHistoryModalOpen, setEditHistoryModalOpen] = useState(false);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>(() => {
    return (localStorage.getItem('my_jobs_sort_by') as 'latest' | 'oldest') || 'latest';
  });
  const [showPendingOnly, setShowPendingOnly] = useState(() => {
    return localStorage.getItem('my_jobs_show_pending') === 'true';
  });
  const [showPrivateOnly, setShowPrivateOnly] = useState(() => {
    return localStorage.getItem('my_jobs_show_private') === 'true';
  });
  const [jobEditCounts, setJobEditCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user && !loading) {
      fetchJobsData();
    }
  }, [user, loading]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('my_jobs_sort_by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('my_jobs_show_pending', showPendingOnly.toString());
  }, [showPendingOnly]);

  useEffect(() => {
    localStorage.setItem('my_jobs_show_private', showPrivateOnly.toString());
  }, [showPrivateOnly]);

  const fetchJobsData = async () => {
    try {
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

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
        const { data: appsData, error: appsError } = await supabase
          .from('applications')
          .select('*, headhunter:profiles!applications_headhunter_id_fkey(*)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;
        setApplications(appsData || []);
      }
    } catch (error) {
      console.error('Error fetching jobs data:', error);
      toast.error('Failed to load jobs data');
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

  const toggleVisibility = async (jobId: string, currentVisibility: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ visibility: newVisibility })
        .eq('id', jobId);
      
      if (error) throw error;
      
      toast.success(`Job is now ${newVisibility}`);
      fetchJobsData();
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
      fetchJobsData();
    } catch (error) {
      console.error('Error rejecting applications:', error);
      toast.error('Failed to reject applications');
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
      <div className="w-full px-4 sm:px-6 pb-4 sm:pb-6 -mt-6 sm:-mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-0.5">My Jobs</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage all your job postings</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => setPostJobModalOpen(true)} 
                className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950 h-8 text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Post Job
              </Button>
            </div>

            <Card>
              <CardHeader className="px-4 sm:px-5 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-semibold">All Jobs</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">{jobs.length} total postings</CardDescription>
                  </div>
                  
                  {/* Modern Filters */}
                  <div className="hidden lg:flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-background">
                      <Label htmlFor="sort-jobs" className="text-[10px] text-muted-foreground">Sort by</Label>
                      <Select value={sortBy} onValueChange={(value: 'latest' | 'oldest') => setSortBy(value)}>
                        <SelectTrigger id="sort-jobs" className="h-6 w-[100px] border-0 shadow-none focus:ring-0 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="latest">Latest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      variant={showPendingOnly ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowPendingOnly(!showPendingOnly)}
                      className={`h-6 text-[10px] px-2 ${showPendingOnly ? "bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90" : ""}`}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Button>
                    <Button
                      variant={showPrivateOnly ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowPrivateOnly(!showPrivateOnly)}
                      className="h-6 text-[10px] px-2"
                    >
                      <EyeOff className="mr-1 h-3 w-3" />
                      Private
                    </Button>
                  </div>
                </div>
                
                {/* Mobile Filters */}
                <div className="flex lg:hidden flex-col gap-2 pt-3 border-t mt-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sort-jobs-mobile" className="text-xs font-medium">Sort:</Label>
                    <Select value={sortBy} onValueChange={(value: 'latest' | 'oldest') => setSortBy(value)}>
                      <SelectTrigger id="sort-jobs-mobile" className="h-9 flex-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Latest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={showPendingOnly ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowPendingOnly(!showPendingOnly)}
                      className="flex-1 h-8 text-xs"
                    >
                      Pending Review
                    </Button>
                    <Button
                      variant={showPrivateOnly ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowPrivateOnly(!showPrivateOnly)}
                      className="flex-1 h-8 text-xs"
                    >
                      Private Only
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-3">
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-sm font-semibold mb-1">No jobs yet</h3>
                    <p className="text-xs text-muted-foreground mb-3">Post your first job to get started</p>
                    <Button size="sm" variant="hero" onClick={() => setPostJobModalOpen(true)} className="h-8 text-xs">
                      <Plus className="mr-1.5 h-3 w-3" />
                      Post a Job
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
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
                      
                      if (filteredJobs.length === 0) {
                        return (
                          <div className="text-center py-6 text-sm text-muted-foreground">
                            No jobs match your filters
                          </div>
                        );
                      }
                      
                      return filteredJobs.map(job => {
                        const jobApplications = applications.filter(a => a.job_id === job.id);
                        const pendingCount = jobApplications.filter(a => a.status === 'submitted').length;
                        
                        return (
                          <Card 
                            key={job.id} 
                            className={`group hover:border-primary/20 transition-all cursor-pointer border ${
                              job.is_exclusive ? 'exclusive-job-card' : ''
                            }`}
                            onClick={() => navigate(`/jobs/${job.id}`, { state: { from: 'dashboard' } })}
                          >
                            <CardHeader className="px-4 sm:px-5 py-3 sm:py-4">
                              {/* Mobile layout - enhanced */}
                              <div className="flex flex-col gap-3 sm:hidden">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-base font-semibold leading-tight">{job.title}</CardTitle>
                                    {job.job_id_number && (
                                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
                                        #{job.job_id_number}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <CardDescription className="text-xs leading-relaxed">
                                    {job.location} • {job.employment_type?.replace('_', ' ')}
                                  </CardDescription>
                                  
                                  <div className="flex flex-wrap gap-1.5">
                                    {job.is_exclusive && (
                                      <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-[10px] h-5 px-2">
                                        HuntoriX Exclusive
                                      </Badge>
                                    )}
                                    {pendingCount > 0 && (
                                      <Badge className="bg-[hsl(var(--warning))] text-white text-[10px] h-5 px-2">
                                        {pendingCount} Pending
                                      </Badge>
                                    )}
                                    <Badge className={`text-[10px] h-5 px-2 ${getStatusColor(job.status)}`}>
                                      {job.status}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-1.5 pt-2 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => handleEditJob(job, e)}
                                    className="w-full h-8 text-xs justify-start"
                                  >
                                    <Pencil className="h-3 w-3 mr-2 text-[hsl(var(--accent-pink))]" />
                                    Edit Job
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                                    className="w-full h-8 text-xs justify-start"
                                  >
                                    {job.visibility === 'public' ? (
                                      <>
                                        <Eye className="h-3 w-3 mr-2 text-[hsl(var(--accent-mint))]" />
                                        Make Private
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="h-3 w-3 mr-2 text-muted-foreground" />
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
                                    className="w-full h-8 text-xs justify-start"
                                  >
                                    <Users className="h-3 w-3 mr-2" />
                                    Invite to Job
                                  </Button>
                                  {jobEditCounts[job.id] > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => handleViewEditHistory(job, e)}
                                      className="w-full h-8 text-xs justify-start"
                                    >
                                      <Clock className="h-3 w-3 mr-2" />
                                      Last Edited ({jobEditCounts[job.id]} {jobEditCounts[job.id] === 1 ? 'edit' : 'edits'})
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Tablet & Desktop layout - side by side */}
                              <div className="hidden sm:flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <CardTitle className="text-sm font-semibold">{job.title}</CardTitle>
                                    {job.job_id_number && (
                                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
                                        #{job.job_id_number}
                                      </Badge>
                                    )}
                                    {job.is_exclusive && (
                                      <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-[10px] h-5 px-2">
                                        HuntoriX Exclusive
                                      </Badge>
                                    )}
                                    {pendingCount > 0 && (
                                      <Badge className="bg-[hsl(var(--warning))] text-white text-[10px] h-5 px-2">
                                        {pendingCount} Pending
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="text-xs">
                                    {job.location} • {job.employment_type?.replace('_', ' ')}
                                  </CardDescription>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-6 text-[10px] px-2 gap-0.5 ${getStatusColor(job.status)} border-0 hover:opacity-80`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {job.status.replace('_', ' ')}
                                        <ChevronDown className="h-2.5 w-2.5" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-32 p-1" align="start">
                                      <div className="flex flex-col gap-0.5">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="justify-start h-7 text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle status change to open
                                          }}
                                        >
                                          Open
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="justify-start h-7 text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle status change to on_hold
                                          }}
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
                                    className="h-6 w-6 hover:bg-accent"
                                    title="Edit job"
                                  >
                                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                                    className="h-6 w-6 hover:bg-accent"
                                    title={job.visibility === 'public' ? 'Make private' : 'Make public'}
                                  >
                                    {job.visibility === 'public' ? (
                                      <Eye className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    ) : (
                                      <EyeOff className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-5 pb-3 sm:pb-4 pt-0">
                              <div className="border-t border-border/30 pt-2.5"></div>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                  <span>{jobApplications.length} Applications</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>Posted {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
                                  {jobEditCounts[job.id] > 0 && (
                                    <>
                                      <span className="hidden sm:inline">•</span>
                                      <button
                                        onClick={(e) => handleViewEditHistory(job, e)}
                                        className="hidden sm:inline text-xs text-muted-foreground underline hover:text-foreground transition-colors cursor-pointer"
                                      >
                                        Last edited ({jobEditCounts[job.id]} {jobEditCounts[job.id] === 1 ? 'edit' : 'edits'})
                                      </button>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleRejectAll(job.id, e)}
                                    className="hidden sm:flex h-6 text-[10px] px-2 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    title="Reject all pending applications"
                                  >
                                    <X className="h-3 w-3" />
                                    <span>Reject All</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/headhunters');
                                    }}
                                    className="hidden sm:flex h-6 text-[10px] px-2 gap-1 hover:bg-accent"
                                    title="Invite headhunters to this job"
                                  >
                                    <Users className="h-3 w-3" />
                                    <span>Invite to Job</span>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                  </div>
                )}
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
            onSuccess={fetchJobsData}
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

export default MyJobs;
