import React from 'react';
// Removed shadcn Toaster in favor of Sonner
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "./components/AuthProvider";
import { PropertyProvider } from "./contexts/PropertyContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import { PWAProvider } from "./components/PWAProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalErrorProvider } from "./components/common/GlobalErrorProvider";

import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import RequestsPage from "./pages/RequestsPage";
import NewRequestPage from "./pages/NewRequestPage";
import BookingsPage from "./pages/BookingsPage";
import "./App.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
import UnifiedAnalyticsPage from "./pages/UnifiedAnalyticsPage";
import EnhancedAnalyticsPage from "./pages/EnhancedAnalyticsPage";
import SystemHealthPage from "./pages/SystemHealthPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import StaffRequestsPage from "./pages/StaffRequestsPage";
import StaffAlertsPage from "./pages/StaffAlertsPage";
import StaffReportsPage from "./pages/StaffReportsPage";
import UserManualPage from "./pages/UserManualPage";
import SecurityGuardPage from "./pages/SecurityGuardPage";
// import StaffOperationsPage from "./pages/StaffOperationsPage";
import UnifiedDashboardPage from "./pages/UnifiedDashboardPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import OperationalExcellencePage from "./pages/OperationalExcellencePage";
import AdvancedFeaturesPage from "./pages/AdvancedFeaturesPage";
import OperationsPage from "./pages/OperationsPage";
import BulkOperationsPage from "./pages/BulkOperationsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import StaffPerformancePage from "./pages/StaffPerformancePage";
import StaffTrainingPage from "./pages/StaffTrainingPage";
import AdminMaintenancePage from "./pages/AdminMaintenancePage";
import AdminSecurityPage from "./pages/AdminSecurityPage";
import AdminServicesPage from "./pages/AdminServicesPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import StaffMaintenancePage from "./pages/StaffMaintenancePage";

import StaffServicesPage from "./pages/StaffServicesPage";
import VendorPortalPage from "./pages/VendorPortalPage";
import AdminCafeteriaPage from "./pages/AdminCafeteriaPage";
import DeliveryPage from "./pages/DeliveryPage";
import AccessDeniedPage from "./components/auth/AccessDeniedPage";
import VendorInvoicePageNew from "./components/vendor/VendorInvoicePageNew";
import FoodPOSPage from "./pages/FoodPOSPage";

// Procurement pages
import ProcurementDashboard from "./pages/procurement/ProcurementDashboard";
import RequisitionListPage from "./pages/procurement/RequisitionListPage";
import VendorManagementPage from "./pages/procurement/VendorManagementPage";
import PurchaseOrdersPage from "./pages/procurement/PurchaseOrdersPage";
import BudgetTrackingPage from "./pages/procurement/BudgetTrackingPage";

const CreateRequisitionPage = React.lazy(() => import("./pages/procurement/CreateRequisitionPage"));
const MyRequisitionsPage = React.lazy(() => import("./pages/procurement/MyRequisitionsPage"));
const RequisitionDetailPage = React.lazy(() => import("./pages/procurement/RequisitionDetailPage"));
const RequisitionItemMasterPage = React.lazy(() => import("./pages/admin/RequisitionItemMasterPage"));
const ManagerDashboard = React.lazy(() => import("./pages/procurement/ManagerDashboard"));
const PendingApprovalsPage = React.lazy(() => import("./pages/procurement/PendingApprovalsPage"));
const ApprovalHistoryPage = React.lazy(() => import("./pages/procurement/ApprovalHistoryPage"));

// New simplified pages
import QuickActionsPage from "./pages/admin/QuickActionsPage";
import AssetsPage from "./pages/admin/AssetsPage";
import AdminSearchPage from "./pages/admin/SearchPage";
import UnifiedSettingsPage from "./pages/UnifiedSettingsPage";
import StaffTasksPage from "./pages/staff/TasksPage";
import StaffQuickActionsPage from "./pages/staff/QuickActionsPage";
import StaffAnalyticsPage from "./pages/staff/AnalyticsPage";
import StaffSearchPage from "./pages/staff/SearchPage";
import StaffMobilePage from "./pages/StaffMobilePage";
import TenantPortalPage from "./pages/TenantPortalPage";

// Quick Action pages
import UserNewPage from "./pages/admin/UserNewPage";
import AssetNewPage from "./pages/admin/AssetNewPage";
import TaskNewPage from "./pages/staff/TaskNewPage";
import MaintenanceNewPage from "./pages/staff/MaintenanceNewPage";
import SecurityCheckPage from "./pages/staff/SecurityCheckPage";
import SchedulePage from "./pages/staff/SchedulePage";
import BookingNewPage from "./pages/BookingNewPage";
import { PWANotificationManager } from "./components/notifications/PWANotificationManager";
import { EnhancedNotificationProvider } from "./components/notifications/EnhancedNotificationProvider";
import NotificationsPage from "./pages/NotificationsPage";
import { BreadcrumbProvider } from "./contexts/BreadcrumbContext";
import QualityControlPage from "./pages/admin/QualityControlPage";
import SystemMonitoringPage from "./pages/admin/SystemMonitoringPage";
import VisitorManagementPage from "./pages/VisitorManagementPage";
import PropertyManagementPage from "./pages/admin/PropertyManagementPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <GlobalErrorProvider>
        <HelmetProvider>
          <ThemeProvider>
            <AuthProvider>
              <PropertyProvider>
                <BreadcrumbProvider>
                  <EnhancedNotificationProvider>
                    <PWANotificationManager>
                      <PWAProvider>
                        <TooltipProvider>
                  
                  <Sonner />
            <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              {/* General Routes */}
              <Route path="/dashboard" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/requests/new" element={<NewRequestPage />} />
              <Route path="/requests/:requestId" element={<RequestDetailsPage />} />
              <Route path="/new-request" element={<NewRequestPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/bookings/new" element={<BookingNewPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/cafeteria/*" element={<CafeteriaPage />} />
              <Route path="/food-pos" element={<FoodPOSPage />} />
              <Route path="/vendor-portal" element={<VendorPortalPage />} />
              <Route path="/vendor-portal/invoice/:orderId" element={
                <ProtectedRoute>
                  <VendorInvoicePageNew />
                </ProtectedRoute>
              } />
              
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/info-hub" element={<InfoHubPage />} />
              <Route path="/profile" element={<ProfilePage />} />
               <Route path="/delivery" element={<DeliveryPage />} />
               <Route path="/notifications" element={<NotificationsPage />} />
               <Route path="/manual" element={<UserManualPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/properties" element={<PropertyManagementPage />} />
              <Route path="/admin/quick-actions" element={<QuickActionsPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/users/new" element={<UserNewPage />} />
              <Route path="/admin/assets" element={<AssetsPage />} />
              <Route path="/admin/assets/new" element={<AssetNewPage />} />
                <Route path="/admin/requests" element={<AdminRequestsPage />} />
                <Route path="/admin/requests/new" element={<NewRequestPage />} />
                <Route path="/admin/requests/:requestId" element={<RequestDetailsPage />} />
               <Route path="/admin/bookings" element={<AdminBookingsPage />} />
               <Route path="/admin/services" element={<AdminServicesPage />} />
               <Route path="/admin/security" element={<AdminSecurityPage />} />
               <Route path="/admin/analytics" element={<UnifiedAnalyticsPage />} />
               <Route path="/admin/analytics/enhanced" element={<EnhancedAnalyticsPage />} />
                <Route path="/admin/search" element={<AdminSearchPage />} />
                <Route path="/admin/settings" element={<UnifiedSettingsPage />} />
                <Route path="/admin/system-config" element={<UnifiedSettingsPage />} />
               <Route path="/admin/quality" element={<QualityControlPage />} />
                <Route path="/admin/monitoring" element={<SystemMonitoringPage />} />
                <Route path="/admin/visitors" element={<VisitorManagementPage />} />
                <Route path="/admin/alerts" element={<AlertsPage />} />
              
              {/* Consolidated routes - now handled by unified pages */}
              <Route path="/admin/system-health" element={<AdminDashboardPage />} />
              <Route path="/admin/bulk-operations" element={<AdminDashboardPage />} />
              <Route path="/admin/audit-logs" element={<AdminDashboardPage />} />
              <Route path="/admin/unified-dashboard" element={<AdminDashboardPage />} />
              
              {/* Keep separate pages for complex features */}
               <Route path="/admin/content" element={<AdminContentPage />} />
               <Route path="/admin/reports" element={<AdminReportsPage />} />
               <Route path="/admin/maintenance" element={<AdminMaintenancePage />} />
               <Route path="/admin/cafeteria" element={<AdminCafeteriaPage />} />
               <Route path="/admin/operational-excellence" element={<OperationalExcellencePage />} />
               <Route path="/admin/advanced-features" element={<AdvancedFeaturesPage />} />
               <Route path="/admin/security-guard" element={<SecurityGuardPage />} />
               <Route path="/architecture" element={<ArchitecturePage />} />
               
               {/* Staff Routes */}
              <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
              <Route path="/staff/tasks" element={<StaffTasksPage />} />
              <Route path="/staff/tasks/new" element={<TaskNewPage />} />
              <Route path="/staff/quick-actions" element={<StaffQuickActionsPage />} />
               <Route path="/staff/requests" element={<StaffRequestsPage />} />
               <Route path="/staff/requests/new" element={<NewRequestPage />} />
               <Route path="/staff/requests/:requestId" element={<RequestDetailsPage />} />
              <Route path="/staff/maintenance" element={<StaffMaintenancePage />} />
              <Route path="/staff/maintenance/new" element={<MaintenanceNewPage />} />
              <Route path="/staff/security/check" element={<SecurityCheckPage />} />
              <Route path="/staff/schedule" element={<SchedulePage />} />
              <Route path="/staff/analytics" element={<StaffAnalyticsPage />} />
              <Route path="/staff/search" element={<StaffSearchPage />} />
               <Route path="/staff/mobile" element={<StaffMobilePage />} />
               <Route path="/tenant-portal" element={<TenantPortalPage />} />
              
              {/* Legacy staff routes for backward compatibility */}
              <Route path="/staff/alerts" element={<StaffAlertsPage />} />
              <Route path="/staff/reports" element={<StaffReportsPage />} />
              <Route path="/staff/settings" element={<UnifiedSettingsPage />} />
              <Route path="/staff/operations" element={<OperationsPage />} />
              <Route path="/staff/performance" element={<StaffPerformancePage />} />
              <Route path="/staff/training" element={<StaffTrainingPage />} />
              <Route path="/staff/security" element={<AdminSecurityPage />} />
              <Route path="/staff/services" element={<StaffServicesPage />} />
              
              {/* Operations Center */}
              <Route path="/operations" element={<OperationsPage />} />
              
              {/* Procurement Portal Routes */}
              <Route path="/procurement" element={<ProcurementDashboard />} />
              <Route path="/procurement/create-requisition" element={<CreateRequisitionPage />} />
              <Route path="/procurement/my-requisitions" element={<MyRequisitionsPage />} />
              <Route path="/procurement/requisitions/:id" element={<RequisitionDetailPage />} />
              <Route path="/procurement/requisitions" element={<RequisitionListPage />} />
              <Route path="/procurement/manager-dashboard" element={<ManagerDashboard />} />
              <Route path="/procurement/pending-approvals" element={<PendingApprovalsPage />} />
              <Route path="/procurement/approval-history" element={<ApprovalHistoryPage />} />
              <Route path="/procurement/vendors" element={<VendorManagementPage />} />
              <Route path="/procurement/orders" element={<PurchaseOrdersPage />} />
              <Route path="/procurement/budget" element={<BudgetTrackingPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/requisition-master" element={<RequisitionItemMasterPage />} />
              
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
                  </EnhancedNotificationProvider>
                </BreadcrumbProvider>
              </PropertyProvider>
            </AuthProvider>
          </ThemeProvider>
        </HelmetProvider>
      </GlobalErrorProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
