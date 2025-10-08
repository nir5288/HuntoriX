import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, Eye, EyeOff, Pencil, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PostJobModal } from '@/components/PostJobModal';
import { EditJobModal } from '@/components/EditJobModal';
import { JobEditHistory } from '@/components/JobEditHistory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

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
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [jobEditCounts, setJobEditCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user && !loading) {
      fetchJobsData();
    }
  }, [user, loading]);

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
                  My Jobs
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">View and manage all your job postings</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => setPostJobModalOpen(true)} 
                className="w-full sm:w-auto bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Post Job
              </Button>
            </div>

            <Card>
              <CardHeader className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg">All Jobs</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs">{jobs.length} total job postings</CardDescription>
                  </div>
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
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-base font-semibold mb-1.5">No jobs yet</h3>
                    <p className="text-sm text-muted-foreground mb-3">Post your first job to get started</p>
                    <Button size="sm" variant="hero" onClick={() => setPostJobModalOpen(true)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Post a Job
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
                            className={`group hover:shadow-md transition-shadow cursor-pointer ${
                              job.is_exclusive ? 'exclusive-job-card' : ''
                            }`}
                            onClick={() => navigate(`/jobs/${job.id}`, { state: { from: 'dashboard' } })}
                          >
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
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => handleEditJob(job, e)}
                                    className="h-8 w-8 border-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))] hover:text-white"
                                    title="Edit job"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-[hsl(var(--accent-pink))]" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                                    className={`h-8 w-8 ${
                                      job.visibility === 'public' 
                                        ? 'border-[hsl(var(--accent-mint))] hover:bg-[hsl(var(--accent-mint))] hover:text-white' 
                                        : 'border-muted-foreground hover:bg-muted'
                                    }`}
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
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => handleEditJob(job, e)}
                                    className="h-7 w-7 border-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))] hover:text-white"
                                    title="Edit job"
                                  >
                                    <Pencil className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-[hsl(var(--accent-pink))]" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => toggleVisibility(job.id, job.visibility, e)}
                                    className={`h-7 w-7 ${
                                      job.visibility === 'public' 
                                        ? 'border-[hsl(var(--accent-mint))] hover:bg-[hsl(var(--accent-mint))] hover:text-white' 
                                        : 'border-muted-foreground hover:bg-muted'
                                    }`}
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
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                                  <span>{jobApplications.length} applications</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>Posted {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
                                  {jobEditCounts[job.id] > 0 && (
                                    <>
                                      <span className="hidden sm:inline">•</span>
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
