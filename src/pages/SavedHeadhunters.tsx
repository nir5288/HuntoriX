import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useRequireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Briefcase, Star, ArrowLeft, Award, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SavedHeadhunters = () => {
  const { user, loading } = useRequireAuth('employer');
  const navigate = useNavigate();
  const [savedHeadhunters, setSavedHeadhunters] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      fetchSavedHeadhunters();
    }
  }, [user, loading]);

  const fetchSavedHeadhunters = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_headhunters')
        .select('*, headhunter:profiles!saved_headhunters_headhunter_id_fkey(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedHeadhunters(data || []);
    } catch (error) {
      console.error('Error fetching saved headhunters:', error);
      toast.error('Failed to load saved headhunters');
    } finally {
      setLoadingData(false);
    }
  };

  const handleUnsave = async (savedId: string, headhunterName: string) => {
    try {
      const { error } = await supabase
        .from('saved_headhunters')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      setSavedHeadhunters(savedHeadhunters.filter(sh => sh.id !== savedId));
      toast.success(`Removed "${headhunterName}" from saved headhunters`);
    } catch (error) {
      console.error('Error removing saved headhunter:', error);
      toast.error('Failed to remove headhunter');
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
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/employer')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header Section with Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent animate-fade-in">
                My Saved Headhunters
              </h1>
              <p className="text-muted-foreground">Headhunters you've bookmarked for collaboration</p>
            </div>
            <Card className="bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 to-[hsl(var(--accent-lilac))]/10 border-[hsl(var(--accent-pink))]/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-[hsl(var(--accent-pink))] fill-current" />
                  <div>
                    <p className="text-3xl font-bold">{savedHeadhunters.length}</p>
                    <p className="text-sm text-muted-foreground">Saved Headhunters</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {savedHeadhunters.length === 0 ? (
          <Card className="border-dashed border-2 hover:border-[hsl(var(--accent-mint))] transition-colors">
            <CardContent className="text-center py-16">
              <div className="inline-block p-4 rounded-full bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 to-[hsl(var(--accent-lilac))]/10 mb-4">
                <Heart className="h-16 w-16 text-[hsl(var(--accent-pink))] opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No saved headhunters yet</h3>
              <p className="text-muted-foreground mb-6">Start building your network of top headhunters</p>
              <Button 
                onClick={() => navigate('/headhunters')}
                className="bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90"
              >
                Browse Headhunters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedHeadhunters.map((saved, index) => (
              <Card 
                key={saved.id} 
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-[hsl(var(--accent-mint))] animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="bg-gradient-to-r from-[hsl(var(--accent-mint))]/5 to-transparent">
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-1 cursor-pointer group" 
                      onClick={() => navigate(`/profile/headhunter/${saved.headhunter.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={saved.headhunter.avatar_url} />
                          <AvatarFallback>
                            {saved.headhunter.name?.[0]?.toUpperCase() || 'H'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl group-hover:text-[hsl(var(--accent-mint))] transition-colors">
                            {saved.headhunter.name}
                          </CardTitle>
                          {saved.headhunter.verified && (
                            <Badge className="bg-[hsl(var(--accent-mint))]/20 text-foreground border-0 mt-1">
                              <Award className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnsave(saved.id, saved.headhunter.name)}
                      className="text-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))]/10 hover:scale-110 transition-transform"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {saved.headhunter.bio && (
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                        {saved.headhunter.bio}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      {saved.headhunter.placements_count !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
                          <span className="text-muted-foreground">
                            {saved.headhunter.placements_count} placements
                          </span>
                        </div>
                      )}
                      {saved.headhunter.rating_avg !== null && saved.headhunter.rating_avg > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-4 w-4 text-[hsl(var(--warning))] fill-current" />
                          <span className="text-muted-foreground">
                            {Number(saved.headhunter.rating_avg).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {saved.headhunter.industries && saved.headhunter.industries.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {saved.headhunter.industries.slice(0, 3).map((industry: string, idx: number) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs bg-gradient-to-r from-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10"
                          >
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Location */}
                    {saved.headhunter.location && (
                      <div className="flex items-center gap-2 text-sm pt-2 border-t">
                        <MapPin className="h-4 w-4 text-[hsl(var(--accent-lilac))]" />
                        <span className="text-muted-foreground">{saved.headhunter.location}</span>
                      </div>
                    )}

                    <Button 
                      onClick={() => navigate(`/profile/headhunter/${saved.headhunter.id}`)}
                      className="w-full bg-gradient-to-r from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] hover:opacity-90"
                    >
                      View Profile
                    </Button>
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

export default SavedHeadhunters;
