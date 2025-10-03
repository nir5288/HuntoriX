import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  submission?: any;
  onSuccess: () => void;
}

export function SubmissionDialog({
  open,
  onOpenChange,
  engagementId,
  submission,
  onSuccess,
}: SubmissionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    candidate_name: submission?.candidate_name || "",
    candidate_email: submission?.candidate_email || "",
    candidate_phone: submission?.candidate_phone || "",
    salary_expectation: submission?.salary_expectation || "",
    notice_period: submission?.notice_period || "",
    cv_url: submission?.cv_url || "",
    notes: submission?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("submissions").insert({
        engagement_id: engagementId,
        ...formData,
      });

      if (error) throw error;

      toast.success("Candidate submitted successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        candidate_name: "",
        candidate_email: "",
        candidate_phone: "",
        salary_expectation: "",
        notice_period: "",
        cv_url: "",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error submitting candidate:", error);
      toast.error("Failed to submit candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Candidate</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="candidate_name">Candidate Name *</Label>
            <Input
              id="candidate_name"
              value={formData.candidate_name}
              onChange={(e) =>
                setFormData({ ...formData, candidate_name: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="candidate_email">Email</Label>
              <Input
                id="candidate_email"
                type="email"
                value={formData.candidate_email}
                onChange={(e) =>
                  setFormData({ ...formData, candidate_email: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="candidate_phone">Phone</Label>
              <Input
                id="candidate_phone"
                type="tel"
                value={formData.candidate_phone}
                onChange={(e) =>
                  setFormData({ ...formData, candidate_phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary_expectation">Salary Expectation</Label>
              <Input
                id="salary_expectation"
                value={formData.salary_expectation}
                onChange={(e) =>
                  setFormData({ ...formData, salary_expectation: e.target.value })
                }
                placeholder="e.g., $80k-$100k"
              />
            </div>

            <div>
              <Label htmlFor="notice_period">Notice Period</Label>
              <Input
                id="notice_period"
                value={formData.notice_period}
                onChange={(e) =>
                  setFormData({ ...formData, notice_period: e.target.value })
                }
                placeholder="e.g., 2 weeks"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cv_url">CV URL</Label>
            <Input
              id="cv_url"
              type="url"
              value={formData.cv_url}
              onChange={(e) =>
                setFormData({ ...formData, cv_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional information about the candidate..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Candidate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
