import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";

interface DashboardLayoutProps {
  children: ReactNode;
}

const SIDEBAR_STATE_KEY = 'sidebar-open-state';

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile } = useAuth();
  const role = profile?.role as 'employer' | 'headhunter';
  
  // Persist sidebar state across navigation
  const [defaultOpen, setDefaultOpen] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    return stored ? stored === 'true' : false;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (stored !== null) {
        setDefaultOpen(stored === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <SidebarProvider 
      defaultOpen={defaultOpen}
      onOpenChange={(open) => {
        localStorage.setItem(SIDEBAR_STATE_KEY, String(open));
      }}
    >
      <div className="min-h-screen flex w-full">
        <AppSidebar role={role} />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
