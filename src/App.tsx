import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from './components/ThemeProvider';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { Footer } from './components/Footer';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EmployerDashboard from "./pages/EmployerDashboard";
import MyJobs from "./pages/MyJobs";
import HeadhunterDashboard from "./pages/HeadhunterDashboard";
import JobDetail from "./pages/JobDetail";
import JobReview from "./pages/JobReview";
import Opportunities from "./pages/Opportunities";
import Applications from "./pages/Applications";
import SavedJobs from "./pages/SavedJobs";
import SavedHeadhunters from "./pages/SavedHeadhunters";
import Messages from "./pages/Messages";
import HeadhunterProfile from "./pages/HeadhunterProfile";
import EmployerProfile from "./pages/EmployerProfile";
import HeadhunterDirectory from "./pages/HeadhunterDirectory";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import HuntRank from "./pages/HuntRank";
import HuntBase from "./pages/HuntBase";
import Executives from "./pages/Executives";

import { useEffect } from 'react';
import { VerificationWrapper } from './components/VerificationWrapper';
import { DashboardLayoutWrapper } from './components/DashboardLayoutWrapper';
import { AIAssistant } from './components/AIAssistant';

const AppContent = () => {
  const location = useLocation();
  const hideFooter = location.pathname === '/messages';

  // Always scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);
  return (
    <>
      <VerificationWrapper>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Dashboard routes with persistent layout */}
          <Route element={<DashboardLayoutWrapper />}>
            <Route path="/dashboard/employer" element={<EmployerDashboard />} />
            <Route path="/my-jobs" element={<MyJobs />} />
            <Route path="/dashboard/headhunter" element={<HeadhunterDashboard />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/saved-jobs" element={<SavedJobs />} />
            <Route path="/saved-headhunters" element={<SavedHeadhunters />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Public routes without dashboard layout */}
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/jobs" element={<Opportunities />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/job-review/:id" element={<JobReview />} />
          <Route path="/profile/headhunter/:id" element={<HeadhunterProfile />} />
          <Route path="/profile/employer/:id" element={<EmployerProfile />} />
          <Route path="/headhunters" element={<HeadhunterDirectory />} />
          <Route path="/huntrank" element={<HuntRank />} />
          <Route path="/huntbase" element={<HuntBase />} />
          <Route path="/executives" element={<Executives />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </VerificationWrapper>
      {!hideFooter && <Footer />}
      <AIAssistant />
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <UserPreferencesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </UserPreferencesProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
