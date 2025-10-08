import { Home, Briefcase, MessageCircle, Wrench, BarChart3, HelpCircle, Globe } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    <Sidebar collapsible="icon" className="border-r bg-[#1a1a1a] transition-all duration-200">
      <SidebarHeader className="border-b border-[#2a2a2a] p-3 flex flex-row items-center justify-between transition-all duration-200">
        {open && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center text-white font-bold text-sm">
              HX
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                Huntorix
              </span>
              <span className="text-xs text-gray-400">
                {role === 'employer' ? 'Employer' : 'Headhunter'}
              </span>
            </div>
          </div>
        )}
        {!open && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center text-white font-bold text-xs mx-auto">
            HX
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="py-2 transition-all duration-200">
        <SidebarGroup>
          <SidebarGroupContent>
            <TooltipProvider delayDuration={200} skipDelayDuration={0}>
              <SidebarMenu className="gap-1">
                {items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild={item.url !== '#'}
                        isActive={active}
                        tooltip={getTooltip(item.title)}
                        className={cn(
                          "h-12 mx-2 rounded-lg transition-all duration-200",
                          active 
                            ? "bg-[#0f0f0f] text-[hsl(var(--accent-pink))]" 
                            : "text-gray-400 hover:text-white hover:bg-[#252525]"
                        )}
                      >
                        {item.url === '#' ? (
                          <div className="flex items-center gap-3 w-full cursor-not-allowed opacity-50">
                            <item.icon className="h-5 w-5 shrink-0" />
                            {open && <span className="text-sm font-medium">{item.title}</span>}
                          </div>
                        ) : (
                          <NavLink to={item.url} className="flex items-center gap-3 w-full px-3">
                            <item.icon className="h-5 w-5 shrink-0" />
                            {open && (
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-medium">{item.title}</span>
                                {'badge' in item && item.badge && (
                                  <Badge variant="secondary" className="text-xs py-0 h-5">
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

      <div className="mt-auto border-t border-[#2a2a2a] p-3">
        <div className="flex items-center justify-center">
          {open ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center text-white font-bold text-xs">
                HX
              </div>
              <span className="text-xs font-semibold text-white">Huntorix</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center text-white font-bold text-xs">
              HX
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
