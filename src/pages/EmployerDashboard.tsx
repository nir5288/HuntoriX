import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, Users, Clock, Check, X, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PostJobModal } from '@/components/PostJobModal';
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
      // Get the application details
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      // Create engagement
      const { data: engagement, error: engagementError } = await supabase
        .from('engagements')
        .insert({
          job_id: jobId,
          application_id: applicationId,
          employer_id: user?.id,
          headhunter_id: headhunterId,
          status: 'Proposed',
          fee_model: application.proposed_fee_model || 'Percent',
          fee_amount: application.proposed_fee_value || 15,
          deposit_required: false,
          candidate_cap: 5,
          sla_days: application.eta_days || 3,
        })
        .select()
        .single();

      if (engagementError) throw engagementError;

      // Create initial kickoff milestone
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (application.eta_days || 3));
      
      await supabase.from('milestones').insert({
        engagement_id: engagement.id,
        type: 'Kickoff',
        due_at: dueDate.toISOString(),
      });

      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'shortlisted' })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Create notification for headhunter
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: headhunterId,
          type: 'engagement_created',
          related_id: engagement.id,
          payload: { job_id: jobId, engagement_id: engagement.id },
          is_read: false,
          title: 'Engagement Started',
          message: 'An employer has accepted your application and started an engagement'
        } as any);

      if (notifError) console.error('Notification error:', notifError);

      toast.success('Engagement created! Redirecting...');
      setTimeout(() => navigate(`/engagement/${engagement.id}`), 1500);
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
  if (loading || loadingData) {
    return <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
              Employer Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your job postings and applications</p>
          </div>
          <Button size="lg" onClick={() => setPostJobModalOpen(true)} className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950">
            <Plus className="mr-2 h-5 w-5" />
            Post a Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'open').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(a => a.status === 'submitted').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>My Jobs</CardTitle>
            <CardDescription>View and manage your job postings</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
                <p className="text-muted-foreground mb-4">Post your first job to get started</p>
                <Button variant="hero" onClick={() => setPostJobModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Post a Job
                </Button>
              </div> : <div className="space-y-4">
                {jobs.map(job => {
              const jobApplications = applications.filter(a => a.job_id === job.id);
              const pendingCount = jobApplications.filter(a => a.status === 'submitted').length;
              return <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{job.title}</CardTitle>
                              {pendingCount > 0 && <Badge className="bg-[hsl(var(--warning))] text-white">
                                  {pendingCount} Pending Review
                                </Badge>}
                            </div>
                            <CardDescription>
                              {job.location} • {job.employment_type?.replace('_', ' ')}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{jobApplications.length} applications</span>
                          <span>•</span>
                          <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>;
            })}
              </div>}
          </CardContent>
        </Card>
      </div>

      <PostJobModal open={postJobModalOpen} onOpenChange={setPostJobModalOpen} userId={user?.id || ''} />
    </div>;
};
export default EmployerDashboard;