import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useState } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ManageBannersModal } from './ManageBannersModal';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/lib/auth';
import bannerImage from '@/assets/huntorix-banner.jpg';
interface PromotionalBannerProps {
  location?: string;
}

export function PromotionalBanner({ location = 'home_top' }: PromotionalBannerProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showManageModal, setShowManageModal] = useState(false);
  const {
    isAdmin
  } = useIsAdmin();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  // Fetch user profile to get role
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60000
  });

  const {
    data: banners = []
  } = useQuery({
    queryKey: ['promotional-banners', location, userProfile?.role],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .eq('location', location)
        .order('display_order', {
          ascending: true
        });
      if (error) throw error;
      
      // Filter banners based on user role
      const userRole = userProfile?.role;
      const filtered = data?.filter(banner => {
        if (banner.target_audience === 'all') return true;
        if (!userRole) return banner.target_audience === 'all';
        return banner.target_audience === userRole;
      }) || [];
      
      return filtered;
    },
    staleTime: 60000
  });
  const currentBanner = banners[currentIndex];

  // Fetch job details for the current banner if it's a job type
  const {
    data: jobDetails
  } = useQuery({
    queryKey: ['banner-job', currentBanner?.job_id],
    queryFn: async () => {
      if (!currentBanner?.job_id) return null;
      const {
        data,
        error
      } = await supabase.from('jobs').select('*').eq('id', currentBanner.job_id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!currentBanner?.job_id && currentBanner?.content_type === 'job',
    staleTime: 60000,
    gcTime: 300000
  });
  if (!banners.length) return null;
  const nextBanner = () => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };
  const prevBanner = () => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };
  const getIndustryColor = (industry: string | null) => {
    if (!industry) return 'hsl(var(--surface))';
    const colorMap: {
      [key: string]: string;
    } = {
      'Software/Tech': 'hsl(var(--accent-lilac))',
      'Biotech/Healthcare': 'hsl(var(--accent-mint))',
      'Finance/Fintech': 'hsl(var(--accent-pink))',
      'Energy/Cleantech': 'hsl(var(--warning))',
      'AI / Data Science': 'hsl(var(--primary))',
      'Cybersecurity': 'hsl(var(--destructive))',
      'Semiconductors / Hardware': 'hsl(var(--accent-ocean))',
      'Telecom / Networking': 'hsl(var(--accent-lilac))',
      'Public/Non-profit': 'hsl(var(--surface))',
      'Other': 'hsl(var(--muted))'
    };
    return colorMap[industry] || 'hsl(var(--surface))';
  };
  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-muted';
    const colorMap: {
      [key: string]: string;
    } = {
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
  const handleViewDetails = () => {
    navigate(`/jobs/${currentBanner.job_id}`);
  };
  const renderBannerContent = () => {
    // If it's a job banner and we have job details, show the job card
    if (currentBanner.content_type === 'job' && jobDetails) {
      return <div className="flex justify-center items-center flex-1">
          <div className={`relative flex flex-col gap-0.5 w-full md:w-full lg:w-[78%] xl:w-[47%] p-2.5 pb-2 border-2`} style={{
          background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246), rgb(6, 182, 212)) border-box',
          borderRadius: '1rem',
          border: '2px solid transparent'
        }}>
            {/* Sponsored badge - absolute positioned at top right */}
            <Badge variant="secondary" className="absolute top-2 right-2 text-primary shrink-0 z-10 bg-[#ffe208] rounded-md text-[10px] h-4 px-1.5">
              Sponsored
            </Badge>

            {/* Main content with proper spacing to avoid button overlap */}
            <div className="space-y-0.5 pb-10 md:pb-0 md:pr-40">
              {/* Title and badges on same line */}
              <div className="flex flex-wrap items-center gap-1.5 pr-16 md:pr-0">
                <h3 className="text-lg md:text-xl font-bold leading-tight">
                  {currentBanner.title || jobDetails.title}
                </h3>
                {jobDetails.industry && <Badge variant="filter" style={{
                    backgroundColor: getIndustryColor(jobDetails.industry)
                  }} className="text-foreground border-0 text-xs h-5">
                    {jobDetails.industry}
                  </Badge>}
                {jobDetails.is_exclusive && <Badge className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white border-0 shrink-0 text-[10px] h-4">
                    HuntoriX Exclusive
                  </Badge>}
              </div>
            

              {/* Description */}
              {jobDetails.description && <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 md:line-clamp-2">
                  {jobDetails.description}
                </p>}

            </div>

            {/* Action buttons - responsive positioning */}
            <div className="absolute bottom-2 right-2 left-2 md:left-auto flex gap-1.5">
              <Button 
                onClick={handleViewDetails}
                size="sm"
                variant="hero"
                className="flex-1 md:flex-initial h-7 text-xs"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>;
    }

    // Default banner content (image/video/custom)
    const imageUrl = currentBanner.image_url?.startsWith('/src/assets/') 
      ? bannerImage 
      : currentBanner.image_url;
      
    const content = <div className="flex justify-center items-center flex-1">
        {imageUrl && <div className="w-full h-[100px] overflow-hidden rounded-lg">
            <img 
              src={imageUrl} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          </div>}
      </div>;

    // Priority: job_id > link_url
    const linkTo = currentBanner.job_id ? `/job/${currentBanner.job_id}` : currentBanner.link_url;
    if (linkTo) {
      return <Link to={linkTo} className="flex items-center gap-6 flex-1 min-w-0 hover:opacity-80 transition">
          {content}
        </Link>;
    }
    return content;
  };
  return <>
      <div className="w-full relative z-10">
        <div className="container mx-auto px-4 pt-5">
          {renderBannerContent()}
        </div>
      </div>

      {isAdmin && <ManageBannersModal open={showManageModal} onOpenChange={setShowManageModal} />}
    </>;
}