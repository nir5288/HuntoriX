import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Upload } from "lucide-react";
import { toast } from "sonner";

interface EngagementFilesProps {
  engagementId: string;
}

export function EngagementFiles({ engagementId }: EngagementFilesProps) {
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    loadFiles();
  }, [engagementId]);

  const loadFiles = async () => {
    // Get all submissions for this engagement and extract CV URLs
    const { data: submissions } = await supabase
      .from("submissions")
      .select("candidate_name, cv_url")
      .eq("engagement_id", engagementId)
      .not("cv_url", "is", null);

    if (submissions) {
      setFiles(
        submissions.map((s) => ({
          name: `${s.candidate_name} - CV`,
          url: s.cv_url,
        }))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Files & Documents</h2>
      </div>

      <div className="grid gap-4">
        {files.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No files uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          files.map((file, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
