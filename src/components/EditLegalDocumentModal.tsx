import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditLegalDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditLegalDocumentModal = ({ open, onOpenChange }: EditLegalDocumentModalProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("privacy_policy");

  const { data: documents } = useQuery({
    queryKey: ["legal-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .in("document_type", ["privacy_policy", "terms_of_service", "accessibility_statement"]);

      if (error) throw error;
      return data;
    },
  });

  const privacyPolicy = documents?.find(d => d.document_type === "privacy_policy");
  const termsOfService = documents?.find(d => d.document_type === "terms_of_service");
  const accessibilityStatement = documents?.find(d => d.document_type === "accessibility_statement");

  const [privacyTitle, setPrivacyTitle] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [termsTitle, setTermsTitle] = useState("");
  const [termsContent, setTermsContent] = useState("");
  const [accessibilityTitle, setAccessibilityTitle] = useState("");
  const [accessibilityContent, setAccessibilityContent] = useState("");

  // Update local state when documents are loaded
  useEffect(() => {
    if (privacyPolicy) {
      setPrivacyTitle(privacyPolicy.title);
      setPrivacyContent(privacyPolicy.content);
    }
    if (termsOfService) {
      setTermsTitle(termsOfService.title);
      setTermsContent(termsOfService.content);
    }
    if (accessibilityStatement) {
      setAccessibilityTitle(accessibilityStatement.title);
      setAccessibilityContent(accessibilityStatement.content);
    }
  }, [privacyPolicy, termsOfService, accessibilityStatement]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("legal_documents")
        .update({ 
          title, 
          content,
          updated_by: user?.id 
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
      queryClient.invalidateQueries({ queryKey: ["legal-document"] });
      toast.success("Document updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update document: " + error.message);
    },
  });

  const handleSave = () => {
    if (activeTab === "privacy_policy" && privacyPolicy) {
      updateMutation.mutate({
        id: privacyPolicy.id,
        title: privacyTitle,
        content: privacyContent,
      });
    } else if (activeTab === "terms_of_service" && termsOfService) {
      updateMutation.mutate({
        id: termsOfService.id,
        title: termsTitle,
        content: termsContent,
      });
    } else if (activeTab === "accessibility_statement" && accessibilityStatement) {
      updateMutation.mutate({
        id: accessibilityStatement.id,
        title: accessibilityTitle,
        content: accessibilityContent,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Legal Documents</DialogTitle>
          <DialogDescription>
            Update your Privacy Policy, Terms of Service, and Accessibility Statement. Changes will be visible to all users immediately.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="privacy_policy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="terms_of_service">Terms of Service</TabsTrigger>
            <TabsTrigger value="accessibility_statement">Accessibility</TabsTrigger>
          </TabsList>

          <TabsContent value="privacy_policy" className="space-y-4">
            <div>
              <Label htmlFor="privacy-title">Title</Label>
              <Input
                id="privacy-title"
                value={privacyTitle}
                onChange={(e) => setPrivacyTitle(e.target.value)}
                placeholder="Privacy Policy"
              />
            </div>
            <div>
              <Label htmlFor="privacy-content">Content (Markdown supported)</Label>
              <Textarea
                id="privacy-content"
                value={privacyContent}
                onChange={(e) => setPrivacyContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="terms_of_service" className="space-y-4">
            <div>
              <Label htmlFor="terms-title">Title</Label>
              <Input
                id="terms-title"
                value={termsTitle}
                onChange={(e) => setTermsTitle(e.target.value)}
                placeholder="Terms of Service"
              />
            </div>
            <div>
              <Label htmlFor="terms-content">Content (Markdown supported)</Label>
              <Textarea
                id="terms-content"
                value={termsContent}
                onChange={(e) => setTermsContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="accessibility_statement" className="space-y-4">
            <div>
              <Label htmlFor="accessibility-title">Title</Label>
              <Input
                id="accessibility-title"
                value={accessibilityTitle}
                onChange={(e) => setAccessibilityTitle(e.target.value)}
                placeholder="Accessibility Statement"
              />
            </div>
            <div>
              <Label htmlFor="accessibility-content">Content (Markdown supported)</Label>
              <Textarea
                id="accessibility-content"
                value={accessibilityContent}
                onChange={(e) => setAccessibilityContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditLegalDocumentModal;
