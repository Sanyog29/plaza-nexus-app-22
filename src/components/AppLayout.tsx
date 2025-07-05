
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Header from './Header';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveLayout } from './layout/ResponsiveLayout';
import { HelpSystem } from './help/HelpSystem';
import ErrorBoundary from './common/ErrorBoundary';
import { usePWA } from '@/hooks/usePWA';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const { requestNotificationPermission } = usePWA();

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const [adminResult, staffResult] = await Promise.all([
            supabase.rpc('is_admin', { uid: user.id }),
            supabase.rpc('is_staff', { uid: user.id })
          ]);
          
          setIsAdmin(adminResult.data || false);
          setIsStaff(staffResult.data || false);

          // Request notification permissions for staff/admin
          if (adminResult.data || staffResult.data) {
            requestNotificationPermission();
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          setIsAdmin(false);
          setIsStaff(false);
        }
      }
      setIsLoading(false);
    };

    checkUserRole();
  }, [user, requestNotificationPermission]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Use responsive layout for admin/staff areas
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStaffRoute = location.pathname.startsWith('/staff');
  
  if ((isAdminRoute && isAdmin) || (isStaffRoute && isStaff)) {
    return (
      <ErrorBoundary>
        <ResponsiveLayout userRole={isAdmin ? 'admin' : 'staff'} />
        <HelpSystem />
      </ErrorBoundary>
    );
  }

  // Default layout for regular users
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
