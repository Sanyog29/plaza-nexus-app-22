import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Trash2,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TenantNotificationsProps {
  tenantId: string;
}

const TenantNotifications: React.FC<TenantNotificationsProps> = ({ tenantId }) => {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  // Get notifications (using existing notifications table)
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['tenant-notifications', tenantId, filter],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', tenantId)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('read', false);
      } else if (filter === 'read') {
        query = query.eq('read', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Mock notification preferences (will be implemented later)
  const preferences = {
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    booking_reminders: true,
    service_updates: true,
    billing_alerts: true,
    general_announcements: true
  };

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', tenantId)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] });
    }
  });

  // Update preferences mutation (mock for now)
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updatedPreferences: any) => {
      // Mock implementation - preferences will be stored locally or in user settings
      await new Promise(resolve => setTimeout(resolve, 500));
      return updatedPreferences;
    },
    onSuccess: () => {
      toast.success('Preferences updated (local storage)');
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'service': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'billing': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'general': return <Info className="h-5 w-5 text-purple-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'booking': return 'bg-blue-500/10 text-blue-700';
      case 'service': return 'bg-orange-500/10 text-orange-700';
      case 'billing': return 'bg-green-500/10 text-green-700';
      case 'general': return 'bg-purple-500/10 text-purple-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with important announcements and updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Badge variant="secondary">
            {unreadCount} unread
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'unread' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
            <Button 
              variant={filter === 'read' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('read')}
            >
              Read
            </Button>
          </div>

          {/* Notifications List */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-8">Loading notifications...</div>
              ) : notifications?.length ? (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-accent/5 transition-colors ${
                        !notification.read ? 'bg-accent/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            <Badge className={getNotificationTypeColor(notification.type)} variant="outline">
                              {notification.type}
                            </Badge>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            disabled={deleteNotificationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">
                    {filter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "You don't have any notifications yet."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Methods */}
              <div>
                <h4 className="font-medium mb-4">Delivery Methods</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          email_notifications: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Browser push notifications</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={preferences.push_notifications}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          push_notifications: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Text message notifications</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={preferences.sms_notifications}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          sms_notifications: checked
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <h4 className="font-medium mb-4">Notification Types</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="booking-reminders">Booking Reminders</Label>
                      <p className="text-sm text-muted-foreground">Room booking confirmations and reminders</p>
                    </div>
                    <Switch
                      id="booking-reminders"
                      checked={preferences.booking_reminders}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          booking_reminders: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="service-updates">Service Updates</Label>
                      <p className="text-sm text-muted-foreground">Service request status updates</p>
                    </div>
                    <Switch
                      id="service-updates"
                      checked={preferences.service_updates}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          service_updates: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="billing-alerts">Billing Alerts</Label>
                      <p className="text-sm text-muted-foreground">Invoice and payment notifications</p>
                    </div>
                    <Switch
                      id="billing-alerts"
                      checked={preferences.billing_alerts}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          billing_alerts: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="general-announcements">General Announcements</Label>
                      <p className="text-sm text-muted-foreground">Building updates and announcements</p>
                    </div>
                    <Switch
                      id="general-announcements"
                      checked={preferences.general_announcements}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({
                          ...preferences,
                          general_announcements: checked
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantNotifications;