import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Check, X, MessageCircle, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApplyModal } from '@/components/ApplyModal';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  
  // Determine back destination based on navigation state
  const fromSource = location.state?.from as 'dashboard' | 'applications' | 'saved' | undefined;
  const getBackButtonText = () => {
    if (fromSource === 'dashboard') return 'Back to Dashboard';
    if (fromSource === 'applications') return 'Back to My Applications';
    if (fromSource === 'saved') return 'Back to My Saved Jobs';
    return 'Back to Opportunities';
  };

  const handleBack = () => {
    switch (fromSource) {
      case 'dashboard':
        // Navigate to the correct dashboard based on user role
        if (profile?.role === 'employer') {
          navigate('/dashboard/employer');
        } else {
          navigate('/dashboard/headhunter');
        }
        break;
      case 'applications':
        navigate('/applications');
        break;
      case 'saved':
        navigate('/saved-jobs');
        break;
      default:
        navigate('/opportunities');
    }
  };
  useEffect(() => {
    fetchJob();
    checkSaved();
  }, [id, user]);

  const checkSaved = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking saved job:', error);
      return;
    }
    
    setIsSaved(!!data);
  };

  const fetchJob = async () => {
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*, employer:profiles!jobs_created_by_fkey(*)')
        .eq('id', id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Check if user has applied
      if (user && profile?.role === 'headhunter') {
        const { data: appData } = await supabase
          .from('applications')
          .select('id, status')
          .eq('job_id', id)
          .eq('headhunter_id', user.id)
          .maybeSingle();

        setHasApplied(!!appData);
        // Store the application status for display
        if (appData) {
          setJob((prev: any) => ({ ...prev, userApplicationStatus: appData.status }));
        }

        // Check if user has a pending invitation
        const { data: inviteData } = await supabase
          .from('job_invitations')
          .select('id, status')
          .eq('job_id', id)
          .eq('headhunter_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        setHasInvitation(!!inviteData);
      }

      // If user is the employer who created this job, fetch applications
      if (user && jobData?.created_by === user.id) {
        const { data: appsData, error: appsError } = await supabase
          .from('applications')
          .select('*, headhunter:profiles!applications_headhunter_id_fkey(*)')
          .eq('job_id', id)
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;
        setApplications(appsData || []);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!user) {
      navigate('/auth?role=headhunter');
      return;
    }

    if (profile?.role !== 'headhunter') {
      toast.error('Only headhunters can apply to jobs');
      return;
    }

    setApplyModalOpen(true);
  };

  const handleApplicationSuccess = () => {
    setHasApplied(true);
    setApplyModalOpen(false);
    fetchJob();
  };

  const getApplicationStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-[hsl(var(--warning))]',
      shortlisted: 'bg-[hsl(var(--accent-lilac))]',
      rejected: 'bg-destructive',
      withdrawn: 'bg-muted',
    };
    return colors[status] || 'bg-gray-400';
  };

  const handleAccept = async (applicationId: string, headhunterId: string) => {
    try {
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
          type: 'status_change',
          payload: { job_id: id, application_id: applicationId, status: 'shortlisted' },
          is_read: false,
          title: 'Application Shortlisted',
          message: 'Your application has been shortlisted',
        } as any);

      if (notifError) console.error('Notification error:', notifError);

      toast.success('Application accepted');
      fetchJob();
    } catch (error) {
      console.error('Error accepting application:', error);
      toast.error('Failed to accept application');
    }
  };

  const handleDecline = async (applicationId: string, headhunterId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Create notification for headhunter
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: headhunterId,
          type: 'status_change',
          payload: { job_id: id, application_id: applicationId, status: 'rejected' },
          is_read: false,
          title: 'Application Rejected',
          message: 'Your application has been rejected',
        } as any);

      if (notifError) console.error('Notification error:', notifError);

      toast.success('Application declined');
      fetchJob();
    } catch (error) {
      console.error('Error declining application:', error);
      toast.error('Failed to decline application');
    }
  };

  const handleChat = (headhunterId: string) => {
    navigate(`/messages?job=${id}&with=${headhunterId}`);
  };

  const handleSaveToggle = async () => {
    if (!user) {
      toast.error('Please sign in to save jobs');
      return;
    }
    
    setSavingJob(true);
    
    try {
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', id);
        
        if (error) throw error;
        
        setIsSaved(false);
        toast.success('Job removed from your saved list');
      } else {
        // Save
        const { error } = await supabase
          .from('saved_jobs')
          .insert({
            user_id: user.id,
            job_id: id,
          });
        
        if (error) throw error;
        
        setIsSaved(true);
        toast.success('Job added to your saved list');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to save job');
    } finally {
      setSavingJob(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Job not found</p>
        </div>
      </div>
    );
  }

  const getIndustryColor = (industry: string | null) => {
    if (!industry) return 'hsl(var(--surface))';
    const colorMap: { [key: string]: string } = {
      'Software/Tech': 'hsl(var(--accent-lilac))',
      'Biotech/Healthcare': 'hsl(var(--accent-mint))',
      'Finance/Fintech': 'hsl(var(--accent-pink))',
      'Energy/Cleantech': 'hsl(var(--warning))',
      'Public/Non-profit': 'hsl(var(--surface))'
    };
    return colorMap[industry] || 'hsl(var(--surface))';
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-muted';
    const colorMap: { [key: string]: string } = {
      'open': 'bg-[hsl(var(--success))]',
      'shortlisted': 'bg-[hsl(var(--accent-lilac))]',
      'awarded': 'bg-[hsl(var(--accent-pink))]',
      'closed': 'bg-muted'
    };
    return colorMap[status] || 'bg-muted';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {getBackButtonText()}
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <CardTitle className="text-3xl">{job.title}</CardTitle>
                      {job.job_id_number && (
                        <Badge variant="outline" className="text-sm">
                          #{job.job_id_number}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {job.industry && (
                        <Badge 
                          style={{ backgroundColor: getIndustryColor(job.industry) }}
                          className="text-foreground border-0"
                        >
                          {job.industry}
                        </Badge>
                      )}
                      {job.status && (
                        <Badge className={`${getStatusColor(job.status)} text-white border-0`}>
                          {job.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={handleSaveToggle}
                          disabled={savingJob}
                        >
                          <Heart
                            className={`h-5 w-5 transition-colors ${
                              isSaved ? 'fill-[hsl(var(--accent-pink))] text-[hsl(var(--accent-pink))]' : ''
                            }`}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isSaved ? 'Remove from saved' : 'Save job'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {job.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.employment_type && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="capitalize">{job.employment_type === 'full_time' ? 'Full-time' : job.employment_type}</span>
                      {job.seniority && <span> • {job.seniority.charAt(0).toUpperCase() + job.seniority.slice(1)}</span>}
                    </div>
                  )}
                  {(job.budget_min || job.budget_max) && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {job.budget_currency} {job.budget_min?.toLocaleString()}
                        {job.budget_max && ` - ${job.budget_max.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Role Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
                </div>

                {job.skills_must && job.skills_must.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Must-Have Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_must.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-sm">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {job.skills_nice && job.skills_nice.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Nice-to-Have Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_nice.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-sm">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Company Profile Card */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>About the Company</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{job.employer?.company_name || job.employer?.name || 'Company'}</p>
                  {job.employer?.company_sector && (
                    <p className="text-sm text-muted-foreground">{job.employer.company_sector}</p>
                  )}
                </div>
                
                {job.employer?.bio && (
                  <p className="text-sm text-muted-foreground">{job.employer.bio}</p>
                )}

                {job.employer?.company_size && (
                  <div>
                    <p className="text-xs text-muted-foreground">Company Size</p>
                    <p className="text-sm font-medium">{job.employer.company_size}</p>
                  </div>
                )}

                {job.employer?.company_hq && (
                  <div>
                    <p className="text-xs text-muted-foreground">Headquarters</p>
                    <p className="text-sm font-medium">{job.employer.company_hq}</p>
                  </div>
                )}

                {job.employer?.website && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(job.employer.website, '_blank')}
                  >
                    Visit Website
                  </Button>
                )}
              </CardContent>
            </Card>

            {profile?.role === 'headhunter' && (
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  {hasApplied ? (
                    <div className="text-center space-y-2">
                      <Badge className={
                        job?.userApplicationStatus === 'rejected' 
                          ? 'bg-[hsl(var(--destructive))] text-white' 
                          : job?.userApplicationStatus === 'selected'
                          ? 'bg-[hsl(var(--success))] text-white'
                          : job?.userApplicationStatus === 'shortlisted'
                          ? 'bg-[hsl(var(--accent-lilac))] text-white'
                          : 'bg-[hsl(var(--success))] text-white'
                      }>
                        {job?.userApplicationStatus === 'rejected' 
                          ? 'Rejected' 
                          : job?.userApplicationStatus === 'selected'
                          ? 'Selected'
                          : job?.userApplicationStatus === 'shortlisted'
                          ? 'Shortlisted'
                          : 'Applied'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {job?.userApplicationStatus === 'rejected' 
                          ? 'Your application was not successful for this position' 
                          : 'You have already applied to this job'}
                      </p>
                    </div>
                  ) : hasInvitation ? (
                    <Button 
                      variant="hero" 
                      size="lg" 
                      className="w-full" 
                      onClick={() => navigate(`/job-review/${id}`, { state: { from: fromSource || 'dashboard' } })}
                    >
                      Review Invitation
                    </Button>
                  ) : (
                    <Button variant="hero" size="lg" className="w-full" onClick={handleApply}>
                      Apply Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Applications Section - Only visible to job creator */}
        {user && job?.created_by === user.id && applications.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Applications ({applications.length})</CardTitle>
              <CardDescription>Review and manage applications for this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{app.headhunter?.name || 'Anonymous'}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {app.headhunter?.email}
                          </CardDescription>
                        </div>
                        <Badge className={getApplicationStatusColor(app.status)}>
                          {app.status === 'shortlisted' ? 'Accepted' : app.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {app.cover_note && (
                          <div className="text-sm">
                            <p className="text-muted-foreground mb-2">{app.cover_note}</p>
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {app.eta_days && <span>ETA: {app.eta_days} days</span>}
                          {app.proposed_fee_value && (
                            <>
                              <span>•</span>
                              <span>Fee: {app.proposed_fee_value}{app.proposed_fee_model === 'percent_fee' ? '%' : app.proposed_fee_model === 'flat' ? ' (flat)' : '/hr'}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        {app.status === 'submitted' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleAccept(app.id, app.headhunter_id)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDecline(app.id, app.headhunter_id)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Decline
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleChat(app.headhunter_id)}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Chat
                            </Button>
                          </div>
                        )}
                        
                        {app.status !== 'submitted' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleChat(app.headhunter_id)}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Chat
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Apply Modal */}
      {user && job && (
        <ApplyModal
          open={applyModalOpen}
          onOpenChange={setApplyModalOpen}
          jobId={job.id}
          jobTitle={job.title}
          headhunterId={user.id}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};

export default JobDetail;
