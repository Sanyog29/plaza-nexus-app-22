import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search, Wifi, WifiOff, Download, Home, Shield, Wrench, BarChart3, Settings, Info, BookOpen, Layout, Users, FileText, AlertTriangle, ClipboardList, Brain, Zap, Building, Calendar, ChefHat, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { usePWAContext } from '@/components/PWAProvider';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Link } from 'react-router-dom';
import { SmartBreadcrumb } from '@/components/ui/smart-breadcrumb';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const MobileHeader: React.FC = () => {
  const { user, isAdmin, isStaff, signOut } = useAuth();
  const { isOnline, isInstallable, isInstalled, installApp } = usePWAContext();
  const { metrics } = useDashboardMetrics();
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Initialize breadcrumbs context
  useBreadcrumbs();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const adminMenuItems = [
    { title: "Dashboard", url: "/admin/dashboard", icon: Home },
    { title: "Unified Dashboard", url: "/unified-dashboard", icon: Layout },
    { title: "User Management", url: "/admin/users", icon: Users },
    { title: "Requests", url: "/admin/requests", icon: ClipboardList },
    { title: "Maintenance", url: "/maintenance", icon: Wrench },
    { title: "Security", url: "/security", icon: Shield },
    { title: "Security Guard", url: "/security-guard", icon: Shield },
    { title: "Services", url: "/services", icon: Building },
    { title: "Bookings", url: "/bookings", icon: Calendar },
    { title: "Alerts", url: "/alerts", icon: AlertTriangle },
    { title: "Cafeteria", url: "/cafeteria", icon: ChefHat },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Reports", url: "/admin/reports", icon: BarChart3 },
    { title: "Content", url: "/admin/content", icon: FileText },
    { title: "Info Hub", url: "/info-hub", icon: Info },
    { title: "User Manual", url: "/manual", icon: BookOpen },
    { title: "Operational Excellence", url: "/operational-excellence", icon: Brain },
    { title: "Advanced Features", url: "/advanced-features", icon: Zap },
  ];

  // Streamlined Staff Menu - Essential Tools Only
  const staffMenuItems = [
    { title: "Dashboard", url: "/staff/dashboard", icon: Home },
    { title: "My Tasks", url: "/staff/operations", icon: ClipboardList },
    { title: "Active Requests", url: "/staff/requests", icon: Wrench },
    { title: "Maintenance", url: "/maintenance", icon: Wrench },
    { title: "Security", url: "/security", icon: Shield },
    { title: "Services", url: "/services", icon: Building },
    { title: "System Health", url: "/unified-dashboard", icon: Layout },
    { title: "Alerts", url: "/staff/alerts", icon: AlertTriangle },
    { title: "Reports", url: "/staff/reports", icon: BarChart3 },
    { title: "Settings", url: "/staff/settings", icon: Settings },
  ];

  const getMenuItems = () => {
    if (isAdmin) return adminMenuItems;
    if (isStaff) return staffMenuItems;
    return [];
  };

  if (!user) return null;

  return (
    <header className="md:hidden sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side - Menu & Search */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="py-6">
                <h2 className="text-lg font-semibold mb-4">Plaza Nexus</h2>
                
                {/* User Info */}
                <div className="p-4 bg-muted/50 rounded-lg mb-4">
                  <div className="font-medium">{user.email?.split('@')[0]}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {isAdmin ? 'Admin' : isStaff ? 'Staff' : 'Tenant'}
                  </div>
                </div>

                {/* Navigation Menu for Staff/Admin */}
                {(isAdmin || isStaff) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      {isAdmin ? 'Admin Tools' : 'Staff Tools'}
                    </h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {getMenuItems().map((item) => (
                        <Link
                          key={item.title}
                          to={item.url}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-2 mt-6">
                  {isInstallable && !isInstalled && (
                    <Button
                      onClick={installApp}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Install App
                    </Button>
                  )}
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {!searchOpen ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          ) : (
            <div className="flex-1 max-w-xs">
              <Input
                placeholder="Search..."
                className="h-8"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Center - Title */}
        <h1 className="font-semibold text-sm">Plaza Nexus</h1>

        {/* Right side - Status indicators */}
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationCenter />
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-4 py-2 border-t border-border/20">
        <SmartBreadcrumb showIcons={false} showHomeIcon={true} maxItems={2} />
      </div>
    </header>
  );
};