import React, { useEffect, useState } from 'react';
import { Bell, X, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';

interface FeatureNotification {
  id: string;
  type: 'new_feature' | 'role_upgrade' | 'request_approved' | 'announcement';
  title: string;
  message: string;
  feature?: string;
  targetRole?: string;
  timestamp: Date;
  dismissed?: boolean;
}

export const FeatureNotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<FeatureNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { userRole } = useAuth();

  useEffect(() => {
    // Load notifications for current user role
    const loadNotifications = () => {
      // Mock notifications based on role
      const mockNotifications: FeatureNotification[] = [];

      if (userRole === 'field_staff') {
        mockNotifications.push({
          id: '1',
          type: 'new_feature',
          title: 'New Mobile Interface Available!',
          message: 'Access your tasks and updates on mobile devices.',
          feature: 'mobileAccessEnabled',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        });
      }

      if (userRole === 'ops_supervisor') {
        mockNotifications.push({
          id: '2',
          type: 'announcement',
          title: 'Advanced Analytics Now Available',
          message: 'Your role now includes access to forecasting and advanced dashboards.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        });
      }

      // Check for approved feature requests
      const approvedRequests = JSON.parse(localStorage.getItem('approvedFeatureRequests') || '[]');
      approvedRequests.forEach((request: any, index: number) => {
        if (request.userRole === userRole) {
          mockNotifications.push({
            id: `approved_${index}`,
            type: 'request_approved',
            title: 'Feature Request Approved!',
            message: `Your request for ${request.feature} has been approved.`,
            feature: request.feature,
            timestamp: new Date(request.approvedAt),
          });
        }
      });

      const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      const filteredNotifications = mockNotifications.filter(
        notif => !dismissedNotifications.includes(notif.id)
      );

      setNotifications(filteredNotifications);
      setIsVisible(filteredNotifications.length > 0);
    };

    loadNotifications();
  }, [userRole]);

  const dismissNotification = (notificationId: string) => {
    const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    dismissedNotifications.push(notificationId);
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedNotifications));
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  const getNotificationIcon = (type: FeatureNotification['type']) => {
    switch (type) {
      case 'new_feature':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'role_upgrade':
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'request_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationBadgeVariant = (type: FeatureNotification['type']) => {
    switch (type) {
      case 'new_feature':
        return 'default' as const;
      case 'role_upgrade':
        return 'secondary' as const;
      case 'request_approved':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {notifications.map((notification) => (
        <Card key={notification.id} className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {getNotificationIcon(notification.type)}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm text-foreground">
                      {notification.title}
                    </h4>
                    <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {notification.timestamp.toLocaleDateString()} at {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(notification.id)}
                className="h-6 w-6 p-0 hover:bg-destructive/10"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};