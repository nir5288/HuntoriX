import { Home, Briefcase, MessageCircle, Wrench, BarChart3, HelpCircle, ChevronLeft, ChevronRight, Globe, PlusCircle, TrendingUp, Database } from "lucide-react";
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
  const { open, setOpen, toggleSidebar } = useSidebar();
  const location = useLocation();
  
  const items = [
    {
      title: 'Dashboard',
      url: role === 'employer' ? '/dashboard/employer' : '/dashboard/headhunter',
      icon: Home,
    },
    ...(role === 'employer' ? [{
      title: 'Post Job',
      url: '/post-job',
      icon: PlusCircle,
    }] : []),
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
  const getIconColor = (item: any, isActiveItem: boolean) => {
    if (item.url === '#') {
      return 'text-muted-foreground/40'; // grayed out for "soon" items
    }
    if (isActiveItem) {
      return ''; // will use gradient
    }
    return ''; // will use gradient for inactive clickable items too
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-slate-900/50 transition-all duration-200 bg-[#0a0a0a]"
    >
      <SidebarHeader 
        className="p-3 flex flex-row items-center justify-between transition-all duration-200 border-b border-slate-800/30 bg-black/40"
      >
        {open && (
          <div className="flex items-center gap-2 px-1">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent-mint)), hsl(var(--accent-lilac)), hsl(var(--accent-pink)))',
              }}
            >
              {role === 'employer' ? 'E' : 'H'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                {role === 'employer' ? 'Employer' : 'Headhunter'}
              </span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 ml-auto hover:bg-slate-800/50 text-slate-300 hover:text-white"
          aria-label="Toggle sidebar"
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </SidebarHeader>
      
      <SidebarContent className="py-2 transition-all duration-200" style={{ backgroundColor: 'rgb(26, 28, 31)' }}>
        <SidebarGroup>
          <SidebarGroupContent>
            <TooltipProvider delayDuration={200} skipDelayDuration={0}>
              <SidebarMenu className="gap-1">
                {items.map((item) => {
                  const isActiveItem = isActive(item.url);
                  const isSoon = item.url === '#';
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild={item.url !== '#'}
                        isActive={isActiveItem}
                        tooltip={getTooltip(item.title)}
                        className={`h-10 px-3 group transition-all duration-200 ${
                          isSoon 
                            ? 'cursor-not-allowed opacity-50' 
                            : isActiveItem
                              ? 'bg-gradient-to-r from-accent-mint/20 to-accent-lilac/20'
                              : 'hover:bg-slate-800/50'
                        }`}
                      >
                        {item.url === '#' ? (
                          <div className="flex items-center gap-3 w-full">
                            <item.icon className={`h-5 w-5 shrink-0 ${getIconColor(item, isActiveItem)}`} />
                            {open && (
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-medium text-slate-400">{item.title}</span>
                                {'badge' in item && item.badge && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-slate-800 text-slate-400 border-slate-700">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <NavLink to={item.url} className="flex items-center gap-3 w-full">
                            <item.icon 
                              className="h-5 w-5 shrink-0 transition-all duration-200 drop-shadow-[0_0_8px_currentColor]"
                              style={{
                                color: isActiveItem 
                                  ? 'hsl(var(--accent-mint))' 
                                  : 'hsl(var(--accent-pink))'
                              }}
                            />
                            {open && (
                              <div className="flex items-center gap-2 flex-1">
                                <span className={`text-sm font-medium transition-colors ${
                                  isActiveItem ? 'text-white' : 'text-slate-300'
                                }`}>
                                  {item.title}
                                </span>
                                {'badge' in item && item.badge && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-accent-lilac/20 text-accent-lilac border-accent-lilac/30">
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
        className="border-t border-slate-800/30 p-4 mt-auto bg-black/40"
      >
        {open ? (
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent-mint)), hsl(var(--accent-lilac)), hsl(var(--accent-pink)))',
              }}
            >
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-bold text-base text-white">HUNTORIX</span>
          </div>
        ) : (
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md mx-auto"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--accent-mint)), hsl(var(--accent-lilac)), hsl(var(--accent-pink)))',
            }}
          >
            <Briefcase className="h-4 w-4" />
          </div>
        )}
      </div>
    </Sidebar>
  );
}
