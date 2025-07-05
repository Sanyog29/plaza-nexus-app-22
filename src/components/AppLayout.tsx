
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Header from './Header';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import AdminNavigation from './AdminNavigation';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.rpc('is_admin', { uid: user.id });
          if (error) throw error;
          setIsAdmin(data || false);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
      setIsLoading(false);
    };

    checkAdminStatus();
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
      {isAdmin ? <AdminNavigation /> : <BottomNavigation />}
    </div>
  );
};

export default AppLayout;
