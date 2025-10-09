import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  return match ? match[1] === "true" : false;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile } = useAuth();
  const location = useLocation();
  const role = (profile?.role as 'employer' | 'headhunter') || 'employer';
  const [sidebarOpen, setSidebarOpen] = useState(() => getSidebarStateFromCookie());
  
  const isMessagesPage = location.pathname === '/messages';

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="relative min-h-screen flex w-full">
        <AppSidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0">
          {!isMessagesPage && <Header />}
          <main className={`flex-1 w-full overflow-x-hidden ${isMessagesPage ? '' : 'pt-14 sm:pt-16'}`}>
            <div className={isMessagesPage ? "w-full px-0" : "w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8"}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
