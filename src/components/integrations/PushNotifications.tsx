import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Send,
  Globe,
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface NotificationSettings {
  maintenance_requests: boolean;
  sla_breaches: boolean;
  system_alerts: boolean;
  user_approvals: boolean;
  vendor_orders: boolean;
  security_events: boolean;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function PushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    maintenance_requests: true,
    sla_breaches: true,
    system_alerts: true,
    user_approvals: false,
    vendor_orders: false,
    security_events: true
  });

  useEffect(() => {
    checkNotificationSupport();
    loadUserSettings();
  }, []);

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  };

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setIsSubscribed(true);
        setSubscription(existingSubscription.toJSON() as PushSubscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadUserSettings = () => {
    // Load from localStorage or API
    const saved = localStorage.getItem('push-notification-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPush();
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications"
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications are disabled",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive"
      });
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // You would typically get this from your server
      const vapidPublicKey = 'your-vapid-public-key';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      const subscriptionData = subscription.toJSON() as PushSubscription;
      setSubscription(subscriptionData);
      setIsSubscribed(true);

      // Save subscription to your server
      // await saveSubscriptionToServer(subscriptionData);
      
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Subscription Failed",
        description: "Could not subscribe to push notifications",
        variant: "destructive"
      });
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        setSubscription(null);
        
        toast({
          title: "Unsubscribed",
          description: "Push notifications have been disabled"
        });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe from notifications",
        variant: "destructive"
      });
    }
  };

  const updateSettings = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('push-notification-settings', JSON.stringify(newSettings));
    
    // Update on server
    // await updateUserNotificationSettings(newSettings);
  };

  const sendTestNotification = async () => {
    if (permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from Plaza Nexus',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test',
        requireInteraction: false
      });
      
      toast({
        title: "Test Sent",
        description: "Check for the notification"
      });
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { icon: CheckCircle, color: 'text-green-600', text: 'Enabled' };
      case 'denied':
        return { icon: AlertCircle, color: 'text-red-600', text: 'Denied' };
      default:
        return { icon: Bell, color: 'text-yellow-600', text: 'Not Set' };
    }
  };

  const status = getPermissionStatus();
  const StatusIcon = status.icon;

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Push Notifications Not Supported</h3>
          <p className="text-muted-foreground">
            Your browser doesn't support push notifications or you're not using HTTPS.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Push Notifications</h2>
          <p className="text-muted-foreground">
            Configure browser and mobile push notifications
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <StatusIcon className={`h-3 w-3 ${status.color}`} />
          {status.text}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permission & Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Browser Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Permission Status</Label>
                <p className="text-sm text-muted-foreground">
                  {permission === 'granted' ? 'Notifications are enabled' :
                   permission === 'denied' ? 'Notifications are blocked' :
                   'Permission not requested'}
                </p>
              </div>
              <StatusIcon className={`h-6 w-6 ${status.color}`} />
            </div>

            {permission === 'default' && (
              <Button onClick={requestPermission} className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </Button>
            )}

            {permission === 'granted' && !isSubscribed && (
              <Button onClick={subscribeToPush} className="w-full">
                <Smartphone className="h-4 w-4 mr-2" />
                Subscribe to Push
              </Button>
            )}

            {permission === 'granted' && isSubscribed && (
              <div className="space-y-2">
                <Button onClick={sendTestNotification} variant="outline" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
                <Button onClick={unsubscribeFromPush} variant="destructive" className="w-full">
                  <BellOff className="h-4 w-4 mr-2" />
                  Unsubscribe
                </Button>
              </div>
            )}

            {permission === 'denied' && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive">
                  Notifications are blocked. Enable them in your browser settings:
                  <br />• Chrome: Site Settings → Notifications
                  <br />• Firefox: Page Info → Permissions
                  <br />• Safari: Website Settings → Notifications
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label 
                  htmlFor={key}
                  className="text-sm font-medium capitalize cursor-pointer"
                >
                  {key.replace(/_/g, ' ')}
                </Label>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => updateSettings(key as keyof NotificationSettings, checked)}
                  disabled={permission !== 'granted'}
                />
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">Notification Timing</Label>
              <Select defaultValue="immediate">
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="batched">Batched (every 30 min)</SelectItem>
                  <SelectItem value="daily">Daily Summary</SelectItem>
                  <SelectItem value="business_hours">Business Hours Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent Today</p>
                <p className="text-2xl font-bold">47</p>
              </div>
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">234</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold">94.2%</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}