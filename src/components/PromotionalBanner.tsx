import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Settings, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ManageBannersModal } from './ManageBannersModal';
import { Link } from 'react-router-dom';

export function PromotionalBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showManageModal, setShowManageModal] = useState(false);
  const { isAdmin } = useIsAdmin();

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
  });

  if (!banners.length) return null;

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
  });

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const renderBannerContent = () => {
    // If it's a job banner and we have job details, show the job
    if (currentBanner.content_type === 'job' && jobDetails) {
      const content = (
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Promoted
              </Badge>
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {currentBanner.title || jobDetails.title}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {jobDetails.company_name && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{jobDetails.company_name}</span>
                </div>
              )}
              {jobDetails.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{jobDetails.location}</span>
                </div>
              )}
              {jobDetails.salary_range && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{jobDetails.salary_range}</span>
                </div>
              )}
            </div>
            {currentBanner.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                {currentBanner.description}
              </p>
            )}
          </div>
        </div>
      );

      return (
        <Link to={`/job-detail/${currentBanner.job_id}`} className="flex items-center gap-6 flex-1 min-w-0 hover:opacity-80 transition">
          {content}
        </Link>
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
