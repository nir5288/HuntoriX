import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth';
import { Briefcase, LogOut, LayoutDashboard, Settings, MessagesSquare, User, Heart, Moon, Sun, Globe, Circle, Star, Shield, BarChart3, FileText, Crown, Menu, ArrowRight, Coins, AlertCircle, X } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [credits, setCredits] = useState<{ 
    total: number; 
    used: number; 
    remaining: number;
    resetDate?: Date;
    nextPlan?: string;
    changeDate?: Date;
  } | null>(null);
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

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch subscription plan and credits for headhunters
  useEffect(() => {
    if (user && profile?.role === 'headhunter') {
      fetchCurrentPlan();
      fetchCredits();
      
      // Set up realtime subscription for credit updates
      const channel = supabase
        .channel('user-subscriptions-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Refetch credits when subscription is updated
            fetchCredits();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
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

  const fetchCredits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_credits', { p_user_id: user.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const creditData = data[0];
        setCredits({
          total: creditData.total_credits,
          used: creditData.credits_used,
          remaining: creditData.credits_remaining,
          resetDate: creditData.credits_reset_at ? new Date(creditData.credits_reset_at) : undefined,
          nextPlan: creditData.plan_will_change ? creditData.next_plan_name : undefined,
          changeDate: creditData.plan_change_date ? new Date(creditData.plan_change_date) : undefined,
        });
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
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

  const isHomepage = location.pathname === '/';
  
  return (
    <>
      {/* Pending downgrade banner */}
      {user && profile?.role === 'headhunter' && credits?.nextPlan && credits?.changeDate && (
        <div className="fixed top-0 left-0 right-0 z-[101] bg-gradient-to-r from-yellow-500/10 via-yellow-600/10 to-orange-500/10 border-b border-yellow-500/20 backdrop-blur-sm">
          <div className="site-container">
            <Alert className="border-0 bg-transparent py-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertDescription className="ml-2 flex items-center justify-between flex-1">
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your plan will change to <strong>{credits.nextPlan}</strong> on{' '}
                  <strong>
                    {credits.changeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </strong>
                  . You'll keep your current credits until then.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/plans')}
                  className="text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 font-medium shrink-0 ml-4"
                >
                  Upgrade Now
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      
      <header className={`${isHomepage ? 'fixed' : 'relative'} ${credits?.nextPlan ? 'top-12' : 'top-0'} left-0 right-0 z-[100] pt-3 sm:pt-4 md:pt-6`}>
        {/* Floating pill-shaped header with gradient border */}
        <div className="site-container">
          <div 
            className="relative rounded-full h-16 sm:h-[72px] backdrop-blur-xl shadow-lg transition-all duration-300"
            style={{
              background: `linear-gradient(hsl(var(--background) / ${isScrolled ? '0.8' : '0.6'}), hsl(var(--background) / ${isScrolled ? '0.8' : '0.6'})) padding-box, linear-gradient(135deg, hsl(var(--accent-mint)), hsl(var(--accent-lilac)), hsl(var(--accent-pink))) border-box`,
              border: '2px solid transparent',
            }}
          >
            <div className="relative h-full flex items-center justify-between px-4 sm:px-6 md:px-8">
              {/* Logo - Left */}
              <Link 
                to="/" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300"
              >
                <Briefcase className="h-6 w-6" />
                <span className="font-bold whitespace-nowrap text-lg sm:text-xl">
                  HUNTORIX
                </span>
              </Link>

              {/* Center Navigation - Desktop Only */}
              <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-6">
                <Link 
                  to={user ? getDashboardPath() : '/auth'} 
                  className={`text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/why-huntorix" 
                  className={`text-sm font-medium transition-colors ${
                    isActive('/why-huntorix') 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Why Huntorix
                </Link>
                <Link 
                  to="/opportunities" 
                  className={`text-sm font-medium transition-colors ${
                    isActive('/opportunities') 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Opportunities
                </Link>
                <Link 
                  to="/headhunters" 
                  className={`text-sm font-medium transition-colors ${
                    isActive('/headhunters') 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Find a Headhunter
                </Link>
                <Link 
                  to="/plans" 
                  className={`text-sm font-medium transition-colors ${
                    isActive('/plans') 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pricing
                </Link>
              </nav>

              {/* Right side - Auth & Actions */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[340px]">
                  <nav className="flex flex-col gap-1 mt-8">
                    {/* Main Navigation */}
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
                      {user && profile?.role === 'employer' && (
                        <Link 
                          to="/my-jobs" 
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Briefcase className="h-5 w-5 text-muted-foreground" />
                          My Jobs
                        </Link>
                      )}
                      {user && profile?.role === 'headhunter' && (
                        <Link 
                          to="/applications" 
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Briefcase className="h-5 w-5 text-muted-foreground" />
                          Applications
                        </Link>
                      )}
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

                    {/* Discover Section */}
                    <div className="border-t pt-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">DISCOVER</p>
                      <Link 
                        to="/why-huntorix" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Star className="h-5 w-5 text-muted-foreground" />
                        Why Huntorix
                      </Link>
                      <Link 
                        to="/opportunities" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
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
                      <Link 
                        to="/plans" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition text-sm font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Crown className="h-5 w-5 text-muted-foreground" />
                        Pricing
                      </Link>
                    </div>

                    {/* Auth Buttons for Mobile (when not logged in) */}
                    {!user && (
                      <div className="border-t pt-4 px-3 flex flex-col gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigate('/auth?mode=signin');
                          }}
                          className="w-full"
                        >
                          Login
                        </Button>
                        <Button 
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigate('/auth?mode=signup');
                          }}
                          className="w-full"
                        >
                          Sign up
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>

              {user && profile ? (
                <TooltipProvider delayDuration={0}>
                  {/* Desktop quick actions */}
                  <div className="hidden sm:flex items-center gap-1">
                    {profile.role === 'headhunter' && credits && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-9 px-3 gap-1.5 flex items-center cursor-default">
                            <Coins className="h-4 w-4" />
                            <span className="text-sm font-medium">{credits.remaining}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Application Credits</TooltipContent>
                      </Tooltip>
                    )}
                    <NotificationDropdown />
                    {profile.role === 'headhunter' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/saved-jobs')}
                            className="h-9 w-9"
                          >
                            <Heart className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>My Saved Jobs</TooltipContent>
                      </Tooltip>
                    )}
                    {profile.role === 'employer' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/saved-headhunters')}
                            className="h-9 w-9"
                          >
                            <Star className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>My Saved Headhunters</TooltipContent>
                      </Tooltip>
                    )}
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

                  {/* User dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="text-sm">
                              {profile.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <Badge 
                            variant="secondary" 
                            className="hidden sm:flex capitalize text-xs"
                          >
                            {profile.role}
                          </Badge>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
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

                      {profile?.role === 'headhunter' && currentPlan && (
                        <>
                          <div className="px-2 py-2 space-y-2">
                            <button
                              onClick={() => navigate('/plans')}
                              className="flex items-center gap-2 hover:opacity-80 transition w-full"
                            >
                              <span className="text-sm text-muted-foreground">Plan:</span>
                              <span className={`text-sm font-medium ${currentPlan.name === 'Huntorix' ? 'underline' : ''}`}>
                                {currentPlan.name}
                              </span>
                              {currentPlan.name === 'Huntorix' && (
                                <Crown className="h-3.5 w-3.5 text-yellow-500" />
                              )}
                            </button>
                            {credits && (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-foreground">
                                  {credits.remaining} credits remaining
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {credits.used} credits used
                                </div>
                                {credits.resetDate && (
                                  <div className="text-xs text-muted-foreground">
                                    Resets on {(() => {
                                      const nextReset = new Date(credits.resetDate);
                                      nextReset.setMonth(nextReset.getMonth() + 1);
                                      return nextReset.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    })()}
                                  </div>
                                )}
                                {credits.nextPlan && credits.changeDate && (
                                  <div className="text-xs text-yellow-600 dark:text-yellow-500 font-medium pt-1 border-t">
                                    Changing to {credits.nextPlan} on{' '}
                                    {credits.changeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                )}
                              </div>
                            )}
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
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/auth?mode=signin')}
                    className="text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => navigate('/auth?mode=signup')}
                    className="bg-foreground text-background hover:bg-foreground/90 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
                  >
                    <span className="hidden sm:inline">Sign up</span>
                    <span className="sm:hidden">Sign up</span>
                    <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              )}
            </div>
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
    </>
  );
}
