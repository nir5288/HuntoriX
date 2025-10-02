import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { CheckCircle2, UserCircle, Briefcase, MessageSquare, TrendingUp } from 'lucide-react';

interface WelcomeScreenProps {
  userName: string;
  onComplete: () => void;
}

export function WelcomeScreen({ userName, onComplete }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: CheckCircle2,
      title: "Welcome to Headhunter Network!",
      description: `Hi ${userName}! Your email has been verified. Let's get you started on your journey to connect with top employers.`,
    },
    {
      icon: UserCircle,
      title: "Complete Your Profile",
      description: "Add your expertise, skills, and experience to stand out to employers and get better opportunities.",
    },
    {
      icon: Briefcase,
      title: "Browse Opportunities",
      description: "Explore exclusive job opportunities from leading companies looking for talent like you.",
    },
    {
      icon: MessageSquare,
      title: "Connect & Apply",
      description: "Apply to opportunities, message employers directly, and build your professional network.",
    },
    {
      icon: TrendingUp,
      title: "Grow Your Success",
      description: "Track your applications, build your reputation, and grow your placement success rate.",
    },
  ];

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, steps.length]);

  const handleGetStarted = () => {
    onComplete();
    navigate('/settings');
  };

  const handleSkip = () => {
    onComplete();
    navigate('/opportunities');
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <CurrentIcon className="w-16 h-16 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {steps[currentStep].title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            {steps[currentStep].description}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : index < currentStep
                  ? 'w-2 bg-primary/50'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {currentStep === steps.length - 1 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="text-lg px-8"
            >
              Complete Your Profile
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleSkip}
              className="text-lg px-8"
            >
              Skip for Now
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
