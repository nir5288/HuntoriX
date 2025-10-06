import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Settings, MapPin, DollarSign, Briefcase, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useState } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ManageBannersModal } from './ManageBannersModal';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/lib/auth';

export function PromotionalBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showManageModal, setShowManageModal] = useState(false);
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: banners = [] } = useQuery({
    queryKey: ['promotional-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const currentBanner = banners[currentIndex];

  // Fetch job details for the current banner if it's a job type
  const { data: jobDetails } = useQuery({
    queryKey: ['banner-job', currentBanner?.job_id],
    queryFn: async () => {
      if (!currentBanner?.job_id) return null;
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', currentBanner.job_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentBanner?.job_id && currentBanner?.content_type === 'job',
    staleTime: 60000,
    gcTime: 300000,
  });

  if (!banners.length) return null;

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

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

  const handleApply = () => {
    if (!user) {
      navigate(`/auth?role=headhunter`);
      return;
    }
    navigate(`/job-detail/${currentBanner.job_id}`);
  };

  const renderBannerContent = () => {
    // If it's a job banner and we have job details, show the job card
    if (currentBanner.content_type === 'job' && jobDetails) {
      return (
        <div className="flex justify-center items-center flex-1">
          <div 
            className={`relative flex flex-col gap-4 w-full md:w-full lg:w-[78%] xl:w-[47%] p-4 pt-6 border-2`}
            style={jobDetails.is_exclusive ? {
              background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246), rgb(6, 182, 212)) border-box',
              borderRadius: '1rem',
              border: '2px solid transparent'
            } : { 
              borderColor: 'hsl(var(--border))',
              borderRadius: '1rem'
            }}
          >
            {/* Promoted badge - absolute positioned at top right */}
            <Badge variant="secondary" className="absolute top-3 right-3 bg-primary/10 text-primary shrink-0 text-xs z-10">
              Promoted
            </Badge>

            {/* Left side - Content */}
            <div className="flex-1 space-y-1 -mt-4">
              {/* Title and exclusive badge on same line */}
              <div className="flex flex-wrap items-center gap-2 pr-20 md:pr-4">
                <h3 className="text-base md:text-lg font-bold leading-tight">
                  {currentBanner.title || jobDetails.title}
                </h3>
                {jobDetails.is_exclusive && (
                  <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 shrink-0 text-xs">
                    HuntoriX Exclusive
                  </Badge>
                )}
              </div>

              {/* Industry badge under title */}
              {jobDetails.industry && (
                <div>
                  <Badge 
                    variant="filter"
                    style={{ backgroundColor: getIndustryColor(jobDetails.industry) }}
                    className="text-foreground border-0 text-xs"
                  >
                    {jobDetails.industry}
                  </Badge>
                </div>
              )}
            
              {/* Employment type and seniority */}
              {(jobDetails.employment_type || jobDetails.seniority) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Briefcase className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {jobDetails.employment_type && (jobDetails.employment_type === 'full_time' ? 'Full-time' : jobDetails.employment_type === 'contract' ? 'Contract' : jobDetails.employment_type)}
                    {jobDetails.employment_type && jobDetails.seniority && ' • '}
                    {jobDetails.seniority && jobDetails.seniority.charAt(0).toUpperCase() + jobDetails.seniority.slice(1)}
                  </span>
                </div>
              )}

              {/* Meta information - compact grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {jobDetails.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{jobDetails.location}</span>
                  </div>
                )}
                
                {(jobDetails.budget_min || jobDetails.budget_max) && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {jobDetails.budget_currency} {jobDetails.budget_min?.toLocaleString()}
                      {jobDetails.budget_max && ` - ${jobDetails.budget_max.toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex flex-row gap-2 self-end">
              <Button
                onClick={() => navigate(`/job-detail/${currentBanner.job_id}`)}
                variant="outline"
                size="sm"
                className="text-xs px-8 py-1 h-8"
              >
                View
              </Button>
              <Button
                onClick={handleApply}
                variant="hero"
                size="sm"
                className="text-xs px-8 py-1 h-8"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Default banner content (image/video/custom)
    const content = (
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {currentBanner.image_url && (
          <img
            src={currentBanner.image_url}
            alt={currentBanner.title}
            className="h-24 w-32 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1">{currentBanner.title}</h3>
          {currentBanner.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{currentBanner.description}</p>
          )}
        </div>
      </div>
    );

    // Priority: job_id > link_url
    const linkTo = currentBanner.job_id 
      ? `/job-detail/${currentBanner.job_id}`
      : currentBanner.link_url;

    if (linkTo) {
      return (
        <Link to={linkTo} className="flex items-center gap-6 flex-1 min-w-0 hover:opacity-80 transition">
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <>
      <div className="w-full relative z-10">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            {banners.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={prevBanner}
                className="flex-shrink-0 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {renderBannerContent()}

            <div className="flex items-center gap-2 flex-shrink-0">
              {banners.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextBanner}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {currentIndex + 1} / {banners.length}
                  </span>
                </>
              )}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManageModal(true)}
                  className="ml-2"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <ManageBannersModal
          open={showManageModal}
          onOpenChange={setShowManageModal}
        />
      )}
    </>
  );
}
