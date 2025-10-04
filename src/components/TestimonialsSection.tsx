import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    name: "Sarah Chen",
    role: "HR Director",
    rating: 5,
    text: "Huntorix transformed our hiring process. We filled 3 senior positions in just 2 weeks with top-tier candidates. The AI matching is incredibly accurate!",
    initials: "SC"
  },
  {
    name: "Michael Torres",
    role: "Headhunter",
    rating: 5,
    text: "Best platform I've used in 15 years of recruiting. The AI tools help me find perfect candidates faster, and payments are always on time.",
    initials: "MT"
  },
  {
    name: "Emily Roberts",
    role: "Startup Founder",
    rating: 5,
    text: "As a small startup, we couldn't afford big recruiting agencies. Huntorix gave us access to expert headhunters at a fraction of the cost.",
    initials: "ER"
  },
  {
    name: "James Park",
    role: "Tech Recruiter",
    rating: 5,
    text: "The AI candidate summarizer saves me hours every week. I can review 50+ CVs in the time it used to take me to read 10.",
    initials: "JP"
  },
  {
    name: "Lisa Anderson",
    role: "VP of Operations",
    rating: 5,
    text: "We've cut our time-to-hire by 60% since switching to Huntorix. The quality of candidates has been exceptional.",
    initials: "LA"
  },
  {
    name: "David Kim",
    role: "Senior Headhunter",
    rating: 5,
    text: "Finally, a platform that respects headhunters! Fair fees, great job opportunities, and the AI tools actually help me do better work.",
    initials: "DK"
  }
];

const TestimonialCard = ({ name, role, rating, text, initials }: typeof testimonials[0]) => (
  <Card className="min-w-[400px] bg-[hsl(var(--accent-ink))]/50 border-white/10 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12 border-2 border-vibrant-pink/50">
          <AvatarFallback className="bg-gradient-to-br from-vibrant-pink to-vibrant-lilac text-white font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold text-white">{name}</h4>
          <p className="text-sm text-white/60">{role}</p>
        </div>
      </div>
      <div className="flex gap-1 mb-3">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-vibrant-mint text-vibrant-mint" />
        ))}
      </div>
      <p className="text-white/80 text-sm leading-relaxed">{text}</p>
    </CardContent>
  </Card>
);

export const TestimonialsSection = () => {
  return (
    <section className="relative py-20 bg-gradient-to-b from-background via-[#0a0a0f] to-background overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-vibrant-mint/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-vibrant-pink/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10">
        <div className="text-center mb-16 px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Huntorix. Received <Star className="inline h-8 w-8 fill-vibrant-mint text-vibrant-mint" /> 4.9/5 Stars
          </h2>
          <p className="text-xl text-white/70">in Over 10,000+ Reviews</p>
        </div>

        {/* Top row - scrolling left */}
        <div className="relative mb-6 overflow-hidden">
          <div className="flex gap-6 animate-scroll-left">
            {[...testimonials, ...testimonials].map((testimonial, idx) => (
              <TestimonialCard key={`top-${idx}`} {...testimonial} />
            ))}
          </div>
        </div>

        {/* Bottom row - scrolling right */}
        <div className="relative overflow-hidden">
          <div className="flex gap-6 animate-scroll-right">
            {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((testimonial, idx) => (
              <TestimonialCard key={`bottom-${idx}`} {...testimonial} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
