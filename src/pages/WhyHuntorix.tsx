import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Users, Globe, TrendingUp, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WhyHuntorix = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Curated Talent Network',
      description: 'Access to pre-vetted, high-quality headhunters specializing in diverse industries and roles.',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Connect with top talent and opportunities worldwide, breaking geographical barriers.',
    },
    {
      icon: TrendingUp,
      title: 'Data-Driven Matching',
      description: 'AI-powered algorithms ensure the perfect match between employers and headhunters.',
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'Built-in verification, ratings, and transparent communication for trust and safety.',
    },
    {
      icon: Zap,
      title: 'Fast & Efficient',
      description: 'Streamlined workflows reduce time-to-hire and accelerate your recruitment process.',
    },
  ];

  const benefits = {
    employers: [
      'Post unlimited job opportunities',
      'Access a network of specialized headhunters',
      'Review applications with detailed candidate profiles',
      'Direct messaging with headhunters',
      'Track hiring progress in real-time',
      'Transparent pricing with flexible plans',
    ],
    headhunters: [
      'Discover exclusive job opportunities',
      'Showcase your expertise and track record',
      'Build your professional reputation with ratings',
      'Flexible application credits system',
      'Direct communication with employers',
      'Global opportunities in diverse industries',
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-[hsl(var(--surface))] to-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="site-container py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[hsl(var(--accent-mint))] via-[hsl(var(--accent-lilac))] to-[hsl(var(--accent-pink))] bg-clip-text text-transparent">
              Why Choose Huntorix?
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              The modern platform connecting employers with professional headhunters to build exceptional teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/auth?role=employer')}
                className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950"
              >
                For Employers
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth?role=headhunter')}
              >
                For Headhunters
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="site-container py-16 bg-[hsl(var(--surface))]/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              What Makes Us Different
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border-2 hover:border-[hsl(var(--accent-mint))] transition-all">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[hsl(var(--accent-mint))] to-[hsl(var(--accent-lilac))] flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="site-container py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Built For Your Success
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* For Employers */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold mb-6 text-[hsl(var(--accent-pink))]">
                    For Employers
                  </h3>
                  <ul className="space-y-3">
                    {benefits.employers.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[hsl(var(--accent-mint))] mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950"
                    onClick={() => navigate('/auth?role=employer')}
                  >
                    Get Started as Employer
                  </Button>
                </CardContent>
              </Card>

              {/* For Headhunters */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold mb-6 text-[hsl(var(--accent-lilac))]">
                    For Headhunters
                  </h3>
                  <ul className="space-y-3">
                    {benefits.headhunters.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[hsl(var(--accent-mint))] mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6"
                    variant="outline"
                    onClick={() => navigate('/auth?role=headhunter')}
                  >
                    Get Started as Headhunter
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="site-container py-16 bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 via-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of employers and headhunters building better teams together.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] hover:opacity-90 text-slate-950"
            >
              Get Started Today
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WhyHuntorix;
