
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Header from './Header';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveLayout } from './layout/ResponsiveLayout';
import { MobileHeader } from './layout/MobileHeader';
import { MobileBottomNav } from './layout/MobileBottomNav';
import { MobileSystemStatus } from './layout/MobileSystemStatus';
import { HelpSystem } from './help/HelpSystem';
import ErrorBoundary from './common/ErrorBoundary';
import { usePWA } from '@/hooks/usePWA';
import { useIsMobile } from '@/hooks/use-mobile';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const { requestNotificationPermission } = usePWA();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          // Get role from profiles table instead of RPC functions
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching user profile:', error);
            setIsAdmin(false);
            setIsStaff(false);
          } else if (profile) {
            const userRole = profile.role;
            setIsAdmin(userRole === 'admin');
            setIsStaff(['admin', 'ops_supervisor', 'field_staff'].includes(userRole));

            // Request notification permissions for staff/admin
            if (userRole === 'admin' || ['ops_supervisor', 'field_staff'].includes(userRole)) {
              requestNotificationPermission();
            }
          } else {
            setIsAdmin(false);
            setIsStaff(false);
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          setIsAdmin(false);
          setIsStaff(false);
        }
      } else {
        setIsAdmin(false);
        setIsStaff(false);
      }
      setIsLoading(false);
    };

    checkUserRole();
  }, [user, requestNotificationPermission]);

  // Handle redirects separately to avoid infinite loops
  useEffect(() => {
    if (isLoading || !user) return;

    // Redirect admin/staff users to their appropriate routes only for specific cases
    const isOnTenantRequestRoute = location.pathname.startsWith('/requests/') && 
                                  !location.pathname.includes('/admin/') && 
                                  !location.pathname.includes('/staff/');
    
    if (isOnTenantRequestRoute && (isAdmin || isStaff)) {
      const requestId = location.pathname.split('/requests/')[1];
      if (isAdmin) {
        window.location.replace(`/admin/requests/${requestId}`);
        return;
      } else if (isStaff) {
        window.location.replace(`/staff/requests/${requestId}`);
        return;
      }
    }
    
    // Only redirect to dashboard when first landing on home page
    if (location.pathname === '/' && (isAdmin || isStaff)) {
      if (isAdmin) {
        window.location.replace('/admin/dashboard');
        return;
      } else if (isStaff) {
        window.location.replace('/staff/dashboard');
        return;
      }
    }
  }, [location.pathname, isAdmin, isStaff, isLoading, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prioritize user role - staff/admin always get sidebar layout
  if (isAdmin || isStaff) {
    return (
      <ErrorBoundary>
        <ResponsiveLayout userRole={isAdmin ? 'admin' : 'staff'} />
        <HelpSystem />
      </ErrorBoundary>
    );
  }

  // Mobile layout for tenant users
  if (isMobile) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-plaza-dark pb-16">
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
      <div className="flex flex-col min-h-screen bg-plaza-dark">
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
