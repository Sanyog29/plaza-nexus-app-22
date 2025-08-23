
import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Header from './Header';
import { useAuth } from './AuthProvider';
import { ResponsiveLayout } from './layout/ResponsiveLayout';
import { MobileHeader } from './layout/MobileHeader';
import { MobileBottomNav } from './layout/MobileBottomNav';
import { MobileSystemStatus } from './layout/MobileSystemStatus';
import { HelpSystem } from './help/HelpSystem';
import ErrorBoundary from './common/ErrorBoundary';
import { usePWA } from '@/hooks/usePWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

const AppLayout: React.FC = () => {
  const { user, isAdmin, isStaff, isLoading, userRole } = useAuth(); // Use role states from AuthProvider
  const location = useLocation();
  const navigate = useNavigate();
  const { requestNotificationPermission } = usePWA();
  const isMobile = useIsMobile();
  
  // Initialize breadcrumbs for all layouts
  useBreadcrumbs();

  // Request notification permissions for staff/admin when they load
  useEffect(() => {
    if (user && (isAdmin || isStaff)) {
      requestNotificationPermission();
    }
  }, [user, isAdmin, isStaff, requestNotificationPermission]);

  // Handle redirects - clean navigation logic
  useEffect(() => {
    if (isLoading || !user) return;

    // Vendor-specific redirects - redirect vendors to portal from home
    if (userRole === 'vendor' && location.pathname === '/') {
      navigate('/vendor-portal', { replace: true });
      return;
    }

    // Comprehensive admin/staff route redirects
    if (isAdmin || isStaff) {
      const redirects = {
        '/bookings': '/admin/bookings',
        '/operational-excellence': '/admin/operational-excellence',
        '/advanced-features': '/admin/advanced-features',
        '/unified-dashboard': '/admin/unified-dashboard',
        '/security-guard': '/admin/security-guard',
        '/requests': '/admin/requests',
        '/alerts': '/admin/alerts',
        '/visitors': '/admin/visitors',
        '/assets': '/admin/assets',
        '/users': '/admin/users',
        '/services': '/admin/services',
        '/analytics': '/admin/analytics',
        '/reports': '/admin/reports',
        '/settings': '/admin/settings'
      };
      
      const targetPath = redirects[location.pathname as keyof typeof redirects];
      if (targetPath) {
        navigate(targetPath, { replace: true });
        return;
      }

      // Redirect admin/staff users to their appropriate routes for tenant request URLs
      const isOnTenantRequestRoute = location.pathname.startsWith('/requests/') && 
                                    !location.pathname.includes('/admin/') && 
                                    !location.pathname.includes('/staff/');
      
      if (isOnTenantRequestRoute) {
        const requestId = location.pathname.split('/requests/')[1];
        const newPath = isAdmin ? `/admin/requests/${requestId}` : `/staff/requests/${requestId}`;
        navigate(newPath, { replace: true });
        return;
      }
      
      // Redirect to appropriate dashboard from home page
      if (location.pathname === '/') {
        const dashboardPath = isAdmin ? '/admin/dashboard' : '/staff/dashboard';
        navigate(dashboardPath, { replace: true });
        return;
      }
    }
  }, [location.pathname, isAdmin, isStaff, isLoading, user, navigate, userRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Vendor layout - simplified mobile-first layout
  if (userRole === 'vendor') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-background pb-16">
          <MobileHeader />
          <main className="pt-4">
            <Outlet />
          </main>
          <MobileBottomNav />
          <HelpSystem />
        </div>
      </ErrorBoundary>
    );
  }

  // Prioritize user role - staff/admin always get sidebar layout
  if (isAdmin || isStaff) {
    return (
      <ErrorBoundary>
        <ResponsiveLayout userRole={userRole || (isAdmin ? 'admin' : 'staff')} />
        <HelpSystem />
      </ErrorBoundary>
    );
  }

  // Mobile layout for tenant users
  if (isMobile) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-background pb-16">
          <MobileHeader />
          <MobileSystemStatus />
          <main className="pt-4">
            <Outlet />
          </main>
          <MobileBottomNav />
          <HelpSystem />
        </div>
      </ErrorBoundary>
    );
  }

  // Default layout for tenant users
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
        <BottomNavigation />
        <HelpSystem />
      </div>
    </ErrorBoundary>
  );
};

export default AppLayout;
