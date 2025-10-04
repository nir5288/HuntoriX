import { Home, Briefcase, MessageCircle, Wrench, BarChart3, HelpCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  role: 'employer' | 'headhunter';
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";
  
  const items = [
    {
      title: role === 'employer' ? 'Employer Dashboard' : 'Headhunter Dashboard',
      url: role === 'employer' ? '/dashboard/employer' : '/dashboard/headhunter',
      icon: Home,
    },
    {
      title: role === 'employer' ? 'My Jobs' : 'My Applications',
      url: role === 'employer' ? '/dashboard/employer' : '/applications',
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
      title: 'Help / Tutorials',
      url: '#',
      icon: HelpCircle,
    },
  ];

  const isActive = (path: string) => {
    if (path === '#') return false;
    return location.pathname === path;
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild={item.url !== '#'}
                    isActive={isActive(item.url)}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    {item.url === '#' ? (
                      <div className="cursor-not-allowed opacity-50">
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </div>
                    ) : (
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
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
