import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Briefcase, Users, TrendingUp, Shield, Clock, Award, Bot, Sparkles, Target, BarChart3, Search, FileText, DollarSign, MessageSquare } from 'lucide-react';
import { FeaturedHeadhunters } from '@/components/FeaturedHeadhunters';
import { HotOpportunities } from '@/components/HotOpportunities';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import dashboardPreview from '@/assets/dashboard-preview.jpg';
const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    profile
  } = useAuth();
  const handleEmployerCTA = () => {
    if (!user) {
      navigate('/auth?role=employer');
    } else if (profile?.role === 'employer') {
      navigate('/dashboard/employer');
    } else {
      alert("You're signed in as a Headhunter. Please log out to switch roles.");
    }
  };
  const handleHeadhunterCTA = () => {
    if (!user) {
      navigate('/auth?role=headhunter');
    } else if (profile?.role === 'headhunter') {
      navigate('/dashboard/headhunter');
    } else {
      alert("You're signed in as an Employer. Please log out to switch roles.");
    }
  };
  return <div className="min-h-screen bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 md:py-32 py-[65px]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] text-sm font-semibold mb-6">
              <Award className="h-4 w-4" />
              Trusted by leading companies
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            Find the perfect
            <span className="block bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
              headhunter match
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Connect employers with expert headhunters. Post jobs, receive curated candidates, and scale your hiring effortlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button size="lg" variant="hero" onClick={handleEmployerCTA} className="w-full sm:w-auto">
              <Briefcase className="mr-2 h-5 w-5" />
              I'm an Employer
            </Button>
            <Button size="lg" variant="mint" onClick={handleHeadhunterCTA} className="w-full sm:w-auto">
              <Users className="mr-2 h-5 w-5" />
              I'm a Headhunter
            </Button>
          </div>
        </div>
      </section>

      {/* Dashboard Showcase */}
      

      {/* Featured Headhunters */}
      <FeaturedHeadhunters />

      {/* Hot Opportunities */}
      <HotOpportunities />

      {/* AI-Powered Features */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-br from-[hsl(var(--accent-pink)/0.1)] via-[hsl(var(--accent-mint)/0.1)] to-[hsl(var(--accent-lilac)/0.1)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] text-sm font-semibold mb-6">
              <Bot className="h-4 w-4" />
              AI-Powered Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Intelligent Hiring,
              <span className="block bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our advanced AI technology streamlines every step of the hiring process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* For Employers */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">For Employers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[hsl(var(--accent-pink))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">AI Job Description Optimizer</h4>
                    <p className="text-xs text-muted-foreground">Auto-enhances wording and adds missing skills</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-[hsl(var(--accent-pink))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Smart Headhunter Matching</h4>
                    <p className="text-xs text-muted-foreground">Suggests the best headhunters by field & success rate</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-[hsl(var(--accent-pink))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">AI Candidate Fit Score</h4>
                    <p className="text-xs text-muted-foreground">Ranks submissions by quality & relevance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-[hsl(var(--accent-pink))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Hiring Insights Dashboard</h4>
                    <p className="text-xs text-muted-foreground">Shows time-to-hire, market salary ranges, and trends</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Headhunters */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">For Headhunters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-[hsl(var(--accent-mint))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">AI Sourcing Assistant</h4>
                    <p className="text-xs text-muted-foreground">Builds Boolean searches & suggests candidate pools</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[hsl(var(--accent-mint))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Smart Proposal Generator</h4>
                    <p className="text-xs text-muted-foreground">Drafts personalized pitches for job openings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[hsl(var(--accent-mint))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">AI Candidate Summarizer</h4>
                    <p className="text-xs text-muted-foreground">Auto-summarizes CVs into quick, clear profiles</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For the Marketplace */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-lilac))] to-[hsl(var(--accent-pink))] flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">For the Marketplace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-[hsl(var(--accent-lilac))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Performance Prediction</h4>
                    <p className="text-xs text-muted-foreground">Forecasts success rates of jobs & headhunters</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-[hsl(var(--accent-lilac))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Dynamic Fee Optimization</h4>
                    <p className="text-xs text-muted-foreground">Adjusts suggested success fees by demand & role type</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-[hsl(var(--accent-lilac))] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Chat Assistant</h4>
                    <p className="text-xs text-muted-foreground">Writes follow-ups, summaries, and coordination messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Value Props */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* For Employers */}
          <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-foreground" />
                </div>
                For Employers
              </CardTitle>
              <CardDescription className="text-base">
                Access vetted headhunters who deliver quality candidates fast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-[hsl(var(--accent-pink))] mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Quality Matches</h4>
                  <p className="text-sm text-muted-foreground">Get 3-5 pre-vetted candidates per role from specialized recruiters</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[hsl(var(--accent-pink))] mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Fast Hiring</h4>
                  <p className="text-sm text-muted-foreground">Fill positions in 7-14 days with clear SLAs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[hsl(var(--accent-pink))] mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Pay on Results</h4>
                  <p className="text-sm text-muted-foreground">Success-based pricing - only pay when you hire</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* For Headhunters */}
          <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] flex items-center justify-center">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                For Headhunters
              </CardTitle>
              <CardDescription className="text-base">
                Access quality job opportunities and grow your recruiting business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-[hsl(var(--accent-mint))] mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Premium Jobs</h4>
                  <p className="text-sm text-muted-foreground">Browse vetted roles from verified employers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-[hsl(var(--accent-mint))] mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Transparent Terms</h4>
                  <p className="text-sm text-muted-foreground">Clear fee structures and payment terms upfront</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-[hsl(var(--accent-mint))] mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Build Reputation</h4>
                  <p className="text-sm text-muted-foreground">Earn reviews and showcase your track record</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-[hsl(var(--accent-pink))] via-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Ready to get started?
            </h2>
            <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of employers and headhunters who are transforming their hiring process
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="default" onClick={handleEmployerCTA}>
                Post Your First Job
              </Button>
              <Button size="lg" variant="outline" onClick={handleHeadhunterCTA} className="bg-white hover:bg-white/90">
                Browse Opportunities
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>;
};
export default Index;