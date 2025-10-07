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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h1 className="text-4xl font-bold mb-2">{document?.title || "Privacy Policy"}</h1>
        <div className="mb-8 text-sm text-muted-foreground">
          Last updated: {document?.updated_at ? new Date(document.updated_at).toLocaleDateString() : "N/A"}
        </div>
        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:text-foreground
          prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-base prose-p:leading-7 prose-p:mb-4
          prose-ul:my-4 prose-li:my-2
          prose-strong:text-foreground prose-strong:font-semibold
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>{document?.content || ""}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
