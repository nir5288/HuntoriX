import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Executives() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--accent-lilac))] to-[hsl(var(--accent-mint))]">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-[hsl(var(--vibrant-pink))] via-[hsl(var(--vibrant-lilac))] to-[hsl(var(--vibrant-mint))] shadow-2xl mb-8">
            <Lock className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[hsl(var(--vibrant-pink))] via-[hsl(var(--vibrant-lilac))] to-[hsl(var(--vibrant-mint))] bg-clip-text text-transparent">
            Executive Suite
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Premium executive search and C-level placement services
          </p>
          
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-transparent shadow-xl">
            <div className="space-y-4">
              <div className="inline-flex px-4 py-2 rounded-full bg-gradient-to-r from-[hsl(var(--vibrant-pink))] via-[hsl(var(--vibrant-lilac))] to-[hsl(var(--vibrant-mint))] text-white font-bold text-sm">
                Coming Soon
              </div>
              
              <h2 className="text-2xl font-bold">Exclusive Access</h2>
              
              <p className="text-muted-foreground">
                Our executive placement service is currently in development. 
                Get ready for premium C-level and executive search capabilities.
              </p>
              
              <ul className="text-left space-y-3 py-4">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">💼</span>
                  <span>Confidential executive search</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <span>C-suite and board placements</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🤝</span>
                  <span>Dedicated account management</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <span>Priority matching and vetting</span>
                </li>
              </ul>
              
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-[hsl(var(--vibrant-pink))] via-[hsl(var(--vibrant-lilac))] to-[hsl(var(--vibrant-mint))] text-white font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Join Waitlist
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
