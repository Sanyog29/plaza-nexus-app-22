import React from 'react';
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

interface ResponsiveLayoutProps {
  userRole: 'admin' | 'staff';
}

export function ResponsiveLayout({ userRole }: ResponsiveLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const { metrics } = useDashboardMetrics();
  const isMobile = useIsMobile();

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
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar userRole={userRole} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
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
                  <GlobalSearch className="w-64" />
                )}

                {/* Notification Bell */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {metrics?.activeAlerts && metrics.activeAlerts > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {metrics?.activeAlerts || 0}
                    </Badge>
                  )}
                </Button>

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

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}