import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '@/components/AuthProvider';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { GlobalSearch } from '@/components/common/GlobalSearch';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { NavigationErrorBoundary } from '@/components/common/NavigationErrorBoundary';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { supabase } from '@/integrations/supabase/client';
import { SmartBreadcrumb } from '@/components/ui/smart-breadcrumb';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface ResponsiveLayoutProps {
  userRole: string;
}

export function ResponsiveLayout({ userRole }: ResponsiveLayoutProps) {
  const { user, userRole: authUserRole, userDepartment, signOut, isAdmin, isStaff, isLoading } = useAuth();
  const location = useLocation();
  const { metrics } = useDashboardMetrics();
  const isMobile = useIsMobile();

  console.log('ResponsiveLayout - Role:', authUserRole, 'isAdmin:', isAdmin, 'isStaff:', isStaff, 'isLoading:', isLoading);

  // Guard clause to ensure we're in router context
  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Wait for auth to load before deciding on layout
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show full layout with header for staff/admin, regardless of route
  // For non-admin/non-staff users, render without the sidebar/header
  if (!isAdmin && !isStaff) {
    return <Outlet />;
  }

  return (
    <NavigationErrorBoundary>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
          <NavigationErrorBoundary>
            <AdminSidebar userRole={authUserRole || userRole} userDepartment={userDepartment} />
          </NavigationErrorBoundary>
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <NavigationErrorBoundary>
              <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60 flex-shrink-0">
                <div className="flex items-center justify-between h-full px-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <SidebarTrigger className="lg:hidden flex-shrink-0" />
                    
                    {/* Smart Breadcrumb Navigation */}
                    <div className="flex-1 min-w-0">
                      <SmartBreadcrumb 
                        showIcons={!isMobile}
                        maxItems={isMobile ? 2 : 4}
                        className="max-w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    {!isMobile && (
                      <NavigationErrorBoundary>
                        <GlobalSearch className="w-48 md:w-64" />
                      </NavigationErrorBoundary>
                    )}

                    {/* Theme Toggle (Light/Dark/System) */}
                    <ThemeToggle />

                    {/* Notification Center */}
                    <NotificationCenter />

                    {/* Sign Out */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => signOut()}
                      title="Sign out"
                      className="p-2"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>

                    {/* Profile Shortcut */}
                    <NavLink to="/profile">
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        {!isMobile && (
                          <span className="text-sm font-medium truncate max-w-24">
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
              <div className="w-full h-full p-4 md:p-6 lg:p-8">
                <ErrorBoundary>
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  }>
                    <Outlet />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </NavigationErrorBoundary>
  );
}