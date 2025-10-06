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
        <div className={`flex gap-6 items-center justify-center flex-1 p-4 rounded-xl ${
          jobDetails.is_exclusive ? 'border-2 border-gradient-to-r from-purple-500 via-blue-500 to-cyan-500' : ''
        }`} style={jobDetails.is_exclusive ? {
          borderImage: 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246), rgb(6, 182, 212)) 1'
        } : {}}>
          <div className="flex-1 max-w-4xl mx-auto space-y-3">
            {/* Exclusive badge centered at top */}
            {jobDetails.is_exclusive && (
              <div className="flex justify-center mb-2">
                <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 px-4 py-1">
                  HuntoriX Exclusive
                </Badge>
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-bold leading-tight text-center">
              {currentBanner.title || jobDetails.title}
            </h3>
            
            {/* Badges row - Industry and Status */}
            <div className="flex flex-wrap gap-2 justify-center">
              {jobDetails.industry && (
                <Badge 
                  variant="filter"
                  style={{ backgroundColor: getIndustryColor(jobDetails.industry) }}
                  className="text-foreground border-0"
                >
                  {jobDetails.industry}
                </Badge>
              )}
              
              {jobDetails.status && (
                <Badge className={`${getStatusColor(jobDetails.status)} text-white border-0`}>
                  {jobDetails.status}
                </Badge>
              )}
            </div>

            {/* Meta information with icons */}
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground max-w-2xl mx-auto">
              {jobDetails.location && (
                <div className="flex items-center gap-2 justify-center">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{jobDetails.location}</span>
                </div>
              )}
              
              {(jobDetails.budget_min || jobDetails.budget_max) && (
                <div className="flex items-center gap-2 justify-center">
                  <DollarSign className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {jobDetails.budget_currency} {jobDetails.budget_min?.toLocaleString()}
                    {jobDetails.budget_max && ` - ${jobDetails.budget_max.toLocaleString()}`}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 justify-center">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  Posted {jobDetails.created_at && !isNaN(new Date(jobDetails.created_at).getTime()) 
                    ? formatDistanceToNow(new Date(jobDetails.created_at), { addSuffix: true })
                    : 'recently'
                  }
                </span>
              </div>

              {(jobDetails.employment_type || jobDetails.seniority) && (
                <div className="flex items-center gap-2 justify-center">
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {jobDetails.employment_type && (jobDetails.employment_type === 'full_time' ? 'Full-time' : jobDetails.employment_type)}
                    {jobDetails.employment_type && jobDetails.seniority && ' • '}
                    {jobDetails.seniority && jobDetails.seniority.charAt(0).toUpperCase() + jobDetails.seniority.slice(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Description preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 text-center max-w-2xl mx-auto">
              {truncateText(jobDetails.description, 180)}
            </p>

            {/* Skills tags */}
            {jobDetails.skills_must && jobDetails.skills_must.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {jobDetails.skills_must.slice(0, 6).map((skill, idx) => (
                  <Badge 
                    key={idx}
                    variant="filter" 
                    className="text-xs"
                  >
                    {skill}
                  </Badge>
                ))}
                {jobDetails.skills_must.length > 6 && (
                  <Badge variant="filter" className="text-xs">
                    +{jobDetails.skills_must.length - 6} more
                  </Badge>
                )}
              </div>
            )}

            {/* Action buttons centered */}
            <div className="flex gap-3 justify-center pt-2">
              <Button
                onClick={() => navigate(`/job-detail/${currentBanner.job_id}`)}
                variant="outline"
                className="min-w-[140px]"
              >
                View Details
              </Button>
              <Button
                onClick={handleApply}
                variant="hero"
                className="min-w-[140px]"
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
      <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
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
