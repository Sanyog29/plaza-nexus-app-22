
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Header from './Header';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import AdminNavigation from './AdminNavigation';
import StaffNavigation from './StaffNavigation';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

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
        } catch (error) {
          console.error('Error checking user role:', error);
          setIsAdmin(false);
          setIsStaff(false);
        }
      }
      setIsLoading(false);
    };

    checkUserRole();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-plaza-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-plaza-dark">
      <Header />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      {isAdmin ? <AdminNavigation /> : isStaff ? <StaffNavigation /> : <BottomNavigation />}
    </div>
  );
};

export default AppLayout;
