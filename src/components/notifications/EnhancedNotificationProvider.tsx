import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, AlertTriangle, CheckCircle, Info, Wrench, Shield, Activity } from 'lucide-react';

interface EnhancedNotificationContextType {
  notifications: EnhancedNotification[];
  unreadCount: number;
  alertCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  refreshNotifications: () => void;
}

interface EnhancedNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'alert' | 'maintenance' | 'security' | 'info' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

const EnhancedNotificationContext = createContext<EnhancedNotificationContextType | undefined>(undefined);

export const useEnhancedNotifications = () => {
  const context = useContext(EnhancedNotificationContext);
  if (!context) {
    throw new Error('useEnhancedNotifications must be used within an EnhancedNotificationProvider');
  }
  return context;
};

export const EnhancedNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get notifications from the enhanced notifications table
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationError) {
        console.error('Error fetching notifications:', notificationError);
        return;
      }

      // Map the data to match our interface
      const mappedNotifications = (notificationData || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: (item.type || 'info') as 'system' | 'alert' | 'maintenance' | 'security' | 'info' | 'warning' | 'error',
        priority: (item.priority || 'normal') as 'low' | 'normal' | 'high' | 'urgent',
        is_read: Boolean(item.read || item.is_read),
        action_url: item.action_url,
        metadata: item.metadata || null,
        created_at: item.created_at,
        read_at: item.read_at || undefined,
        expires_at: item.expires_at || undefined,
      })) as EnhancedNotification[];

      setNotifications(mappedNotifications);

      // Get active alerts count for the alert badge
      const { data: alertData, error: alertError } = await supabase
        .from('alerts')
        .select('id, severity')
        .eq('is_active', true);

      if (!alertError) {
        setAlertCount(alertData?.length || 0);
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for notifications
    const notificationChannel = supabase
      .channel('enhanced-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as any;
          const mappedNotification: EnhancedNotification = {
            id: newNotification.id,
            title: newNotification.title,
            message: newNotification.message,
            type: newNotification.type || 'info',
            priority: newNotification.priority || 'normal',
            is_read: Boolean(newNotification.read || newNotification.is_read),
            action_url: newNotification.action_url,
            metadata: newNotification.metadata,
            created_at: newNotification.created_at,
            read_at: newNotification.read_at,
            expires_at: newNotification.expires_at,
          };
          setNotifications(prev => [mappedNotification, ...prev]);
          
          // Show toast notification for new high-priority items
          if (mappedNotification.priority === 'urgent' || mappedNotification.priority === 'high') {
            showToastNotification(mappedNotification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const updatedNotification = payload.new as EnhancedNotification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const deletedId = payload.old.id;
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
        }
      )
      .subscribe();

    // Set up real-time subscription for alerts
    const alertChannel = supabase
      .channel('alert-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts'
        },
        () => {
          // Refresh alert count when alerts change
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(alertChannel);
    };
  }, []);

  const showToastNotification = (notification: EnhancedNotification) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'alert': return AlertTriangle;
        case 'maintenance': return Wrench;
        case 'security': return Shield;
        case 'system': return Activity;
        default: return Bell;
      }
    };

    const Icon = getIcon();

    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.priority === 'urgent' ? 'destructive' : 'default',
      action: notification.action_url ? (
        <a href={notification.action_url} className="text-primary underline">
          View
        </a>
      ) : undefined,
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error in deleteNotification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <EnhancedNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        alertCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </EnhancedNotificationContext.Provider>
  );
};