import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '@/components/AuthProvider';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { GlobalSearch } from '@/components/common/GlobalSearch';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { NavigationErrorBoundary } from '@/components/common/NavigationErrorBoundary';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { supabase } from '@/integrations/supabase/client';

interface ResponsiveLayoutProps {
  userRole: string;
}

export function ResponsiveLayout({ userRole }: ResponsiveLayoutProps) {
  const { user, userRole: authUserRole, userDepartment } = useAuth();
  const location = useLocation();
  const { metrics } = useDashboardMetrics();
  const isMobile = useIsMobile();


  console.log('ResponsiveLayout - Role:', authUserRole, 'Department:', userDepartment);

  // Guard clause to ensure we're in router context
  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStaffRoute = location.pathname.startsWith('/staff');
  
  if (!isAdminRoute && !isStaffRoute) {
    return <Outlet />;
  }

  return (
    <NavigationErrorBoundary>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-background">
          <NavigationErrorBoundary>
            <AdminSidebar userRole={authUserRole || userRole} userDepartment={userDepartment} />
          </NavigationErrorBoundary>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <NavigationErrorBoundary>
              <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="flex items-center justify-between h-full px-4">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger className="lg:hidden" />
                    
                    {!isMobile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{userRole} Panel</span>
                        <span>•</span>
                        <span className="font-medium text-foreground">
                          {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {!isMobile && (
                      <NavigationErrorBoundary>
                        <GlobalSearch className="w-64" />
                      </NavigationErrorBoundary>
                     )}

                     {/* Enhanced Notification Center */}
                     <NotificationCenter />

                    {/* User Menu */}
                    <NavLink to="/profile">
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        {!isMobile && (
                          <span className="text-sm font-medium">
                            {user?.email?.split('@')[0] || 'User'}
                          </span>
                        )}
                      </Button>
                    </NavLink>
                  </div>
                </div>
              </header>
            </NavigationErrorBoundary>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
              <div className="container max-w-7xl mx-auto p-6">
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </NavigationErrorBoundary>
  );
}