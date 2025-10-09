import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth';
import { Briefcase, LogOut, LayoutDashboard, Settings, MessagesSquare, User, Heart, Moon, Sun, Circle, Star, Shield, BarChart3, FileText, Crown, Menu, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SwitchRoleModal } from './SwitchRoleModal';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ManageBannersModal } from './ManageBannersModal';
import EditLegalDocumentModal from './EditLegalDocumentModal';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { status, setStatus } = useUserPreferences();
  const { isAdmin } = useIsAdmin();
  const [showManageBanners, setShowManageBanners] = useState(false);
  const [showEditLegal, setShowEditLegal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<{ name: string; price_usd: number } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [switchRoleModal, setSwitchRoleModal] = useState<{
    open: boolean;
    currentRole: 'employer' | 'headhunter';
    targetRole: 'employer' | 'headhunter';
  }>({
    open: false,
    currentRole: 'headhunter',
    targetRole: 'employer',
  });

  // Scroll detection for header size change
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 40);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch subscription plan for headhunters
  useEffect(() => {
    if (user && profile?.role === 'headhunter') {
      fetchCurrentPlan();
    }
  }, [user, profile]);

  const fetchCurrentPlan = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_plans (
            name,
            price_usd
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.subscription_plans) {
        setCurrentPlan(data.subscription_plans as { name: string; price_usd: number });
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    }
  };

  const handleForEmployers = () => {
    if (!user) {
      navigate('/auth?role=employer');
    } else if (profile?.role === 'employer') {
      navigate('/dashboard/employer');
    } else {
      setSwitchRoleModal({
        open: true,
        currentRole: 'headhunter',
        targetRole: 'employer',
      });
    }
  };

  const handleForHeadhunters = () => {
    if (!user) {
      navigate('/auth?role=headhunter');
    } else if (profile?.role === 'headhunter') {
      navigate('/dashboard/headhunter');
    } else {
      setSwitchRoleModal({
        open: true,
        currentRole: 'employer',
        targetRole: 'headhunter',
      });
    }
  };

  const getDashboardPath = () => {
    if (profile?.role === 'employer') return '/dashboard/employer';
    if (profile?.role === 'headhunter') return '/dashboard/headhunter';
    return '/';
  };

  const getProfilePath = () => {
    if (!user) return '/';
    if (profile?.role === 'employer') return `/profile/employer/${user.id}`;
    if (profile?.role === 'headhunter') return `/profile/headhunter/${user.id}`;
    return '/';
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getNavLinkClass = (path: string) => {
    return `text-sm font-medium transition-colors ${
      isActive(path) 
        ? 'text-primary font-bold' 
        : 'text-muted-foreground hover:text-primary'
    }`;
  };

  return (
    <header className="fixed top-4 left-0 right-0 z-[100] px-4 sm:px-6 md:px-8">
      <div 
        className={`max-w-[1440px] mx-auto rounded-3xl backdrop-blur-xl bg-background/60 border-2 shadow-lg transition-all duration-300 ${
          isScrolled 
            ? 'h-14 sm:h-[60px] md:h-[72px] bg-background/80' 
            : 'h-16 sm:h-[72px] md:h-24 bg-background/60'
        }`}
        style={{
          borderImage: 'linear-gradient(135deg, hsl(var(--accent-mint)), hsl(var(--accent-lilac)), hsl(var(--accent-pink))) 1',
        }}
      >
        <div className="h-full px-4 sm:px-6 md:px-8 flex items-center justify-between gap-4">
          {/* Left side - Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition shrink-0">
            <Briefcase className={`transition-all duration-300 ${isScrolled ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-6 w-6 sm:h-7 sm:w-7'}`} />
            <span className={`font-bold whitespace-nowrap transition-all duration-300 ${isScrolled ? 'text-base sm:text-lg md:text-xl' : 'text-lg sm:text-xl md:text-2xl'}`}>HUNTORIX</span>
          </Link>

          {/* Center - Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-6 absolute left-1/2 -translate-x-1/2">
            <Link 
              to={user ? getDashboardPath() : '/auth'} 
              className={`${getNavLinkClass('/dashboard')} text-xs lg:text-sm transition-all duration-300`}
            >
              Dashboard
            </Link>
            <Link to="/opportunities" className={`${getNavLinkClass('/opportunities')} text-xs lg:text-sm transition-all duration-300`}>
              Opportunities
            </Link>
            <Link to="/headhunters" className={`${getNavLinkClass('/headhunters')} text-xs lg:text-sm transition-all duration-300`}>
              Headhunters
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-xs lg:text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                More <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => navigate('/huntrank')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  HuntRank
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Soon</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/huntbase')}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  HuntBase
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Soon</Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Menu for < md */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[340px]">
                <nav className="flex flex-col gap-1 mt-8">
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">MAIN MENU</p>
                    <Link 
                      to={user ? getDashboardPath() : '/auth'} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                      Dashboard
                    </Link>
                    <Link 
                      to="/opportunities" 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Star className="h-5 w-5 text-muted-foreground" />
                      Opportunities
                    </Link>
                    <Link 
                      to="/headhunters" 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 text-muted-foreground" />
                      Find a Headhunter
                    </Link>
                    {user && (
                      <Link 
                        to="/messages" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <MessagesSquare className="h-5 w-5 text-muted-foreground" />
                        Messages
                      </Link>
                    )}
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">COMING SOON</p>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-50 cursor-not-allowed text-sm font-medium">
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                      HuntRank
                      <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0">Soon</Badge>
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {user && profile ? (
              <TooltipProvider delayDuration={0}>
                <div className="hidden sm:flex items-center gap-1">
                  <NotificationDropdown />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/messages')}
                        className={`transition-all duration-300 ${isScrolled ? 'h-8 w-8' : 'h-9 w-9'}`}
                      >
                        <MessagesSquare className={`transition-all duration-300 ${isScrolled ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Messages</TooltipContent>
                  </Tooltip>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 hover:opacity-80 transition">
                      <div className="relative">
                        <Avatar className={`transition-all duration-300 ${isScrolled ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-9 w-9 sm:h-10 sm:w-10'}`}>
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback className="text-sm">
                            {profile.name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                          status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className={`font-medium truncate max-w-[120px] transition-all duration-300 ${isScrolled ? 'text-xs' : 'text-sm'}`}>{profile.name || profile.email}</span>
                        <Badge variant="outline" className={`capitalize transition-all duration-300 ${isScrolled ? 'text-[10px]' : 'text-xs'}`}>
                          {profile.role}
                        </Badge>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Dark Mode Toggle */}
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="flex items-center gap-2 cursor-pointer">
                      {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <span className="text-sm">Dark Mode</span>
                    </Label>
                    <Switch
                      id="dark-mode"
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Status Selector */}
                <div className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                      <button
                        onClick={() => setStatus('online')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          status === 'online' 
                            ? 'bg-background shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Circle className={`h-2.5 w-2.5 ${status === 'online' ? 'fill-green-500 text-green-500' : 'fill-muted text-muted'}`} />
                        Online
                      </button>
                      <button
                        onClick={() => setStatus('away')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          status === 'away' 
                            ? 'bg-background shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Circle className={`h-2.5 w-2.5 ${status === 'away' ? 'fill-yellow-500 text-yellow-500' : 'fill-muted text-muted'}`} />
                        Away
                      </button>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Subscription Plan - Only for headhunters */}
                {profile?.role === 'headhunter' && currentPlan && (
                  <>
                    <div className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Plan:</span>
                        <button
                          onClick={() => navigate('/settings')}
                          className="flex items-center gap-1.5 hover:opacity-80 transition"
                        >
                          <span className={`text-sm font-medium ${currentPlan.name === 'Huntorix' ? 'underline' : ''}`}>
                            {currentPlan.name}
                          </span>
                          {currentPlan.name === 'Huntorix' && (
                            <Crown className="h-3.5 w-3.5 text-yellow-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={() => navigate(getDashboardPath())}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(getProfilePath())}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setShowManageBanners(true)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Banners
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/job-approvals')}>
                          <FileText className="mr-2 h-4 w-4" />
                          Job Approvals
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/hold-reasons')}>
                          <FileText className="mr-2 h-4 w-4" />
                          Hold Reasons
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowEditLegal(true)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Edit Legal Documents
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/ai-analytics')}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          AI Analytics
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  // Clear persisted sidebar state on logout
                  document.cookie = "sidebar_state=; path=/; max-age=0";
                  document.cookie = "sidebar:state=; path=/; max-age=0";
                  signOut();
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/auth?mode=signin')}
                  className={`transition-all duration-300 ${isScrolled ? 'text-xs px-2 h-8' : 'text-sm px-3 h-9'}`}
                >
                  Login
                </Button>
                <Button 
                  variant="hero" 
                  size="sm"
                  onClick={() => navigate('/auth?mode=signup')}
                  className={`transition-all duration-300 ${isScrolled ? 'text-xs px-3 h-8' : 'text-sm px-4 h-9'}`}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SwitchRoleModal
        open={switchRoleModal.open}
        onOpenChange={(open) => setSwitchRoleModal({ ...switchRoleModal, open })}
        currentRole={switchRoleModal.currentRole}
        targetRole={switchRoleModal.targetRole}
      />
      
      {isAdmin && (
        <>
          <ManageBannersModal
            open={showManageBanners}
            onOpenChange={setShowManageBanners}
          />
          <EditLegalDocumentModal
            open={showEditLegal}
            onOpenChange={setShowEditLegal}
          />
        </>
      )}
    </header>
  );
}
