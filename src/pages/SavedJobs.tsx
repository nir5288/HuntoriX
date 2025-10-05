import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Briefcase, TrendingUp, DollarSign, Calendar, ArrowLeft, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/DashboardLayout';

const SavedJobs = () => {
  const { user, profile, loading } = useRequireAuth();
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
    <DashboardLayout>
      <div className="container px-6 py-6 max-w-7xl">
        {/* Header Section with Stats */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(profile?.role === 'employer' ? '/employer-dashboard' : '/headhunter-dashboard')}
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
                My Saved Jobs
              </h1>
              <p className="text-sm text-muted-foreground">Jobs you've bookmarked for later</p>
            </div>
            <Card className="bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 to-[hsl(var(--accent-lilac))]/10 border-[hsl(var(--accent-pink))]/20">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-[hsl(var(--accent-pink))] fill-current" />
                  <div>
                    <p className="text-xl font-bold">{savedJobs.length}</p>
                    <p className="text-xs text-muted-foreground">Saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {savedJobs.length === 0 ? (
          <Card className="border-dashed border-2 hover:border-[hsl(var(--accent-mint))] transition-colors">
            <CardContent className="text-center py-12">
              <div className="inline-block p-3 rounded-full bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 to-[hsl(var(--accent-lilac))]/10 mb-3">
                <Heart className="h-12 w-12 text-[hsl(var(--accent-pink))] opacity-50" />
              </div>
              <h3 className="text-base font-semibold mb-1.5">No saved jobs yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start building your collection of dream opportunities</p>
              <Button 
                size="sm"
                onClick={() => navigate('/opportunities')}
                className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90"
              >
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {savedJobs.map((savedJob, index) => {
              const isMyJob = savedJob.job.created_by === user?.id;
              return (
                <Card 
                  key={savedJob.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div 
                        className="flex-1 cursor-pointer group" 
                        onClick={() => navigate(`/jobs/${savedJob.job.id}`, { state: { from: 'saved' } })}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base group-hover:text-[hsl(var(--accent-mint))] transition-colors">
                            {savedJob.job?.title}
                          </CardTitle>
                          {savedJob.job?.job_id_number && (
                            <Badge variant="outline" className="text-xs h-5">
                              #{savedJob.job?.job_id_number}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {savedJob.job.employer?.company_name || savedJob.job.employer?.name} • {savedJob.job.location}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isMyJob && profile?.role === 'employer' && (
                          <div className="relative">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/headhunters');
                              }}
                              className="h-7 text-xs px-2 gap-1.5"
                              title="Invite headhunters to this job"
                            >
                              <Users className="h-3 w-3" />
                              Invite
                            </Button>
                            <Badge className="absolute -top-1.5 -right-1.5 bg-[hsl(var(--accent-pink))] text-white text-[10px] h-4 px-1">
                              New
                            </Badge>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnsave(savedJob.id, savedJob.job?.title)}
                          className="h-7 w-7 text-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))]/10"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {savedJob.job.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {savedJob.job.description}
                      </p>
                    )}
                    {savedJob.job.skills_must && savedJob.job.skills_must.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {savedJob.job.skills_must.slice(0, 2).map((skill: string, idx: number) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs bg-gradient-to-r from-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Saved {new Date(savedJob.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/jobs/${savedJob.job.id}`, { state: { from: 'saved' } })}
                        className="h-7 text-xs bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90"
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SavedJobs;
