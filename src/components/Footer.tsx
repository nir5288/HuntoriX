import { Link } from 'react-router-dom';
import { Bot, Shield, Award, Lock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t bg-surface/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Huntorix</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered headhunter marketplace connecting employers with top talent.
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] text-xs font-semibold">
                <Bot className="h-3.5 w-3.5" />
                AI Powered
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold">
                <Shield className="h-3.5 w-3.5" />
                Verified
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold">
                <Lock className="h-3.5 w-3.5" />
                Secure
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold">
                <Award className="h-3.5 w-3.5" />
                Trusted
              </div>
            </div>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Employers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard/employer" className="hover:text-foreground transition-colors">Post a Job</Link></li>
              <li><Link to="/headhunters" className="hover:text-foreground transition-colors">Find Headhunters</Link></li>
              <li><Link to="/my-jobs" className="hover:text-foreground transition-colors">Manage Jobs</Link></li>
            </ul>
          </div>

          {/* For Headhunters */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Headhunters</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/opportunities" className="hover:text-foreground transition-colors">Browse Jobs</Link></li>
              <li><Link to="/applications" className="hover:text-foreground transition-colors">My Applications</Link></li>
              <li><Link to="/saved-jobs" className="hover:text-foreground transition-colors">Saved Jobs</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/accessibility" className="hover:text-foreground transition-colors">Accessibility</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Huntorix. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Bot className="h-4 w-4" />
            <span>Powered by advanced AI technology</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
