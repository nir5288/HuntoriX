import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth';
import { Briefcase, LogOut, LayoutDashboard, Settings, MessagesSquare, User, Heart, Moon, Sun, Globe, Circle, Star } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { NotificationDropdown } from './NotificationDropdown';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SwitchRoleModal } from './SwitchRoleModal';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { status, setStatus } = useUserPreferences();
  const [switchRoleModal, setSwitchRoleModal] = useState<{
    open: boolean;
    currentRole: 'employer' | 'headhunter';
    targetRole: 'employer' | 'headhunter';
  }>({
    open: false,
    currentRole: 'headhunter',
    targetRole: 'employer',
  });

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Briefcase className="h-6 w-6" />
            <span className="font-bold text-xl">HUNTORIX</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to={user ? getDashboardPath() : '/auth'} 
              className={getNavLinkClass('/dashboard')}
            >
              Dashboard
            </Link>
            <Link to="/opportunities" className={getNavLinkClass('/opportunities')}>
              Opportunities
            </Link>
            <Link to="/headhunters" className={getNavLinkClass('/headhunters')}>
              Find a Headhunter
            </Link>
            <Link to="/huntrank" className={`${getNavLinkClass('/huntrank')} flex items-center gap-1.5`}>
              HuntRank
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Soon</Badge>
            </Link>
            <Link to="/huntbase" className={`${getNavLinkClass('/huntbase')} flex items-center gap-1.5`}>
              HuntBase
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Soon</Badge>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/executives" className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[hsl(var(--luxury-gold))] via-[hsl(var(--luxury-rose-gold))] to-[hsl(var(--luxury-purple))] bg-clip-text text-transparent font-bold hover:opacity-80 transition">
            Executives
            <Badge variant="locked" className="text-[10px] px-1.5 py-0">Locked</Badge>
          </Link>
          {user && profile ? (
            <TooltipProvider delayDuration={0}>
              <NotificationDropdown />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/saved-jobs')}
                    className="relative"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>My Saved Jobs</TooltipContent>
              </Tooltip>
              {profile.role === 'employer' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/saved-headhunters')}
                      className="relative"
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
                    className="relative"
                  >
                    <MessagesSquare className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Messages</TooltipContent>
              </Tooltip>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>
                        {profile.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                      status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{profile.name || profile.email}</span>
                    <Badge variant="outline" className="text-xs capitalize">
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
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium">Status</Label>
                    <RadioGroup value={status} onValueChange={(value: 'online' | 'away') => setStatus(value)} className="flex gap-3">
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="online" id="status-online" />
                        <Label htmlFor="status-online" className="text-sm cursor-pointer flex items-center gap-1">
                          <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                          Online
                        </Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="away" id="status-away" />
                        <Label htmlFor="status-away" className="text-sm cursor-pointer flex items-center gap-1">
                          <Circle className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                          Away
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <DropdownMenuSeparator />

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
              <Button variant="ghost" onClick={() => navigate('/auth?mode=signin')}>
                Log in
              </Button>
              <Button variant="hero" onClick={() => navigate('/auth?mode=signup')}>
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>

      <SwitchRoleModal
        open={switchRoleModal.open}
        onOpenChange={(open) => setSwitchRoleModal({ ...switchRoleModal, open })}
        currentRole={switchRoleModal.currentRole}
        targetRole={switchRoleModal.targetRole}
      />
    </header>
  );
}
