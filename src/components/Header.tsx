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
    <header className="fixed top-4 left-0 right-0 z-[100] px-4 sm:px-6">
      <div 
        className={`relative max-w-[1400px] mx-auto rounded-full backdrop-blur-md bg-background/70 shadow-lg transition-all duration-300 ${
          isScrolled 
            ? 'h-[56px] sm:h-[60px] bg-background/80' 
            : 'h-[64px] sm:h-[72px] bg-background/70'
        }`}
        style={{
          border: '2px solid transparent',
          backgroundImage: `
            linear-gradient(hsl(var(--background)), hsl(var(--background))),
            linear-gradient(135deg, hsl(var(--accent-mint)), hsl(var(--accent-lilac)), hsl(var(--accent-pink)))
          `,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        <div className="h-full px-6 sm:px-8 flex items-center justify-between gap-4">
          {/* Left side - Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition shrink-0 z-10">
            <Briefcase className={`transition-all duration-300 ${isScrolled ? 'h-5 w-5' : 'h-6 w-6'}`} />
            <span className={`font-bold whitespace-nowrap transition-all duration-300 ${isScrolled ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>HUNTORIX</span>
          </Link>

          {/* Center - Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link 
              to={user ? getDashboardPath() : '/auth'} 
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                isActive('/dashboard') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/opportunities" 
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                isActive('/opportunities') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Opportunities
            </Link>
            <Link 
              to="/headhunters" 
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                isActive('/headhunters') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Headhunters
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
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
          <div className="flex items-center gap-2 shrink-0 z-10">
            {user && profile ? (
              <TooltipProvider delayDuration={0}>
                <div className="flex items-center gap-1">
                  {/* Mobile Menu */}
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" aria-label="Open menu">
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
                            Headhunters
                          </Link>
                          <Link 
                            to="/messages" 
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <MessagesSquare className="h-5 w-5 text-muted-foreground" />
                            Messages
                          </Link>
                        </div>
                      </nav>
                    </SheetContent>
                  </Sheet>

                  <div className="hidden lg:flex items-center gap-1">
                    <NotificationDropdown />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate('/messages')}
                          className="h-9 w-9"
                        >
                          <MessagesSquare className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Messages</TooltipContent>
                    </Tooltip>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:opacity-80 transition">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback className="text-sm">
                            {profile.name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
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
                </div>
              </TooltipProvider>
            ) : (
              <>
                {/* Mobile Menu for non-logged in users */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" aria-label="Open menu">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] sm:w-[340px]">
                    <nav className="flex flex-col gap-1 mt-8">
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
                        Headhunters
                      </Link>
                    </nav>
                  </SheetContent>
                </Sheet>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/auth?mode=signin')}
                    className="text-sm px-4 h-9 hidden sm:flex"
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => navigate('/auth?mode=signup')}
                    className="text-sm px-4 h-9 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium"
                  >
                    Sign up →
                  </Button>
                </div>
              </>
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
