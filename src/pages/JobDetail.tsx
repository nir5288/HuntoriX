import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Check, X, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchJob();
  }, [id, user]);

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
          .select('id')
          .eq('job_id', id)
          .eq('headhunter_id', user.id)
          .maybeSingle();

        setHasApplied(!!appData);
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

  const handleApply = async () => {
    if (!user) {
      navigate('/auth?role=headhunter');
      return;
    }

    if (profile?.role !== 'headhunter') {
      toast.error('Only headhunters can apply to jobs');
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          headhunter_id: user.id,
          status: 'submitted',
        });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setHasApplied(true);
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to submit application');
    }
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
        });

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
        });

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                    <CardDescription className="text-lg">
                      {job.employer?.company_name || job.employer?.name}
                    </CardDescription>
                  </div>
                  <Badge className="bg-[hsl(var(--accent-mint))]">
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{job.employment_type?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Job Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>

                {job.skills_must && job.skills_must.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_must.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {job.skills_nice && job.skills_nice.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Nice to Have</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_nice.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Seniority Level</p>
                  <p className="font-medium capitalize">{job.seniority}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Industry</p>
                  <p className="font-medium">{job.industry || 'Not specified'}</p>
                </div>

                {job.budget_min && job.budget_max && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Salary Range</p>
                    <p className="font-medium">
                      {job.budget_currency} {job.budget_min?.toLocaleString()} - {job.budget_max?.toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Placement Fee</p>
                  <p className="font-medium">
                    {job.fee_model === 'percent_fee' 
                      ? `${job.fee_value}% of annual salary` 
                      : `${job.fee_value} ${job.budget_currency}`}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Candidate Quota</p>
                  <p className="font-medium">{job.candidate_quota} CVs per headhunter</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">SLA</p>
                  <p className="font-medium">{job.sla_days} days</p>
                </div>
              </CardContent>
            </Card>

            {profile?.role === 'headhunter' && (
              <Card>
                <CardContent className="pt-6">
                  {hasApplied ? (
                    <div className="text-center space-y-2">
                      <Badge className="bg-[hsl(var(--success))]">Applied</Badge>
                      <p className="text-sm text-muted-foreground">You have already applied to this job</p>
                    </div>
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
    </div>
  );
};

export default JobDetail;
