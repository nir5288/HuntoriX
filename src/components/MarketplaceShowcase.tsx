import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { CheckCircle, Star, TrendingUp, MapPin, DollarSign, Users, Briefcase } from 'lucide-react';
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

export function MarketplaceShowcase() {
  const [headhunters, setHeadhunters] = useState<HeadhunterProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [headhunterApi, setHeadhunterApi] = useState<CarouselApi>();
  const [jobApi, setJobApi] = useState<CarouselApi>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const headhunterScrollRef = useRef<NodeJS.Timeout | null>(null);
  const jobScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Promise.all([fetchHeadhunters(), fetchJobs()]);
  }, []);

  // Auto-scroll for headhunters
  useEffect(() => {
    if (!headhunterApi) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    headhunterScrollRef.current = setInterval(() => {
      if (headhunterApi.canScrollNext()) {
        headhunterApi.scrollNext();
      } else {
        headhunterApi.scrollTo(0);
      }
    }, 3500);

    return () => {
      if (headhunterScrollRef.current) clearInterval(headhunterScrollRef.current);
    };
  }, [headhunterApi]);

  // Auto-scroll for jobs
  useEffect(() => {
    if (!jobApi) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    jobScrollRef.current = setInterval(() => {
      if (jobApi.canScrollNext()) {
        jobApi.scrollNext();
      } else {
        jobApi.scrollTo(0);
      }
    }, 4000);

    return () => {
      if (jobScrollRef.current) clearInterval(jobScrollRef.current);
    };
  }, [jobApi]);

  const fetchHeadhunters = async () => {
    const { data, error } = await supabase.rpc('get_public_profiles');
    if (error) {
      console.error('Error fetching headhunters:', error);
      setLoading(false);
      return;
    }

    const filteredData = (data || [])
      .filter((h: any) => h.role === 'headhunter')
      .sort((a: any, b: any) => {
        if (a.verified !== b.verified) return b.verified ? 1 : -1;
        if ((b.rating_avg || 0) !== (a.rating_avg || 0)) return (b.rating_avg || 0) - (a.rating_avg || 0);
        return (b.success_rate || 0) - (a.success_rate || 0);
      })
      .slice(0, 8);

    setHeadhunters(filteredData);
    setLoading(false);
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, description, industry, location, budget_currency, budget_min, budget_max, status, skills_must, created_by')
      .eq('status', 'open')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }

    setJobs(data || []);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'HH';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
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

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <Skeleton className="h-12 w-64 mx-auto mb-8" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </section>
    );
  }

  if (headhunters.length === 0 && jobs.length === 0) return null;

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent-pink)/0.08)] via-background to-[hsl(var(--accent-mint)/0.08)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            Marketplace Highlights
          </h2>
          <p className="text-muted-foreground text-lg">Discover top talent and hot opportunities</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Headhunters Side */}
          <div className="relative group animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent-pink)/0.2)] to-[hsl(var(--accent-lilac)/0.2)] rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-background/80 backdrop-blur-sm rounded-3xl border-2 border-[hsl(var(--accent-pink)/0.3)] p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Featured Headhunters</h3>
                  <p className="text-sm text-muted-foreground">Top verified recruiters</p>
                </div>
              </div>

              <Carousel setApi={setHeadhunterApi} opts={{ align: 'start', loop: true }} className="w-full">
                <CarouselContent>
                  {headhunters.map((headhunter) => (
                    <CarouselItem key={headhunter.id}>
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-[hsl(var(--surface)/0.5)]">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="relative">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={headhunter.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] text-foreground">
                                  {getInitials(headhunter.name)}
                                </AvatarFallback>
                              </Avatar>
                              {headhunter.verified && (
                                <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-[hsl(var(--success))] bg-background rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg mb-1">{headhunter.name || 'Headhunter'}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">{headhunter.bio || 'Professional recruiter'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-4 text-sm">
                            {headhunter.rating_avg !== null && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-[hsl(var(--accent-pink))] text-[hsl(var(--accent-pink))]" />
                                <span className="font-medium">{headhunter.rating_avg.toFixed(1)}</span>
                              </div>
                            )}
                            {headhunter.success_rate !== null && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
                                <span className="font-medium">{headhunter.success_rate}%</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {headhunter.industries?.slice(0, 3).map((industry, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{industry}</Badge>
                            ))}
                          </div>

                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => navigate(`/profile/headhunter/${headhunter.id}`)}
                            className="w-full"
                          >
                            View Profile
                          </Button>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              <div className="text-center mt-4">
                <Button variant="link" onClick={() => navigate('/headhunters')} className="text-sm">
                  View all headhunters →
                </Button>
              </div>
            </div>
          </div>

          {/* Jobs Side */}
          <div className="relative group animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent-mint)/0.2)] to-[hsl(var(--accent-lilac)/0.2)] rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-background/80 backdrop-blur-sm rounded-3xl border-2 border-[hsl(var(--accent-mint)/0.3)] p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Hot Opportunities</h3>
                  <p className="text-sm text-muted-foreground">Latest job openings</p>
                </div>
              </div>

              <Carousel setApi={setJobApi} opts={{ align: 'start', loop: true }} className="w-full">
                <CarouselContent>
                  {jobs.map((job) => (
                    <CarouselItem key={job.id}>
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-[hsl(var(--surface)/0.5)]">
                        <CardContent className="p-6">
                          <div className="mb-4">
                            <h4 className="font-bold text-lg mb-2 line-clamp-1">{job.title}</h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.industry && (
                                <Badge className={`${getIndustryColor(job.industry)} border-0 text-xs`}>
                                  {job.industry}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{job.description}</p>
                          </div>

                          <div className="space-y-2 text-sm text-muted-foreground mb-4">
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

                          {job.skills_must && job.skills_must.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {job.skills_must.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                          )}

                          <Button
                            variant="mint"
                            size="sm"
                            onClick={() => navigate(`/job/${job.id}`)}
                            className="w-full"
                          >
                            {user && profile?.role === 'headhunter' ? 'Apply Now' : 'View Details'}
                          </Button>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              <div className="text-center mt-4">
                <Button variant="link" onClick={() => navigate('/opportunities')} className="text-sm">
                  View all opportunities →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
