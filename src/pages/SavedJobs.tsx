import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Briefcase, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SavedJobs = () => {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      fetchSavedJobs();
    }
  }, [user, loading]);

  const fetchSavedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*, job:jobs(*, employer:profiles!jobs_created_by_fkey(*))')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedJobs(data || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      toast.error('Failed to load saved jobs');
    } finally {
      setLoadingData(false);
    }
  };

  const handleUnsave = async (savedJobId: string, jobTitle: string) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('id', savedJobId);

      if (error) throw error;

      setSavedJobs(savedJobs.filter(sj => sj.id !== savedJobId));
      toast.success(`Removed "${jobTitle}" from saved jobs`);
    } catch (error) {
      console.error('Error removing saved job:', error);
      toast.error('Failed to remove job');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--surface))] to-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section with Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent animate-fade-in">
                My Saved Jobs
              </h1>
              <p className="text-muted-foreground">Jobs you've bookmarked for later</p>
            </div>
            <Card className="bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 to-[hsl(var(--accent-lilac))]/10 border-[hsl(var(--accent-pink))]/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-[hsl(var(--accent-pink))] fill-current" />
                  <div>
                    <p className="text-3xl font-bold">{savedJobs.length}</p>
                    <p className="text-sm text-muted-foreground">Saved Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {savedJobs.length === 0 ? (
          <Card className="border-dashed border-2 hover:border-[hsl(var(--accent-mint))] transition-colors">
            <CardContent className="text-center py-16">
              <div className="inline-block p-4 rounded-full bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 to-[hsl(var(--accent-lilac))]/10 mb-4">
                <Heart className="h-16 w-16 text-[hsl(var(--accent-pink))] opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No saved jobs yet</h3>
              <p className="text-muted-foreground mb-6">Start building your collection of dream opportunities</p>
              <Button 
                onClick={() => navigate('/opportunities')}
                className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90"
              >
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {savedJobs.map((savedJob, index) => (
              <Card 
                key={savedJob.id} 
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-[hsl(var(--accent-mint))] animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="bg-gradient-to-r from-[hsl(var(--accent-mint))]/5 to-transparent">
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-1 cursor-pointer group" 
                      onClick={() => navigate(`/jobs/${savedJob.job.id}`, { state: { from: 'saved' } })}
                    >
                      <CardTitle className="text-2xl opacity-90 mb-3 group-hover:text-[hsl(var(--accent-mint))] transition-colors">
                        {savedJob.job?.title}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap gap-4 text-base">
                        <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-full">
                          <Briefcase className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
                          {savedJob.job.employer?.company_name || savedJob.job.employer?.name}
                        </span>
                        {savedJob.job.location && (
                          <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-full">
                            <MapPin className="h-4 w-4 text-[hsl(var(--accent-lilac))]" />
                            {savedJob.job.location}
                          </span>
                        )}
                        {savedJob.job.employment_type && (
                          <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-full">
                            <TrendingUp className="h-4 w-4 text-[hsl(var(--accent-pink))]" />
                            {savedJob.job.employment_type}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnsave(savedJob.id, savedJob.job?.title)}
                      className="text-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))]/10 hover:scale-110 transition-transform"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {savedJob.job.description && (
                      <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                        {savedJob.job.description}
                      </p>
                    )}
                    {savedJob.job.skills_must && savedJob.job.skills_must.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {savedJob.job.skills_must.slice(0, 6).map((skill: string, idx: number) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="opacity-90 hover:opacity-100 transition-opacity bg-gradient-to-r from-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Additional Info Bar */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
                        <span className="text-muted-foreground">
                          Saved {new Date(savedJob.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      {savedJob.job.salary_range && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-[hsl(var(--accent-pink))]" />
                          <span className="text-muted-foreground">{savedJob.job.salary_range}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Badge className="bg-gradient-to-r from-[hsl(var(--accent-mint))]/20 to-[hsl(var(--accent-lilac))]/20 text-foreground border-0">
                        {savedJob.job.status === 'open' ? '🟢 Open' : '📋 Active'}
                      </Badge>
                      <Button 
                        onClick={() => navigate(`/jobs/${savedJob.job.id}`, { state: { from: 'saved' } })}
                        className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90 opacity-95 hover:scale-105 transition-transform"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
