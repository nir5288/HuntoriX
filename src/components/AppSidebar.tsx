import { Home, Briefcase, MessageCircle, Wrench, BarChart3, HelpCircle, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
    },
    {
      title: 'Analytics',
      url: '#',
      icon: BarChart3,
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
    <Sidebar collapsible="icon" className="border-r border-emerald-500/30 bg-slate-900 transition-all duration-200">
      <SidebarHeader className="border-b border-emerald-500/30 p-3 flex flex-row items-center justify-between transition-all duration-200">
        {open && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-900 font-bold text-sm font-mono shadow-lg shadow-emerald-500/50">
              HX
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-emerald-400 font-mono tracking-wider">
                HUNTORIX
              </span>
              <span className="text-[10px] text-cyan-400 font-mono uppercase">
                {role === 'employer' ? 'Employer' : 'Headhunter'}
              </span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 ml-auto text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/50"
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
      
      <SidebarContent className="py-2 transition-all duration-200 bg-slate-900">
        <SidebarGroup>
          <SidebarGroupContent>
            <TooltipProvider delayDuration={200} skipDelayDuration={0}>
              <SidebarMenu className="gap-1">
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild={item.url !== '#'}
                      isActive={isActive(item.url)}
                      tooltip={getTooltip(item.title)}
                      className={`h-10 px-3 transition-all duration-200 ${
                        isActive(item.url)
                          ? 'bg-slate-950 text-emerald-400 border-l-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      {item.url === '#' ? (
                        <div className="flex items-center gap-3 w-full cursor-not-allowed opacity-50">
                          <item.icon className="h-5 w-5 shrink-0" />
                          {open && <span className="text-sm font-medium font-mono">{item.title}</span>}
                        </div>
                      ) : (
                        <NavLink to={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                          {open && (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm font-medium font-mono">{item.title}</span>
                              {'badge' in item && item.badge && (
                                <Badge variant="secondary" className="text-xs py-0 h-5 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          )}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </TooltipProvider>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-emerald-500/30 p-3 bg-slate-900">
        <div className="flex items-center justify-center">
          {open ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-900 font-bold text-sm font-mono shadow-lg shadow-emerald-500/50">
                HX
              </div>
              <span className="text-xs font-mono tracking-wider">HUNTORIX</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-900 font-bold text-sm font-mono shadow-lg shadow-emerald-500/50">
              HX
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
