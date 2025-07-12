import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, ShoppingBag, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'alert' | 'promotion' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let subscription: any;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get initial notifications
      const { data: initialNotifications } = await supabase
        .from('vendor_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (initialNotifications) {
        setNotifications(initialNotifications as Notification[]);
      }

      // Set up real-time subscription for new notifications
      subscription = supabase
        .channel('vendor-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'vendor_notifications',
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            
            // Show toast notification
            showToastNotification(newNotification);
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const showToastNotification = (notification: Notification) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'order': return ShoppingBag;
        case 'alert': return AlertTriangle;
        case 'payment': return CheckCircle;
        default: return Bell;
      }
    };

    const Icon = getIcon();

    toast({
      title: notification.title,
      description: notification.message,
      duration: notification.priority === 'urgent' ? 8000 : 5000,
      action: notification.action_url ? (
        <a href={notification.action_url} className="underline">
          View
        </a>
      ) : undefined,
    });

    // Request permission for browser notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('vendor_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('vendor_notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, is_read: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};