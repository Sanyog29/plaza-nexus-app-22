
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Header from './Header';
import { useAuth } from './AuthProvider';
import { ResponsiveLayout } from './layout/ResponsiveLayout';
import { MobileHeader } from './layout/MobileHeader';
import { MobileBottomNav } from './layout/MobileBottomNav';
import { MobileSystemStatus } from './layout/MobileSystemStatus';
import ErrorBoundary from './common/ErrorBoundary';
import { usePWA } from '@/hooks/usePWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { getRoleLevel } from '@/constants/roles';

const AppLayout: React.FC = () => {
  const { user, isAdmin, isStaff, isLoading, userRole, isFoodVendor } = useAuth(); // Use role states from AuthProvider
  const location = useLocation();
  const { navigate } = useNavigationTransition();
  const { requestNotificationPermission } = usePWA();
  const isMobile = useIsMobile();
  const roleLevel = getRoleLevel(userRole);
  
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

    // Super tenant stays on tenant routes - no staff redirects
    if (userRole === 'super_tenant') {
      // Only redirect from generic dashboard routes to home
      if (['/dashboard', '/home', '/tenant-portal'].includes(location.pathname)) {
        navigate('/', { replace: true });
        return;
      }
      // Don't apply any other redirects for super_tenant
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

      // Only redirect L3+ staff and admins to /admin/requests
      // L1/L2 (field staff, operators) stay on /requests
      if (location.pathname === '/requests') {
        if (roleLevel === 'L3' || roleLevel === 'L4+' || isAdmin) {
          navigate('/admin/requests', { replace: true });
          return;
        }
        // L1/L2 users stay on /requests - no redirect
      }

      // Redirect request details only for L3+ and admins
      const isOnTenantRequestRoute = location.pathname.startsWith('/requests/') && 
                                    location.pathname !== '/requests/new' && 
                                    !location.pathname.includes('/admin/') && 
                                    !location.pathname.includes('/staff/');
      
      if (isOnTenantRequestRoute) {
        if (roleLevel === 'L3' || roleLevel === 'L4+' || isAdmin) {
          const requestId = location.pathname.split('/requests/')[1];
          const newPath = `/admin/requests/${requestId}`;
          navigate(newPath, { replace: true });
          return;
        }
        // L1/L2 users stay on /requests/:id - no redirect
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
        </div>
      </ErrorBoundary>
    );
  }

  // Super tenant gets tenant-style layout WITH sidebar (enhanced tenant)
  if (userRole === 'super_tenant') {
    return (
      <ErrorBoundary>
        <ResponsiveLayout userRole="super_tenant" />
      </ErrorBoundary>
    );
  }

  // Prioritize user role - staff/admin always get sidebar layout
  if (isAdmin || isStaff) {
    return (
      <ErrorBoundary>
        <ResponsiveLayout userRole={userRole || (isAdmin ? 'admin' : 'staff')} />
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
      </div>
    </ErrorBoundary>
  );
};

export default AppLayout;
