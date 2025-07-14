import React, { useEffect } from 'react';

interface PWANotificationManagerProps {
  children: React.ReactNode;
}

export const PWANotificationManager: React.FC<PWANotificationManagerProps> = ({ children }) => {
  useEffect(() => {
    // Request notification permission
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }
    };

    // Register service worker for push notifications
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
          
          // Skip push notification subscription for now to avoid the base64url error
          // This would require proper VAPID key configuration
          console.log('Service Worker registered successfully');
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    requestNotificationPermission();
    registerServiceWorker();

    // Listen for app installation prompt
    let deferredPrompt: any;
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return <>{children}</>;
};