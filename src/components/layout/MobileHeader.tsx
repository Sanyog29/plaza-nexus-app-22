import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search, Bell, Wifi, WifiOff, Download } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { usePWAContext } from '@/components/PWAProvider';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export const MobileHeader: React.FC = () => {
  const { user } = useAuth();
  const { isOnline, isInstallable, isInstalled, installApp } = usePWAContext();
  const { metrics } = useDashboardMetrics();
  const [searchOpen, setSearchOpen] = useState(false);

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
                  <div className="text-sm text-muted-foreground capitalize">{user.role}</div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
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

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="p-2 relative">
            <Bell className="h-5 w-5" />
            {metrics.activeAlerts > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
              >
                {metrics.activeAlerts > 9 ? '9+' : metrics.activeAlerts}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};