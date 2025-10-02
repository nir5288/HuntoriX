import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Briefcase } from "lucide-react";

interface Job {
  id: string;
  title: string;
  status: string;
}

interface InviteToJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headhunterId: string;
  headhunterName: string;
  employerId: string;
}

export const InviteToJobModal = ({
  open,
  onOpenChange,
  headhunterId,
  headhunterName,
  employerId,
}: InviteToJobModalProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadJobs();
    }
  }, [open, employerId]);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, status")
        .eq("created_by", employerId)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load your job postings",
        variant: "destructive",
      });
    }
  };

  const handleInvite = async () => {
    if (!selectedJobId) {
      toast({
        title: "Error",
        description: "Please select a job",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("job_invitations").insert({
        job_id: selectedJobId,
        employer_id: employerId,
        headhunter_id: headhunterId,
        message: message || null,
        status: "pending",
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Invited",
            description: "You've already invited this headhunter to this job",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        // Get job title for notification
        const selectedJob = jobs.find(j => j.id === selectedJobId);
        
        // Create notification for headhunter
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: headhunterId,
              type: 'job_invitation',
              title: 'Job Invitation',
              message: `You've been invited to apply for ${selectedJob?.title || 'a job'}`,
              payload: { 
                job_id: selectedJobId,
                employer_id: employerId,
              },
              related_id: selectedJobId,
            } as any);
        } catch (notifErr) {
          console.error('Error creating notification:', notifErr);
        }

        toast({
          title: "Invitation Sent",
          description: `Successfully invited ${headhunterName} to collaborate`,
        });
        onOpenChange(false);
        setSelectedJobId("");
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Invite {headhunterName} to a Job
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="job">Select Job</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger id="job">
                <SelectValue placeholder="Choose a job posting..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No open jobs available
                  </SelectItem>
                ) : (
                  jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={loading || !selectedJobId}
            className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))]"
          >
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
