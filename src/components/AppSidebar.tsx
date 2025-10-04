import { Home, Briefcase, MessageCircle, Wrench, BarChart3, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
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

interface AppSidebarProps {
  role: 'employer' | 'headhunter';
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { open, toggleSidebar } = useSidebar();
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

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar transition-all duration-200">
      <SidebarHeader className="border-b p-3 flex flex-row items-center justify-between transition-all duration-200">
        {open && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center text-white font-bold text-sm">
              {role === 'employer' ? 'E' : 'H'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {role === 'employer' ? 'Employer' : 'Headhunter'}
              </span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {open ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </SidebarHeader>
      
      <SidebarContent className="py-2 transition-all duration-200">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild={item.url !== '#'}
                    isActive={isActive(item.url)}
                    tooltip={!open ? item.title : undefined}
                    className="h-10 px-3"
                  >
                    {item.url === '#' ? (
                      <div className="flex items-center gap-3 w-full cursor-not-allowed opacity-50">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {open && <span className="text-sm font-medium">{item.title}</span>}
                      </div>
                    ) : (
                      <NavLink to={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {open && <span className="text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
