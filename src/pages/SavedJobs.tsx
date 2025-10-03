import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Briefcase, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SavedJobs = () => {
  const { user, loading } = useRequireAuth('headhunter');
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
    <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
            My Saved Jobs
          </h1>
          <p className="text-muted-foreground">Jobs you've bookmarked for later</p>
        </div>

        {savedJobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No saved jobs yet</p>
              <Button onClick={() => navigate('/opportunities')}>
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {savedJobs.map((savedJob) => (
              <Card key={savedJob.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => navigate(`/jobs/${savedJob.job.id}`, { state: { from: 'saved' } })}
                    >
                      <CardTitle className="text-2xl opacity-90 mb-2">
                        {savedJob.job?.title}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap gap-4 text-base">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {savedJob.job.employer?.company_name || savedJob.job.employer?.name}
                        </span>
                        {savedJob.job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {savedJob.job.location}
                          </span>
                        )}
                        {savedJob.job.employment_type && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {savedJob.job.employment_type}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnsave(savedJob.id, savedJob.job?.title)}
                      className="text-[hsl(var(--accent-pink))]"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {savedJob.job.description && (
                      <p className="text-muted-foreground line-clamp-2">
                        {savedJob.job.description}
                      </p>
                    )}
                    {savedJob.job.skills_must && savedJob.job.skills_must.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {savedJob.job.skills_must.slice(0, 6).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="opacity-90">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-muted-foreground">
                        Saved {new Date(savedJob.created_at).toLocaleDateString()}
                      </p>
                      <Button 
                        onClick={() => navigate(`/jobs/${savedJob.job.id}`, { state: { from: 'saved' } })}
                        className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90 opacity-95"
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
