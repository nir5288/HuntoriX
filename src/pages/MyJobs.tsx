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
      on_hold: 'bg-[hsl(var(--warning))]',
      pending_review: 'bg-[hsl(var(--warning))]'
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
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">My Jobs</h1>
                <p className="text-base text-muted-foreground">Manage all your job postings</p>
              </div>
              <Button 
                size="default" 
                onClick={() => setPostJobModalOpen(true)} 
                className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950 h-10"
              >
                <Plus className="mr-2 h-5 w-5" />
                Post Job
              </Button>
            </div>

            <Card>
              <CardHeader className="px-6 py-5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">All Jobs</CardTitle>
                    <CardDescription className="mt-1.5 text-base">{jobs.length} total postings</CardDescription>
                  </div>
                  
                  {/* Modern Filters */}
                  <div className="hidden lg:flex items-center gap-3">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg border bg-background">
                      <Label htmlFor="sort-jobs" className="text-sm text-muted-foreground">Sort by</Label>
                      <Select value={sortBy} onValueChange={(value: 'latest' | 'oldest') => setSortBy(value)}>
                        <SelectTrigger id="sort-jobs" className="h-9 w-[120px] border-0 shadow-none focus:ring-0 text-sm">
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
                      size="default"
                      onClick={() => setShowPendingOnly(!showPendingOnly)}
                      className={`h-9 ${showPendingOnly ? "bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90" : ""}`}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Pending
                    </Button>
                    <Button
                      variant={showPrivateOnly ? "default" : "ghost"}
                      size="default"
                      onClick={() => setShowPrivateOnly(!showPrivateOnly)}
                      className="h-9"
                    >
                      <EyeOff className="mr-2 h-4 w-4" />
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
              <CardContent className="px-6 pb-6 pt-5">
                {jobs.length === 0 ? (
                  <div className="text-center py-10">
                    <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
                    <p className="text-base text-muted-foreground mb-4">Post your first job to get started</p>
                    <Button size="default" variant="hero" onClick={() => setPostJobModalOpen(true)}>
                      <Plus className="mr-2 h-5 w-5" />
                      Post a Job
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                            <div className="text-center py-8 text-base text-muted-foreground">
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
                            className={`group hover:border-primary/30 hover:bg-accent/5 transition-all cursor-pointer border ${
                              job.is_exclusive ? 'exclusive-job-card' : ''
                            }`}
                            onClick={() => navigate(`/jobs/${job.id}`, { state: { from: 'dashboard' } })}
                          >
                            <CardHeader className="px-6 py-5">
                              {/* Mobile layout - enhanced */}
                              <div className="flex flex-col gap-3 sm:hidden">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="text-lg font-semibold leading-tight">{job.title}</CardTitle>
                                  {job.job_id_number && (
                                    <Badge variant="outline" className="text-sm h-7 px-3 shrink-0">
                                      #{job.job_id_number}
                                    </Badge>
                                  )}
                                </div>
                                
                                <CardDescription className="text-base leading-relaxed">
                                  {job.location} • {job.employment_type?.replace('_', ' ')}
                                </CardDescription>
                                
                                 <div className="flex flex-wrap gap-2">
                                  {job.is_exclusive && (
                                    <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-sm h-7 px-3">
                                      HuntoriX Exclusive
                                    </Badge>
                                  )}
                                  {pendingCount > 0 && (
                                    <Badge className="bg-[hsl(var(--warning))] text-white text-sm h-7 px-3">
                                      {pendingCount} Pending
                                    </Badge>
                                  )}
                                  {job.status === 'pending_review' ? (
                                    <div className="flex flex-col gap-1">
                                      <Badge className={`text-sm h-7 px-3 ${getStatusColor(job.status)} flex items-center gap-1.5`}>
                                        <Clock className="h-3.5 w-3.5" />
                                        Pending Review
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">Review may take up to 1 hour</span>
                                    </div>
                                  ) : (
                                    <Badge className={`text-sm h-7 px-3 ${getStatusColor(job.status)}`}>
                                      {job.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                                
                                <div className="flex flex-col gap-2 pt-2 border-t">
                                  <Button
                                    variant="outline"
                                    size="default"
                                    onClick={(e) => handleEditJob(job, e)}
                                    className="w-full h-10 text-sm justify-start"
                                  >
                                    <Pencil className="h-4 w-4 mr-2 text-[hsl(var(--accent-pink))]" />
                                    Edit Job
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="default"
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
                                    size="default"
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
                                      size="default"
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
                              <div className="hidden sm:flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                                    {job.job_id_number && (
                                      <Badge variant="outline" className="text-sm h-7 px-3 shrink-0">
                                        #{job.job_id_number}
                                      </Badge>
                                    )}
                                    {job.is_exclusive && (
                                      <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 font-semibold text-sm h-7 px-3">
                                        HuntoriX Exclusive
                                      </Badge>
                                    )}
                                    {pendingCount > 0 && (
                                      <Badge className="bg-[hsl(var(--warning))] text-white text-sm h-7 px-3">
                                        {pendingCount} Pending
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="text-base">
                                    {job.location} • {job.employment_type?.replace('_', ' ')}
                                  </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                  {job.status === 'pending_review' ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge className={`text-sm h-7 px-3 ${getStatusColor(job.status)} flex items-center gap-1.5`}>
                                        <Clock className="h-3.5 w-3.5" />
                                        Pending Review
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">Review may take up to 1 hour</span>
                                    </div>
                                  ) : (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="default"
                                          className={`h-9 px-4 gap-2 ${getStatusColor(job.status)} border-0 hover:opacity-80`}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {job.status.replace('_', ' ')}
                                          <ChevronDown className="h-4 w-4" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-40 p-2" align="start">
                                        <div className="flex flex-col gap-1">
                                          <Button
                                            variant="ghost"
                                            size="default"
                                            className="justify-start h-9 w-full"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Handle status change to open
                                            }}
                                          >
                                            Open
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="default"
                                            className="justify-start h-9 w-full"
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
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleEditJob(job, e)}
                                    className="h-9 w-9 hover:bg-accent/50"
                                    title="Edit job"
                                  >
                                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                                    className="h-9 w-9 hover:bg-accent/50"
                                    title={job.visibility === 'public' ? 'Make private' : 'Make public'}
                                  >
                                    {job.visibility === 'public' ? (
                                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                    ) : (
                                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="px-6 pb-5 pt-0">
                              <div className="border-t border-border/30 pt-4"></div>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                                  <span>{jobApplications.length} Applications</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>Posted {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
                                  {jobEditCounts[job.id] > 0 && (
                                    <>
                                      <span className="hidden sm:inline">•</span>
                                      <button
                                        onClick={(e) => handleViewEditHistory(job, e)}
                                        className="hidden sm:inline text-base text-muted-foreground underline hover:text-foreground transition-colors cursor-pointer"
                                      >
                                        Last edited ({jobEditCounts[job.id]} {jobEditCounts[job.id] === 1 ? 'edit' : 'edits'})
                                      </button>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="default"
                                    onClick={(e) => handleRejectAll(job.id, e)}
                                    className="hidden sm:flex h-9 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    title="Reject all pending applications"
                                  >
                                    <X className="h-4 w-4" />
                                    <span>Reject All</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="default"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/headhunters');
                                    }}
                                    className="hidden sm:flex h-9 gap-2 hover:bg-accent/50 relative"
                                    title="Invite headhunters to this job"
                                  >
                                    <Users className="h-4 w-4" />
                                    <span>Invite to Job</span>
                                    <Badge className="absolute -top-1 -right-1 h-5 px-1.5 text-[10px] bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] text-slate-950 border-0">
                                      new
                                    </Badge>
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
