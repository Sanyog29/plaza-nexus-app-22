import { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { Bell, BellRing, BellOff, Shield, Wrench, Calendar, MessageSquare, Mail } from "lucide-react";

interface NotificationPreferences {
  maintenance: boolean;
  announcements: boolean;
  security: boolean;
  events: boolean;
  marketing: boolean;
}

export function NotificationSettings() {
  const { profile, updateProfile } = useProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    profile?.notification_preferences || {
      maintenance: true,
      announcements: true,
      security: true,
      events: false,
      marketing: false
    }
  );

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePreferences = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({
        notification_preferences: preferences
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const notificationTypes = [
    {
      key: 'maintenance' as keyof NotificationPreferences,
      title: 'Maintenance Updates',
      description: 'Get notified about maintenance requests and updates',
      icon: Wrench,
      recommended: true
    },
    {
      key: 'security' as keyof NotificationPreferences,
      title: 'Security Alerts',
      description: 'Important security announcements and alerts',
      icon: Shield,
      recommended: true
    },
    {
      key: 'announcements' as keyof NotificationPreferences,
      title: 'Building Announcements',
      description: 'General building news and important updates',
      icon: MessageSquare,
      recommended: true
    },
    {
      key: 'events' as keyof NotificationPreferences,
      title: 'Events & Activities',
      description: 'Community events and building activities',
      icon: Calendar,
      recommended: false
    },
    {
      key: 'marketing' as keyof NotificationPreferences,
      title: 'Promotional Content',
      description: 'Special offers and promotional messages',
      icon: Mail,
      recommended: false
    }
  ];

  const enabledCount = Object.values(preferences).filter(Boolean).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {enabledCount > 0 ? (
            <BellRing className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
            <p className="text-sm text-muted-foreground">
              {enabledCount} of {notificationTypes.length} notification types enabled
            </p>
          </div>
        </div>
        <Button
          onClick={savePreferences}
          disabled={isUpdating}
          size="sm"
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-4">
        {notificationTypes.map(({ key, title, description, icon: Icon, recommended }) => (
          <div key={key} className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-start space-x-3">
              <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground">{title}</span>
                  {recommended && (
                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
            <Switch
              checked={preferences[key]}
              onCheckedChange={() => handleToggle(key)}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">About Notifications</h4>
            <p className="text-sm text-muted-foreground mt-1">
              You can change these preferences at any time. Critical security alerts will always be delivered regardless of your settings.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}