import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  installApp: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWAContext = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within PWAProvider');
  }
  return context;
};

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isInstalled, isInstallable, installApp, requestNotificationPermission, sendNotification } = usePWA();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost - working offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Show install prompt after user has been active for 30 seconds
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    await installApp();
    setShowInstallPrompt(false);
  };

  const contextValue: PWAContextType = {
    isInstalled,
    isInstallable,
    isOnline,
    installApp,
    requestNotificationPermission,
    sendNotification
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* Connection Status Indicator */}
      {!isOnline && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-3 flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">Offline Mode</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && isInstallable && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <Card className="bg-card/95 backdrop-blur border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Install App
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstallPrompt(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Install Plaza Nexus for quick access and offline functionality
              </p>
              <div className="flex gap-2">
                <Button onClick={handleInstall} size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInstallPrompt(false)}
                >
                  Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PWAContext.Provider>
  );
};