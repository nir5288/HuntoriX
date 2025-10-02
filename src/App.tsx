import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EmployerDashboard from "./pages/EmployerDashboard";
import HeadhunterDashboard from "./pages/HeadhunterDashboard";
import JobDetail from "./pages/JobDetail";
import Opportunities from "./pages/Opportunities";
import Messages from "./pages/Messages";
import HeadhunterProfile from "./pages/HeadhunterProfile";
import EmployerProfile from "./pages/EmployerProfile";
import HeadhunterDirectory from "./pages/HeadhunterDirectory";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard/employer" element={<EmployerDashboard />} />
          <Route path="/dashboard/headhunter" element={<HeadhunterDashboard />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/jobs" element={<Opportunities />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile/headhunter/:id" element={<HeadhunterProfile />} />
          <Route path="/profile/employer/:id" element={<EmployerProfile />} />
          <Route path="/headhunters" element={<HeadhunterDirectory />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
