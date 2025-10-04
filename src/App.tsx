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

import { useEffect } from 'react';
import { VerificationWrapper } from './components/VerificationWrapper';

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
          <Route path="/dashboard/employer" element={<EmployerDashboard />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/dashboard/headhunter" element={<HeadhunterDashboard />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/jobs" element={<Opportunities />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/job-review/:id" element={<JobReview />} />
          <Route path="/saved-jobs" element={<SavedJobs />} />
          <Route path="/saved-headhunters" element={<SavedHeadhunters />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile/headhunter/:id" element={<HeadhunterProfile />} />
          <Route path="/profile/employer/:id" element={<EmployerProfile />} />
          <Route path="/headhunters" element={<HeadhunterDirectory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </VerificationWrapper>
      {!hideFooter && <Footer />}
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
