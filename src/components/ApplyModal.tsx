import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const applicationSchema = z.object({
  coverNote: z.string().min(15, 'Cover note must be at least 15 characters').max(800, 'Cover note must not exceed 800 characters'),
  feeModel: z.enum(['percent_fee', 'flat', 'hourly'], { required_error: 'Please select a fee model' }),
  feeValue: z.number().positive('Fee value must be greater than 0'),
  etaDays: z.number().min(1, 'ETA must be at least 1 day').max(60, 'ETA cannot exceed 60 days'),
});

interface ApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  jobId: string;
  jobTitle: string;
  headhunterId: string;
}

export function ApplyModal({ open, onOpenChange, onSuccess, jobId, jobTitle, headhunterId }: ApplyModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [coverNote, setCoverNote] = useState('');
  const [feeModel, setFeeModel] = useState<'percent_fee' | 'flat' | 'hourly' | ''>('');
  const [feeValue, setFeeValue] = useState('');
  const [etaDays, setEtaDays] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Fetch credits when modal opens
  useEffect(() => {
    if (open) {
      fetchCredits();
    } else {
      setCoverNote('');
      setFeeModel('');
      setFeeValue('');
      setEtaDays('');
      setErrors({});
    }
  }, [open]);

  const fetchCredits = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_credits', {
        p_user_id: headhunterId,
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCreditsRemaining(data[0].credits_remaining);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check if user has credits
    if (creditsRemaining !== null && creditsRemaining <= 0) {
      setUpgradeDialogOpen(true);
      return;
    }

    // Validate inputs
    const validation = applicationSchema.safeParse({
      coverNote,
      feeModel,
      feeValue: parseFloat(feeValue),
      etaDays: parseInt(etaDays),
    });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicate application
      const { data: existingApp, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('headhunter_id', headhunterId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing application:', checkError);
        throw new Error('Failed to check existing applications');
      }

      if (existingApp) {
        toast({
          title: 'Already Applied',
          description: 'You have already applied to this job',
          variant: 'destructive',
        });
        onOpenChange(false);
        return;
      }

      // Create application
      const { data: newApp, error: appError } = await supabase
        .from('applications')
        .insert([{
          job_id: jobId,
          headhunter_id: headhunterId,
          cover_note: coverNote,
          proposed_fee_model: feeModel as 'percent_fee' | 'flat' | 'hourly',
          proposed_fee_value: parseFloat(feeValue),
          eta_days: parseInt(etaDays),
          status: 'submitted' as const,
        }])
        .select()
        .single();

      if (appError) {
        console.error('Error creating application:', appError);
        throw new Error('Failed to submit application');
      }

      // Get job details and employer info
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('title, created_by')
        .eq('id', jobId)
        .single();

      if (job) {
        // Fetch headhunter profile to get their name
        const { data: headhunterProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', headhunterId)
          .single();

        const headhunterName = headhunterProfile?.name || 'A headhunter';

        // Create notification for employer
        try {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: job.created_by,
              type: 'application_received',
              title: `${headhunterName} applied to ${job.title}`,
              message: `${headhunterName} applied with an ETA of ${parseInt(etaDays)} days`,
              payload: { 
                job_id: jobId, 
                application_id: newApp.id,
                headhunter_id: headhunterId 
              },
              related_id: newApp.id,
            } as any);

          if (notifError) {
            console.error('Error creating notification:', notifError);
          }
        } catch (notifErr) {
          console.error('Notification error:', notifErr);
        }

        // Send email to employer
        try {
          const { error: emailError } = await supabase.functions.invoke('send-application-email', {
            body: {
              jobId,
              applicationId: newApp.id,
              headhunterId,
              jobTitle: job.title,
              etaDays: parseInt(etaDays),
              feeModel,
              feeValue: parseFloat(feeValue),
            },
          });

          if (emailError) {
            console.error('Error sending email:', emailError);
          }
        } catch (emailErr) {
          console.error('Email function error:', emailErr);
        }
      }

      toast({
        title: 'Application Sent',
        description: "We'll notify you about updates. 1 credit has been deducted.",
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply to {jobTitle}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cover-note">Cover Note *</Label>
              <Textarea
                id="cover-note"
                placeholder="Tell the employer why you're the perfect match for this role... (15-800 characters)"
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                className="min-h-[120px] mt-2"
                required
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{coverNote.length} / 800 characters</span>
                {coverNote.length < 15 && coverNote.length > 0 && (
                  <span className="text-destructive">Minimum 15 characters</span>
                )}
              </div>
              {errors.coverNote && <p className="text-xs text-destructive mt-1">{errors.coverNote}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fee-model">Proposed Fee Model *</Label>
                <Select value={feeModel} onValueChange={(value: any) => setFeeModel(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select fee model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent_fee">Percentage Fee</SelectItem>
                    <SelectItem value="flat">Flat Fee</SelectItem>
                    <SelectItem value="hourly">Hourly Rate</SelectItem>
                  </SelectContent>
                </Select>
                {errors.feeModel && <p className="text-xs text-destructive mt-1">{errors.feeModel}</p>}
              </div>

              <div>
                <Label htmlFor="fee-value">Proposed Fee Value *</Label>
                <Input
                  id="fee-value"
                  type="number"
                  placeholder={feeModel === 'percent_fee' ? 'e.g., 15' : 'e.g., 5000'}
                  value={feeValue}
                  onChange={(e) => setFeeValue(e.target.value)}
                  min="0"
                  step="0.01"
                  className="mt-2"
                  required
                />
                {errors.feeValue && <p className="text-xs text-destructive mt-1">{errors.feeValue}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="eta-days">Estimated Time to Fill (days) *</Label>
              <Input
                id="eta-days"
                type="number"
                placeholder="e.g., 30"
                value={etaDays}
                onChange={(e) => setEtaDays(e.target.value)}
                min="1"
                max="60"
                className="mt-2"
                required
              />
              {errors.etaDays && <p className="text-xs text-destructive mt-1">{errors.etaDays}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))]"
              >
                {isSubmitting ? 'Sending...' : 'Send Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No Credits Remaining</AlertDialogTitle>
            <AlertDialogDescription>
              You've used all your application credits for this month. Upgrade your plan to continue applying to jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setUpgradeDialogOpen(false);
                onOpenChange(false);
                navigate('/plans');
              }}
              className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))]"
            >
              Upgrade Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
