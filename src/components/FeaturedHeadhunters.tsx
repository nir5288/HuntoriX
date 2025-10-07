import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { CheckCircle, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

type HeadhunterProfile = {
  id: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  industries: string[] | null;
  skills: string[] | null;
  rating_avg: number | null;
  success_rate: number | null;
  verified: boolean | null;
  response_time_hours?: number | null;
};

export function FeaturedHeadhunters() {
  const [headhunters, setHeadhunters] = useState<HeadhunterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchHeadhunters();
  }, []);

  useEffect(() => {
    if (!api) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (api.canScrollNext()) {
          api.scrollNext();
        } else {
          api.scrollTo(0);
        }
      }, 3000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [api]);

  const handleMouseEnter = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (!api) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    autoScrollRef.current = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 3000);
  };

  const fetchHeadhunters = async () => {
    const { data, error } = await supabase
      .rpc('get_public_profiles');

    if (error) {
      console.error('Error fetching headhunters:', error);
      setLoading(false);
      return;
    }

    // Filter and sort headhunters client-side
    const filteredData = (data || [])
      .filter((h: any) => h.role === 'headhunter')
      .sort((a: any, b: any) => {
        // Sort by verified first
        if (a.verified !== b.verified) return b.verified ? 1 : -1;
        // Then by rating
        if ((b.rating_avg || 0) !== (a.rating_avg || 0)) return (b.rating_avg || 0) - (a.rating_avg || 0);
        // Then by success rate
        return (b.success_rate || 0) - (a.success_rate || 0);
      })
      .slice(0, 12);

    setHeadhunters(filteredData);
    setLoading(false);
  };

  const handleInviteToJob = (headhunterId: string) => {
    navigate(`/dashboard/employer?invite=${headhunterId}`);
  };

  const handleMessage = (headhunterId: string) => {
    navigate(`/messages?with=${headhunterId}`);
  };

  const handleViewProfile = (headhunterId: string) => {
    navigate(`/profile/headhunter/${headhunterId}`);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'HH';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Featured Headhunters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-16 rounded-full mb-4" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (headhunters.length === 0) return null;

  return (
    <section className="relative py-16 bg-gradient-to-br from-[hsl(var(--accent-pink)/0.4)] via-[hsl(var(--accent-mint)/0.35)] to-[hsl(var(--accent-lilac)/0.4)] overflow-hidden">
      <div className="container mx-auto px-4 space-y-8 max-w-full">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            Featured Headhunters
          </h2>
          <p className="text-muted-foreground">Connect with verified, expert recruiters</p>
        </div>

        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full max-w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4 max-w-full">
              {headhunters.map((headhunter) => (
                <CarouselItem key={headhunter.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <Card className="rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 h-full bg-gradient-to-br from-background via-[hsl(var(--surface)/0.3)] to-background">
                    <CardContent className="p-6 flex flex-col items-center text-center h-full">
                      <div className="space-y-4 flex-grow flex flex-col items-center justify-start w-full">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={headhunter.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] text-foreground text-xl">
                            {getInitials(headhunter.name)}
                          </AvatarFallback>
                        </Avatar>
                        {headhunter.verified && (
                          <CheckCircle className="absolute -bottom-1 -right-1 h-6 w-6 text-[hsl(var(--success))] bg-background rounded-full" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg">{headhunter.name || 'Headhunter'}</h3>
                          {headhunter.response_time_hours && headhunter.response_time_hours < 2 && (
                            <Badge className="bg-[hsl(var(--success))] text-white text-xs">
                              Responds Under 2H
                            </Badge>
                          )}
                          {headhunter.success_rate >= 85 && (
                            <Badge className="bg-[hsl(var(--accent-lilac))] text-white text-xs">
                              {headhunter.success_rate}% Success
                            </Badge>
                          )}
                        </div>
                        {headhunter.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{headhunter.bio}</p>
                        )}
                      </div>

                      {(headhunter.industries || headhunter.skills) && (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {headhunter.industries?.slice(0, 2).map((industry, idx) => (
                            <Badge key={`industry-${idx}`} variant="secondary" className="text-xs">
                              {industry}
                            </Badge>
                          ))}
                          {headhunter.skills?.slice(0, 2).map((skill, idx) => (
                            <Badge key={`skill-${idx}`} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        {headhunter.rating_avg !== null && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-[hsl(var(--accent-pink))] text-[hsl(var(--accent-pink))]" />
                            <span className="font-medium">{headhunter.rating_avg.toFixed(1)}</span>
                          </div>
                        )}
                        {headhunter.success_rate !== null && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
                            <span className="font-medium">{headhunter.success_rate.toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 w-full mt-auto">
                        {user && profile?.role === 'employer' ? (
                          <>
                            <Button
                              variant="hero"
                              size="sm"
                              onClick={() => handleInviteToJob(headhunter.id)}
                              className="w-full text-xs"
                            >
                              Invite to Job
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMessage(headhunter.id)}
                              className="w-full text-xs"
                            >
                              Message
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProfile(headhunter.id)}
                            className="w-full text-xs"
                          >
                            View Profile
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="text-center">
          <Button variant="link" onClick={() => navigate('/headhunters')} className="text-sm">
            View all headhunters →
          </Button>
        </div>
      </div>
    </section>
  );
}
