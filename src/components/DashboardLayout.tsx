import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

function getSidebarStateFromCookie(): boolean {
  const cookie = document.cookie;
  const match = cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/);
  return match ? match[1] === "true" : true;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile } = useAuth();
  const role = (profile?.role as 'employer' | 'headhunter') || 'employer';
  const [sidebarOpen, setSidebarOpen] = useState(getSidebarStateFromCookie);

  // Read cookie state on mount to ensure persistence across navigation
  useEffect(() => {
    setSidebarOpen(getSidebarStateFromCookie());
  }, []);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
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
