import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Briefcase, LogOut, LayoutDashboard, Settings, MessageSquare, User } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
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
import { useState } from 'react';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Briefcase className="h-6 w-6" />
            <span className="font-bold text-xl">HUNTORIX</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/opportunities" className="text-sm font-medium hover:text-primary transition">
              Opportunities
            </Link>
            <Link to="/headhunters" className="text-sm font-medium hover:text-primary transition">
              Find a Headhunter
            </Link>
            <Link 
              to={user ? getDashboardPath() : '/auth'} 
              className="text-sm font-medium hover:text-primary transition"
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user && profile ? (
            <>
              <NotificationDropdown />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/messages')}
                className="relative"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>
                      {profile.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{profile.name || profile.email}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {profile.role}
                    </Badge>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
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
