import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import { PWAProvider } from "./components/PWAProvider";
import { GlobalErrorHandler } from "./components/common/GlobalErrorHandler";
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
import SystemHealthPage from "./pages/SystemHealthPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import StaffRequestsPage from "./pages/StaffRequestsPage";
import StaffAlertsPage from "./pages/StaffAlertsPage";
import StaffReportsPage from "./pages/StaffReportsPage";
import StaffSettingsPage from "./pages/StaffSettingsPage";
import UserManualPage from "./pages/UserManualPage";
import SecurityGuardPage from "./pages/SecurityGuardPage";
import StaffOperationsPage from "./pages/StaffOperationsPage";
import UnifiedDashboardPage from "./pages/UnifiedDashboardPage";
import OperationalExcellencePage from "./pages/OperationalExcellencePage";
import AdvancedFeaturesPage from "./pages/AdvancedFeaturesPage";
import SystemConfigPage from "./pages/SystemConfigPage";
import BulkOperationsPage from "./pages/BulkOperationsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import StaffPerformancePage from "./pages/StaffPerformancePage";
import StaffTrainingPage from "./pages/StaffTrainingPage";
import AdminMaintenancePage from "./pages/AdminMaintenancePage";
import AdminSecurityPage from "./pages/AdminSecurityPage";
import AdminServicesPage from "./pages/AdminServicesPage";
import StaffMaintenancePage from "./pages/StaffMaintenancePage";
import StaffSecurityPage from "./pages/StaffSecurityPage";
import StaffServicesPage from "./pages/StaffServicesPage";
import VendorPortalPage from "./pages/VendorPortalPage";
import AdminCafeteriaPage from "./pages/AdminCafeteriaPage";
import { NotificationProvider } from "./components/notifications/NotificationProvider";
import { PWANotificationManager } from "./components/notifications/PWANotificationManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalErrorHandler>
      <AuthProvider>
        <NotificationProvider>
          <PWANotificationManager>
            <PWAProvider>
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
              {/* General Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/requests/:requestId" element={<RequestDetailsPage />} />
              <Route path="/requests/new" element={<NewRequestPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/cafeteria" element={<CafeteriaPage />} />
              <Route path="/vendor-portal" element={<VendorPortalPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/info-hub" element={<InfoHubPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/manual" element={<UserManualPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/content" element={<AdminContentPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/requests" element={<AdminRequestsPage />} />
              <Route path="/admin/requests/:requestId" element={<RequestDetailsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/system-health" element={<SystemHealthPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/maintenance" element={<AdminMaintenancePage />} />
              <Route path="/admin/security" element={<AdminSecurityPage />} />
              <Route path="/admin/services" element={<AdminServicesPage />} />
              <Route path="/admin/cafeteria" element={<AdminCafeteriaPage />} />
              <Route path="/admin/system-config" element={<SystemConfigPage />} />
              <Route path="/admin/bulk-operations" element={<BulkOperationsPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              
              {/* Staff Routes */}
              <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
              <Route path="/staff/requests" element={<StaffRequestsPage />} />
              <Route path="/staff/requests/:requestId" element={<RequestDetailsPage />} />
              <Route path="/staff/alerts" element={<StaffAlertsPage />} />
              <Route path="/staff/reports" element={<StaffReportsPage />} />
              <Route path="/staff/settings" element={<StaffSettingsPage />} />
              <Route path="/staff/operations" element={<StaffOperationsPage />} />
              <Route path="/staff/performance" element={<StaffPerformancePage />} />
              <Route path="/staff/training" element={<StaffTrainingPage />} />
              <Route path="/staff/maintenance" element={<StaffMaintenancePage />} />
              <Route path="/staff/security" element={<StaffSecurityPage />} />
              <Route path="/staff/services" element={<StaffServicesPage />} />
              
              {/* Special Access Routes */}
              <Route path="/security-guard" element={<SecurityGuardPage />} />
              <Route path="/unified-dashboard" element={<UnifiedDashboardPage />} />
              <Route path="/operational-excellence" element={<OperationalExcellencePage />} />
              <Route path="/advanced-features" element={<AdvancedFeaturesPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
            </BrowserRouter>
              </TooltipProvider>
            </PWAProvider>
          </PWANotificationManager>
        </NotificationProvider>
      </AuthProvider>
    </GlobalErrorHandler>
  </QueryClientProvider>
);

export default App;
