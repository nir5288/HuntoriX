import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

const PrivacyPolicy = () => {
  const { data: document, isLoading } = useQuery({
    queryKey: ["legal-document", "privacy_policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("document_type", "privacy_policy")
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown>{document?.content || ""}</ReactMarkdown>
      </div>
      <div className="mt-8 text-sm text-muted-foreground">
        Last updated: {document?.updated_at ? new Date(document.updated_at).toLocaleDateString() : "N/A"}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
