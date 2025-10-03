import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, DollarSign, Calendar, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Job = {
  id: string;
  title: string;
  description: string;
  industry: string | null;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  skills_must: string[] | null;
  budget_currency: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string | null;
  created_by: string;
  created_at: string;
};

type OpportunityCardProps = {
  job: Job;
  currentUser: any;
  currentUserRole?: string;
  onApply: (jobId: string) => void;
  refreshTrigger?: number;
};

export function OpportunityCard({ job, currentUser, currentUserRole, onApply, refreshTrigger }: OpportunityCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);

  useEffect(() => {
    const checkApplication = async () => {
      if (!currentUser || currentUserRole !== 'headhunter') {
        setCheckingApplication(false);
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('headhunter_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking application:', error);
      }

      setHasApplied(!!data);
      setCheckingApplication(false);
    };

    checkApplication();

    // Set up real-time subscription for this job's applications
    if (currentUser && currentUserRole === 'headhunter') {
      const channel = supabase
        .channel(`applications-${job.id}-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'applications',
            filter: `job_id=eq.${job.id},headhunter_id=eq.${currentUser.id}`
          },
          () => {
            // Application created - update state immediately
            setHasApplied(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [job.id, currentUser, currentUserRole, refreshTrigger]);

  const getIndustryColor = (industry: string | null) => {
    if (!industry) return 'hsl(var(--surface))';
    
    const colorMap: { [key: string]: string } = {
      'Software/Tech': 'hsl(var(--accent-lilac))',
      'Biotech/Healthcare': 'hsl(var(--accent-mint))',
      'Finance/Fintech': 'hsl(var(--accent-pink))',
      'Energy/Cleantech': 'hsl(var(--warning))',
      'Public/Non-profit': 'hsl(var(--surface))'
    };
    
    return colorMap[industry] || 'hsl(var(--surface))';
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-muted';
    
    const colorMap: { [key: string]: string } = {
      'open': 'bg-[hsl(var(--success))]',
      'shortlisted': 'bg-[hsl(var(--accent-lilac))]',
      'awarded': 'bg-[hsl(var(--accent-pink))]',
      'closed': 'bg-muted'
    };
    
    return colorMap[status] || 'bg-muted';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleCTA = () => {
    // Guard: No user - redirect to auth
    if (!currentUser) {
      const currentUrl = window.location.pathname;
      navigate(`/auth?role=headhunter&redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Guard: Wrong role - show message and redirect
    if (currentUserRole !== 'headhunter') {
      toast({
        title: 'Sign in as a headhunter',
        description: 'You need to sign in as a headhunter to apply',
        variant: 'destructive',
      });
      const currentUrl = window.location.pathname;
      navigate(`/auth?role=headhunter&redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Guard: Job closed
    if (job.status === 'closed') {
      return; // Button should be disabled
    }

    // Guard: Already applied
    if (hasApplied) {
      return; // Button should be disabled
    }

    // All guards passed - proceed with apply
    onApply(job.id);
  };

  const getCTAText = () => {
    if (!currentUser) return 'Sign in to Apply';
    if (currentUserRole !== 'headhunter') return 'Apply';
    if (job.status === 'closed') return 'Closed';
    if (checkingApplication) return '...';
    if (hasApplied) return 'Applied';
    return 'Apply';
  };

  const getCTAVariant = () => {
    if (hasApplied || job.status === 'closed') return 'outline';
    if (!currentUser || currentUserRole !== 'headhunter') return 'outline';
    return 'hero';
  };

  const isButtonDisabled = () => {
    if (checkingApplication) return true;
    if (job.status === 'closed') return true;
    if (currentUserRole === 'headhunter' && hasApplied) return true;
    return false;
  };

  const renderButton = () => {
    // Don't show Apply button for employers at all
    if (currentUserRole === 'employer') {
      return null;
    }

    const button = (
      <Button 
        onClick={handleCTA} 
        variant={getCTAVariant() as any}
        disabled={isButtonDisabled()}
      >
        {getCTAText()}
      </Button>
    );

    // Show tooltip for closed jobs
    if (job.status === 'closed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>This role is closed</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-bold leading-tight flex-1">{job.title}</h3>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {truncateText(job.title, 24)}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {job.industry && (
            <Badge 
              style={{ backgroundColor: getIndustryColor(job.industry) }}
              className="text-foreground border-0"
            >
              {job.industry}
            </Badge>
          )}
          
          {job.status && (
            <Badge className={`${getStatusColor(job.status)} text-white border-0`}>
              {job.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Meta row with icons */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {job.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
          )}
          
          {(job.budget_min || job.budget_max) && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>
                {job.budget_currency} {job.budget_min?.toLocaleString()}
                {job.budget_max && ` - ${job.budget_max.toLocaleString()}`}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
          </div>
          
          {(job.employment_type || job.seniority) && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>
                {job.employment_type && (job.employment_type === 'full_time' ? 'Full-time' : job.employment_type)}
                {job.employment_type && job.seniority && ' • '}
                {job.seniority && job.seniority.charAt(0).toUpperCase() + job.seniority.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Description teaser */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>

        {/* Skills */}
        {job.skills_must && job.skills_must.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.skills_must.slice(0, 5).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {new Date(job.created_at).toLocaleDateString()}
        </div>
        {renderButton()}
      </CardFooter>
    </Card>
  );
}
