import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";

interface DashboardLayoutProps {
  children: ReactNode;
}

function getSidebarDefaultOpen() {
  // Check for the cookie set by the SidebarProvider
  const match = document.cookie.match(/(?:^|; )sidebar:state=(true|false)/);
  // Default to false (closed) if no cookie exists (first login)
  return match ? match[1] === "true" : false;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile } = useAuth();
  const role = (profile?.role as 'employer' | 'headhunter') || 'employer';

  return (
    <SidebarProvider defaultOpen={getSidebarDefaultOpen()}>
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
