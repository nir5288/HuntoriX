import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { MapPin, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

type Job = {
  id: string;
  title: string;
  description: string;
  industry: string | null;
  location: string | null;
  budget_currency: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string | null;
  skills_must: string[] | null;
  created_by: string;
};

export function HotOpportunities() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchJobs();
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

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, description, industry, location, budget_currency, budget_min, budget_max, status, skills_must, created_by')
      .eq('status', 'open')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
      return;
    }

    setJobs(data || []);
    setLoading(false);
  };

  const handleApply = (jobId: string) => {
    navigate(`/opportunities?job=${jobId}`);
  };

  const handleManage = (jobId: string) => {
    navigate(`/job/${jobId}`, { state: { from: 'dashboard' } });
  };

  const handleView = (jobId: string) => {
    navigate(`/job/${jobId}`, { state: { from: 'dashboard' } });
  };

  const getIndustryColor = (industry: string | null) => {
    if (!industry) return 'bg-[hsl(var(--surface))] text-foreground';
    
    const colorMap: { [key: string]: string } = {
      'Software/Tech': 'bg-[hsl(var(--accent-lilac))] text-foreground',
      'Biotech/Healthcare': 'bg-[hsl(var(--accent-mint))] text-foreground',
      'Finance/Fintech': 'bg-[hsl(var(--accent-pink))] text-foreground',
      'Energy/Cleantech': 'bg-[hsl(var(--warning))] text-foreground',
      'Public/Non-profit': 'bg-[hsl(var(--surface))] text-foreground'
    };
    
    return colorMap[industry] || 'bg-[hsl(var(--surface))] text-foreground';
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-muted';
    
    const colorMap: { [key: string]: string } = {
      'open': 'bg-[hsl(var(--success))] text-white',
      'shortlisted': 'bg-[hsl(var(--accent-lilac))] text-white',
      'awarded': 'bg-[hsl(var(--accent-pink))] text-white',
      'closed': 'bg-muted text-muted-foreground'
    };
    
    return colorMap[status] || 'bg-muted';
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Hot Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-16 w-full mb-4" />
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

  if (jobs.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            Hot Opportunities
          </h2>
          <p className="text-muted-foreground">Latest job openings from verified employers</p>
        </div>

        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {jobs.map((job) => (
                <CarouselItem key={job.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <Card className="rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 h-full bg-gradient-to-br from-background via-[hsl(var(--surface)/0.3)] to-background">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="space-y-4 flex-grow">
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg line-clamp-1">{job.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {job.industry && (
                            <Badge className={`${getIndustryColor(job.industry)} border-0`}>
                              {job.industry}
                            </Badge>
                          )}
                          {job.status && (
                            <Badge className={`${getStatusColor(job.status)} border-0`}>
                              {job.status}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        {job.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        )}
                        {(job.budget_min || job.budget_max) && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 flex-shrink-0" />
                            <span>
                              {job.budget_currency} {job.budget_min?.toLocaleString()}
                              {job.budget_max && ` - ${job.budget_max.toLocaleString()}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>

                      {job.skills_must && job.skills_must.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills_must.slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      </div>

                      <div className="pt-2 mt-auto">
                        {!user ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/auth?role=headhunter')}
                            className="w-full"
                          >
                            Sign in to Apply
                          </Button>
                        ) : profile?.role === 'headhunter' ? (
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => handleApply(job.id)}
                            className="w-full"
                          >
                            Apply
                          </Button>
                        ) : user.id === job.created_by ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManage(job.id)}
                            className="w-full"
                          >
                            Manage
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(job.id)}
                            className="w-full"
                          >
                            View
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
          <Button variant="link" onClick={() => navigate('/opportunities')} className="text-sm">
            View all opportunities →
          </Button>
        </div>
      </div>
    </section>
  );
}
