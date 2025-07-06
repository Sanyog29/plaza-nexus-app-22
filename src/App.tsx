import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import RequestsPage from "./pages/RequestsPage";
import NewRequestPage from "./pages/NewRequestPage";
import BookingsPage from "./pages/BookingsPage";
import AlertsPage from "./pages/AlertsPage";
import CafeteriaPage from "./pages/CafeteriaPage";
import ServicesPage from "./pages/ServicesPage";
import SecurityPage from "./pages/SecurityPage";
import InfoHubPage from "./pages/InfoHubPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import RequestDetailsPage from "./pages/RequestDetailsPage";
import MaintenancePage from "./pages/MaintenancePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminContentPage from "./pages/AdminContentPage";
import UserManagementPage from "./pages/UserManagementPage";
import AdminRequestsPage from "./pages/AdminRequestsPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import StaffRequestsPage from "./pages/StaffRequestsPage";
import StaffAlertsPage from "./pages/StaffAlertsPage";
import StaffReportsPage from "./pages/StaffReportsPage";
import StaffSettingsPage from "./pages/StaffSettingsPage";
import UserManualPage from "./pages/UserManualPage";
import SecurityGuardPage from "./pages/SecurityGuardPage";
import StaffOperationsPage from "./pages/StaffOperationsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<HomePage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/requests/:requestId" element={<RequestDetailsPage />} />
              <Route path="/requests/new" element={<NewRequestPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/cafeteria" element={<CafeteriaPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/info-hub" element={<InfoHubPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/manual" element={<UserManualPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/content" element={<AdminContentPage />} />
          <Route path="/admin/requests" element={<AdminRequestsPage />} />
          <Route path="/admin/requests/:requestId" element={<RequestDetailsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
              <Route path="/staff/requests" element={<StaffRequestsPage />} />
              <Route path="/staff/requests/:requestId" element={<RequestDetailsPage />} />
              <Route path="/staff/alerts" element={<StaffAlertsPage />} />
              <Route path="/staff/reports" element={<StaffReportsPage />} />
              <Route path="/staff/settings" element={<StaffSettingsPage />} />
              <Route path="/staff/operations" element={<StaffOperationsPage />} />
              <Route path="/security-guard" element={<SecurityGuardPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
