import { Home, Briefcase, MessageCircle, Wrench, BarChart3, HelpCircle, ChevronLeft, ChevronRight, Globe, TrendingUp, Database, Star } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface AppSidebarProps {
  role: 'employer' | 'headhunter';
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  
  const items = [
    {
      title: 'Dashboard',
      url: role === 'employer' ? '/dashboard/employer' : '/dashboard/headhunter',
      icon: Home,
    },
    {
      title: role === 'employer' ? 'My Jobs' : 'Applications',
      url: role === 'employer' ? '/my-jobs' : '/applications',
      icon: Briefcase,
    },
    {
      title: 'Messages',
      url: '/messages',
      icon: MessageCircle,
    },
    ...(role === 'employer' ? [{
      title: 'Saved Headhunters',
      url: '/saved-headhunters',
      icon: Star,
    }] : []),
    ...(role === 'headhunter' ? [{
      title: 'Global Hiring',
      url: '/global-hiring',
      icon: Globe,
      badge: 'Beta',
    }] : []),
    {
      title: 'Tools',
      url: '#',
      icon: Wrench,
      badge: 'Soon',
    },
    {
      title: 'Analytics',
      url: '#',
      icon: BarChart3,
      badge: 'Soon',
    },
    {
      title: 'HuntRank',
      url: '#',
      icon: TrendingUp,
      badge: 'Soon',
    },
    {
      title: 'HuntBase',
      url: '#',
      icon: Database,
      badge: 'Soon',
    },
    {
      title: 'Help',
      url: '#',
      icon: HelpCircle,
    },
  ];

  const isActive = (path: string) => {
    if (path === '#') return false;
    return location.pathname === path;
  };

  const getTooltip = (title: string) => {
    if (open) return undefined;
    return title;
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-slate-800/50 transition-all duration-300"
      style={{ 
        backgroundColor: 'rgb(18, 18, 20)',
        width: open ? '16rem' : '3.4rem'
      }}
    >
      <SidebarHeader 
        className="p-4 flex flex-row items-center justify-between transition-all duration-300 border-b border-slate-700/40"
        style={{ backgroundColor: 'rgb(22, 22, 24)' }}
      >
        {open && (
          <div className="flex items-center gap-3 px-1">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xl"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent-mint)), hsl(var(--accent-lilac)), hsl(var(--accent-pink)))',
              }}
            >
              {role === 'employer' ? 'E' : 'H'}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight">
                {role === 'employer' ? 'Employer' : 'Headhunter'}
              </span>
              <span className="text-xs text-slate-400">Portal</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="h-9 w-9 ml-auto hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-200"
          aria-label="Toggle sidebar"
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </SidebarHeader>
      
      <SidebarContent className="py-3 transition-all duration-300" style={{ backgroundColor: 'rgb(26, 28, 31)' }}>
        <SidebarGroup>
          <SidebarGroupContent>
            <TooltipProvider delayDuration={200} skipDelayDuration={0}>
              <SidebarMenu className="gap-1.5 px-3">
                {items.map((item) => {
                  const isActiveItem = isActive(item.url);
                  const isSoon = item.url === '#';
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild={item.url !== '#'}
                        isActive={isActiveItem}
                        tooltip={getTooltip(item.title)}
                        className={`group rounded-xl leading-none transition-all duration-200 ${
                          open ? 'h-14 px-4' : 'h-12 w-12 p-0 grid place-items-center'
                        } ${
                          isSoon 
                            ? 'cursor-not-allowed' 
                            : isActiveItem
                              ? 'bg-black shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),inset_0_-2px_8px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.03)] border border-black data-[active=true]:bg-black'
                              : 'hover:bg-slate-700/40'
                        }`}
                      >
                        {item.url === '#' ? (
                          <div className={`${open ? 'flex items-center gap-4 w-full' : 'grid place-items-center'}`}>
                            <div className="grid place-items-center h-8 w-8 rounded-full">
                              <item.icon className="h-6 w-6 text-slate-500/70" />
                            </div>
                            {open && (
                              <div className="flex items-center gap-2 flex-1 justify-between">
                                <span className="text-sm font-medium text-slate-500/80">{item.title}</span>
                                {'badge' in item && item.badge && (
                                  <Badge variant="secondary" className="text-[9px] px-2 py-0.5 h-5 bg-slate-800/80 text-slate-400 border-slate-700/50 font-medium">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <NavLink to={item.url} className={`${open ? 'flex items-center gap-4 w-full' : 'grid place-items-center'}`}>
                            <div className={`grid place-items-center rounded-full ${open ? 'h-8 w-8' : 'h-8 w-8'}`}>
                              <item.icon 
                                className="h-6 w-6 flex-shrink-0 transition-all duration-200"
                                style={{
                                  color: isActiveItem 
                                    ? 'hsl(var(--accent-mint))' 
                                    : 'hsl(var(--accent-pink))',
                                  filter: isActiveItem 
                                    ? 'drop-shadow(0 0 12px hsl(var(--accent-mint) / 0.6))' 
                                    : 'drop-shadow(0 0 6px hsl(var(--accent-pink) / 0.3))'
                                }}
                              />
                            </div>
                            {open && (
                              <div className="flex items-center gap-2 flex-1 justify-between">
                                <span className={`text-base font-semibold transition-colors ${
                                  isActiveItem ? 'text-white' : 'text-slate-300'
                                }`}>
                                  {item.title}
                                </span>
                                {'badge' in item && item.badge && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-[9px] px-2 py-0.5 h-5 font-semibold"
                                    style={{
                                      backgroundColor: 'hsl(var(--accent-lilac) / 0.2)',
                                      color: 'hsl(var(--accent-lilac))',
                                      borderColor: 'hsl(var(--accent-lilac) / 0.3)',
                                      borderWidth: '1px',
                                    }}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </NavLink>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </TooltipProvider>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with logo */}
      <div 
        className="border-t border-slate-700/40 p-4 mt-auto"
        style={{ backgroundColor: 'rgb(22, 22, 24)' }}
      >
        {open ? (
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent-mint)), hsl(var(--accent-lilac)), hsl(var(--accent-pink)))',
              }}
            >
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">HUNTORIX</span>
          </div>
        ) : (
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg mx-auto"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--accent-mint)), hsl(var(--accent-lilac)), hsl(var(--accent-pink)))',
            }}
          >
            <Briefcase className="h-5 w-5" />
          </div>
        )}
      </div>
    </Sidebar>
  );
}
