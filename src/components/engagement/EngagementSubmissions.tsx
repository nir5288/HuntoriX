import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Phone, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SubmissionDialog } from "./SubmissionDialog";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EngagementSubmissionsProps {
  engagementId: string;
  isEmployer: boolean;
  candidateCap: number;
}

export function EngagementSubmissions({ engagementId, isEmployer, candidateCap }: EngagementSubmissionsProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    loadSubmissions();

    const channel = supabase
      .channel(`submissions-${engagementId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
          filter: `engagement_id=eq.${engagementId}`,
        },
        () => loadSubmissions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [engagementId]);

  const loadSubmissions = async () => {
    const { data } = await supabase
      .from("submissions")
      .select("*")
      .eq("engagement_id", engagementId)
      .order("submitted_at", { ascending: false });

    if (data) setSubmissions(data);
  };

  const handleStatusChange = async (submissionId: string, newStatus: "New" | "Shortlisted" | "Client-Interview" | "Rejected" | "Offer" | "Hired") => {
    const { error } = await supabase
      .from("submissions")
      .update({ status: newStatus })
      .eq("id", submissionId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success("Status updated");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      New: "bg-blue-500",
      Shortlisted: "bg-purple-500",
      "Client-Interview": "bg-yellow-500",
      Rejected: "bg-red-500",
      Offer: "bg-orange-500",
      Hired: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const canAddSubmission = submissions.length < candidateCap;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Candidate Submissions</h2>
          <p className="text-muted-foreground">
            {submissions.length} of {candidateCap} candidates submitted
          </p>
        </div>
        {!isEmployer && (
          <Button
            onClick={() => {
              setSelectedSubmission(null);
              setShowDialog(true);
            }}
            disabled={!canAddSubmission}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Candidate
          </Button>
        )}
      </div>

      {!canAddSubmission && !isEmployer && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium">Candidate cap reached</p>
                <p className="text-sm text-muted-foreground">
                  You've reached the maximum of {candidateCap} candidates. Request an extension to submit more.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Grid */}
      <div className="grid gap-4">
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">No candidates submitted yet</p>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{submission.candidate_name}</h3>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {submission.candidate_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {submission.candidate_email}
                        </div>
                      )}
                      {submission.candidate_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {submission.candidate_phone}
                        </div>
                      )}
                      {submission.salary_expectation && (
                        <div className="text-muted-foreground">
                          <span className="font-medium">Salary:</span> {submission.salary_expectation}
                        </div>
                      )}
                      {submission.notice_period && (
                        <div className="text-muted-foreground">
                          <span className="font-medium">Notice:</span> {submission.notice_period}
                        </div>
                      )}
                    </div>

                    {submission.notes && (
                      <p className="text-sm text-muted-foreground">{submission.notes}</p>
                    )}

                    {submission.cv_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={submission.cv_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View CV
                        </a>
                      </Button>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                    </p>
                  </div>

                  {isEmployer && (
                    <div className="ml-4">
                      <Select
                        value={submission.status}
                        onValueChange={(value) => handleStatusChange(submission.id, value as "New" | "Shortlisted" | "Client-Interview" | "Rejected" | "Offer" | "Hired")}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="Client-Interview">Client Interview</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value="Offer">Offer</SelectItem>
                          <SelectItem value="Hired">Hired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <SubmissionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        engagementId={engagementId}
        submission={selectedSubmission}
        onSuccess={loadSubmissions}
      />
    </div>
  );
}
