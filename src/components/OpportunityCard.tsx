import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { MapPin, DollarSign, Calendar, Briefcase, Sparkles, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
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
  onIndustryClick?: (industry: string) => void;
  onSkillClick?: (skill: string) => void;
};

export function OpportunityCard({ job, currentUser, currentUserRole, onApply, refreshTrigger, onIndustryClick, onSkillClick }: OpportunityCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isHoveringSkills, setIsHoveringSkills] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  // Auto-scroll carousel with bidirectional movement - pause on hover
  useEffect(() => {
    if (!carouselApi || !job.skills_must || job.skills_must.length <= 3 || isHoveringSkills) {
      return;
    }

    let direction: 'next' | 'prev' = 'next';
    const scrollInterval = 3000; // Time between scrolls
    const pauseInterval = 1500; // Pause at ends

    const scroll = () => {
      if (direction === 'next') {
        if (carouselApi.canScrollNext()) {
          carouselApi.scrollNext();
        } else {
          // Reached the end, pause then reverse
          setTimeout(() => {
            direction = 'prev';
          }, pauseInterval);
        }
      } else {
        if (carouselApi.canScrollPrev()) {
          carouselApi.scrollPrev();
        } else {
          // Reached the start, pause then go forward
          setTimeout(() => {
            direction = 'next';
          }, pauseInterval);
        }
      }
    };

    const timer = setInterval(scroll, scrollInterval);

    return () => clearInterval(timer);
  }, [carouselApi, job.skills_must, isHoveringSkills]);

  // Check if job is saved
  useEffect(() => {
    const checkSaved = async () => {
      if (!currentUser) return;
      
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('job_id', job.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking saved job:', error);
        return;
      }
      
      setIsSaved(!!data);
    };
    
    checkSaved();
  }, [currentUser, job.id]);

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
    return text.substring(0, maxLength).trim() + '...';
  };

  const getPreviewDescription = (text: string) => {
    // Truncate to 150 characters for consistent preview length
    return truncateText(text, 150);
  };

  const isNewJob = () => {
    const hoursSincePosted = differenceInHours(new Date(), new Date(job.created_at));
    return hoursSincePosted < 24;
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
        <TooltipProvider delayDuration={0}>
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

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save jobs',
        variant: 'destructive',
      });
      return;
    }
    
    setSavingJob(true);
    
    try {
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('job_id', job.id);
        
        if (error) throw error;
        
        setIsSaved(false);
        toast({
          title: 'Job removed',
          description: 'Job removed from your saved list',
        });
      } else {
        // Save
        const { error } = await supabase
          .from('saved_jobs')
          .insert({
            user_id: currentUser.id,
            job_id: job.id,
          });
        
        if (error) throw error;
        
        setIsSaved(true);
        toast({
          title: 'Job saved',
          description: 'Job added to your saved list',
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: 'Error',
        description: 'Failed to save job',
        variant: 'destructive',
      });
    } finally {
      setSavingJob(false);
    }
  };

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-bold leading-tight flex-1">{job.title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSaveToggle}
                    disabled={savingJob}
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isSaved ? 'fill-[hsl(var(--accent-pink))] text-[hsl(var(--accent-pink))]' : ''
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isSaved ? 'Remove from saved' : 'Save job'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isNewJob() && (
              <Badge className="bg-[hsl(var(--warning))] text-white border-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                NEW
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {job.industry && (
            <Badge 
              variant="filter"
              style={{ backgroundColor: getIndustryColor(job.industry) }}
              className="text-foreground border-0"
              onClick={(e) => {
                e.stopPropagation();
                onIndustryClick?.(job.industry!);
              }}
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

      <CardContent className="flex-1 flex flex-col space-y-4">
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
            <span>Posted {job.created_at && !isNaN(new Date(job.created_at).getTime()) 
              ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
              : 'recently'
            }</span>
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

        {/* Description teaser - fixed preview length */}
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {getPreviewDescription(job.description)}
        </p>
        
        {/* Spacer to push skills to bottom */}
        <div className="flex-1" />
        
        {/* Skills carousel - auto-scroll with consistent height - always at bottom */}
        <div className="h-10 flex items-center">
          {job.skills_must && job.skills_must.length > 0 && (
            <div 
              className="relative overflow-hidden w-full"
              onMouseEnter={() => setIsHoveringSkills(true)}
              onMouseLeave={() => setIsHoveringSkills(false)}
            >
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: "start",
                  loop: false,
                  dragFree: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {job.skills_must.map((skill, idx) => (
                    <CarouselItem key={idx} className="pl-2 basis-auto">
                      <Badge 
                        variant="filter" 
                        className="text-xs whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSkillClick?.(skill);
                        }}
                      >
                        {skill}
                      </Badge>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-4 border-t">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/job/${job.id}`, { state: { from: 'opportunities' } })}
        >
          View Details
        </Button>
        {renderButton()}
      </CardFooter>
    </Card>
  );
}
