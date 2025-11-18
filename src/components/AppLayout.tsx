
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
import { useNavigationTransition } from '@/hooks/useNavigationTransition';

const AppLayout: React.FC = () => {
  const { user, isAdmin, isStaff, isLoading, userRole, isFoodVendor } = useAuth(); // Use role states from AuthProvider
  const location = useLocation();
  const { navigate } = useNavigationTransition();
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

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.error('[AppLayout] Loading timeout - forcing reload');
        window.location.href = '/auth';
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Handle redirects - clean navigation logic
  useEffect(() => {
    // Wait for both authentication AND role assignment to prevent race conditions
    if (isLoading || !user || (user && !userRole)) return;

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

      // Allow staff to access /requests/new for raising requests, but redirect /requests to admin area
      if (location.pathname === '/requests') {
        navigate('/admin/requests', { replace: true });
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
      
      // Redirect generic dashboard routes for admin/staff
      if (['/dashboard', '/home', '/tenant-portal'].includes(location.pathname)) {
        navigate(isAdmin ? '/admin/dashboard' : '/staff/dashboard', { replace: true });
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
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  // Food vendor layout - MINIMAL interface
  if (isFoodVendor) {
    return (
      <div className="min-h-screen w-full bg-background">
        <ErrorBoundary>
          <Outlet />
          <HelpSystem />
        </ErrorBoundary>
      </div>
    );
  }

  // Vendor layout - simplified mobile-first layout
  if (userRole === 'vendor') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen w-full bg-background mobile-safe">
          <MobileHeader />
          <main className="flex-1 p-lg">
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
        <div className="min-h-screen w-full bg-background mobile-safe">
          <MobileHeader />
          <MobileSystemStatus />
          <main className="flex-1 p-lg">
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
      <div className="flex flex-col min-h-screen w-full bg-background">
        <Header />
        <main className="flex-1 p-0 mobile-safe">
          <Outlet />
        </main>
        <BottomNavigation />
        <HelpSystem />
      </div>
    </ErrorBoundary>
  );
};

export default AppLayout;
