import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Shield, Calendar } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <Skeleton className="h-16 w-96 mb-4" />
          <Skeleton className="h-6 w-48 mb-12" />
          <Card className="p-8">
            <div className="space-y-6">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {document?.title || "Privacy Policy"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              Last updated: {document?.updated_at ? new Date(document.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <Card className="shadow-lg border-border/50">
          <div className="p-8 md:p-12">
            <div className="prose prose-slate dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-foreground
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-5 prose-h2:pb-2.5 prose-h2:border-b prose-h2:border-border/60
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-primary
              prose-p:text-sm prose-p:leading-7 prose-p:mb-4 prose-p:text-foreground/90
              prose-ul:my-4 prose-ul:space-y-1.5 prose-li:my-1.5 prose-li:text-sm prose-li:text-foreground/90
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline hover:prose-a:underline-offset-4
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <ReactMarkdown>{document?.content || ""}</ReactMarkdown>
            </div>
          </div>
        </Card>

        {/* Footer Contact Card */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Questions about our privacy practices?
            </p>
            <a 
              href="mailto:hello@huntorix.com" 
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Contact us at hello@huntorix.com
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
