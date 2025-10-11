import { X, MapPin, Building2, FileText, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Candidate } from "./types";
import { getStatusColor, getInitials } from "./utils";

interface CandidateDetailsDialogProps {
  candidate: Candidate | null;
  onClose: () => void;
}

export function CandidateDetailsDialog({ candidate, onClose }: CandidateDetailsDialogProps) {
  if (!candidate) return null;

  return (
    <Dialog open={!!candidate} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={candidate.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-accent-mint to-accent-lilac text-white text-xl">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{candidate.name}</DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {candidate.location}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {candidate.industry}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="resume" className="rounded-lg">
              Resume
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg">
              Activity
            </TabsTrigger>
            <TabsTrigger value="compliance" className="rounded-lg">
              Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div>
              <h3 className="font-semibold mb-2">Skills</h3>
              <div className="flex gap-2 flex-wrap">
                {candidate.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="rounded-full"
                    style={{
                      borderColor: `hsl(var(--accent-${
                        idx % 2 === 0 ? "mint" : "lilac"
                      }))`,
                      color: `hsl(var(--accent-${idx % 2 === 0 ? "mint" : "lilac"}))`,
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${getStatusColor(
                    candidate.status
                  )}`}
                />
                <span className="capitalize">{candidate.status}</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Progress</h3>
              <Progress value={candidate.progress} className="h-3" />
              <span className="text-sm text-muted-foreground mt-1">
                {candidate.progress}% complete
              </span>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <Textarea
                placeholder="Add notes about this candidate..."
                className="rounded-xl min-h-[100px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="resume" className="mt-6">
            <div className="border-2 border-dashed border-border/40 rounded-xl p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No resume uploaded yet</p>
              <Button className="mt-4 rounded-xl">Upload Resume</Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                No activity recorded yet
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                No compliance data available
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button className="flex-1 rounded-xl bg-gradient-to-r from-accent-mint via-accent-lilac to-accent-pink hover:opacity-90">
            Attach to Job
          </Button>
          <Button variant="outline" className="flex-1 rounded-xl">
            Share
          </Button>
          <Button variant="outline" className="rounded-xl text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
