import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check, X, MessageCircle, Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const JobReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Application form fields
  const [coverNote, setCoverNote] = useState('');
  const [feeModel, setFeeModel] = useState('percent_fee');
  const [feeValue, setFeeValue] = useState('');
  const [etaDays, setEtaDays] = useState('');

  useEffect(() => {
    if (user && profile?.role === 'headhunter') {
      fetchJobAndInvitation();
      fetchMessages();
    } else if (user && profile && profile.role !== 'headhunter') {
      navigate('/');
    }
  }, [id, user, profile, navigate]);

  const fetchJobAndInvitation = async () => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*, employer:profiles!jobs_created_by_fkey(*)')
        .eq('id', id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch invitation
      const { data: inviteData, error: inviteError } = await supabase
        .from('job_invitations')
        .select('*')
        .eq('job_id', id)
        .eq('headhunter_id', user?.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (inviteError) throw inviteError;
      
      if (!inviteData) {
        toast.error('No pending invitation found for this job');
        navigate(`/jobs/${id}`);
        return;
      }

      setInvitation(inviteData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, from_profile:profiles!messages_from_user_fkey(*)')
        .eq('job_id', id)
        .or(`from_user.eq.${user?.id},to_user.eq.${user?.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !job) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          from_user: user?.id,
          to_user: job.created_by,
          job_id: id,
          body: newMessage,
        } as any);

      if (error) throw error;

      setNewMessage('');
      fetchMessages();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!coverNote || !feeValue || !etaDays) {
      toast.error('Please fill in all application fields');
      return;
    }

    try {
      // Update invitation status
      const { error: inviteError } = await supabase
        .from('job_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      // Create application
      const { error: appError } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          headhunter_id: user?.id,
          cover_note: coverNote,
          proposed_fee_model: feeModel,
          proposed_fee_value: parseFloat(feeValue),
          eta_days: parseInt(etaDays),
          status: 'submitted',
        } as any);

      if (appError) throw appError;

      // Create notification for employer
      await supabase
        .from('notifications')
        .insert({
          user_id: job.created_by,
          type: 'application',
          title: 'Invitation Accepted',
          message: `${profile?.name} has accepted your invitation and applied to ${job.title}`,
          related_id: id,
        } as any);

      toast.success('Invitation accepted and application submitted!');
      navigate('/dashboard/headhunter');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async () => {
    try {
      const { error } = await supabase
        .from('job_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id);

      if (error) throw error;

      // Create notification for employer
      await supabase
        .from('notifications')
        .insert({
          user_id: job.created_by,
          type: 'invitation_declined',
          title: 'Invitation Declined',
          message: `${profile?.name} has declined your invitation for ${job.title}`,
          related_id: id,
        } as any);

      toast.success('Invitation declined');
      navigate('/dashboard/headhunter');
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
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

  if (!job || !invitation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Job or invitation not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => {
            const from = (location.state as any)?.from;
            const parentFrom = (location.state as any)?.parentFrom;
            
            if (from === 'job') {
              // Came from job detail page, go back to it with proper parent context
              navigate(`/jobs/${id}`, { state: { from: parentFrom || 'dashboard' } });
            } else if (from === 'dashboard') {
              // Came directly from dashboard
              navigate('/dashboard/headhunter');
            } else {
              // Default fallback
              navigate(`/jobs/${id}`);
            }
          }} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {(location.state as any)?.from === 'job' ? 'Back to Job' : 'Back to Dashboard'}
        </Button>

        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            Review Job Invitation
          </h1>
          <p className="text-muted-foreground">
            {job.employer?.company_name || job.employer?.name} has invited you to apply for this position
          </p>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Job Details & Application</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>
                  {job.employer?.company_name || job.employer?.name} • {job.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>

                {job.skills_must && job.skills_must.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_must.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {invitation.message && (
                  <div className="bg-[hsl(var(--accent-lilac))]/10 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Invitation Message</h3>
                    <p className="text-sm">{invitation.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Application</CardTitle>
                <CardDescription>Fill in the details to accept this invitation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cover-note">Cover Note</Label>
                  <Textarea
                    id="cover-note"
                    placeholder="Introduce yourself and explain why you're a good fit..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fee-model">Fee Model</Label>
                    <Select value={feeModel} onValueChange={setFeeModel}>
                      <SelectTrigger id="fee-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent_fee">Percentage Fee</SelectItem>
                        <SelectItem value="flat">Flat Fee</SelectItem>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fee-value">
                      {feeModel === 'percent_fee' ? 'Percentage (%)' : 'Amount ($)'}
                    </Label>
                    <Input
                      id="fee-value"
                      type="number"
                      placeholder={feeModel === 'percent_fee' ? '15' : '5000'}
                      value={feeValue}
                      onChange={(e) => setFeeValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eta">Estimated Time to Fill (days)</Label>
                  <Input
                    id="eta"
                    type="number"
                    placeholder="30"
                    value={etaDays}
                    onChange={(e) => setEtaDays(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleAcceptInvitation}
                    className="flex-1 bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))]"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Accept & Apply
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeclineInvitation}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Internal Messages</CardTitle>
                <CardDescription>Discuss this opportunity with the employer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.from_user === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.from_user === user?.id
                              ? 'bg-[hsl(var(--accent-lilac))] text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.body}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>Attach relevant documents for your application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Upload CV or other documents</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </div>
                  <Button disabled variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JobReview;
