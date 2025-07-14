import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  X
} from 'lucide-react';

interface SmartNotificationsProps {
  userRole: 'admin' | 'staff' | 'tenant';
}

export function SmartNotifications({ userRole }: SmartNotificationsProps) {
  const getNotifications = () => {
    switch (userRole) {
      case 'admin':
        return [
          { 
            id: 1, 
            type: 'urgent', 
            icon: AlertTriangle, 
            title: 'SLA Breach Alert', 
            message: '3 requests approaching deadline',
            time: '5 min ago',
            color: 'text-red-500'
          },
          { 
            id: 2, 
            type: 'info', 
            icon: Info, 
            title: 'System Update', 
            message: 'Maintenance window scheduled for tonight',
            time: '1 hour ago',
            color: 'text-blue-500'
          },
          { 
            id: 3, 
            type: 'success', 
            icon: CheckCircle, 
            title: 'Monthly Report', 
            message: 'Performance metrics improved by 12%',
            time: '2 hours ago',
            color: 'text-green-500'
          },
        ];
      case 'staff':
        return [
          { 
            id: 1, 
            type: 'urgent', 
            icon: Clock, 
            title: 'Task Due Soon', 
            message: 'HVAC maintenance due in 30 minutes',
            time: 'Just now',
            color: 'text-orange-500'
          },
          { 
            id: 2, 
            type: 'info', 
            icon: Info, 
            title: 'New Assignment', 
            message: 'Electrical inspection assigned to you',
            time: '15 min ago',
            color: 'text-blue-500'
          },
        ];
      default:
        return [
          { 
            id: 1, 
            type: 'success', 
            icon: CheckCircle, 
            title: 'Request Completed', 
            message: 'AC repair in your office is done',
            time: '10 min ago',
            color: 'text-green-500'
          },
          { 
            id: 2, 
            type: 'info', 
            icon: Info, 
            title: 'Booking Confirmed', 
            message: 'Conference room B2 reserved for tomorrow',
            time: '1 hour ago',
            color: 'text-blue-500'
          },
        ];
    }
  };

  const notifications = getNotifications();

  return (
    <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Notifications</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            {notifications.length}
          </Badge>
          <Bell className="h-4 w-4 text-red-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className="flex items-start gap-3 p-2 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
            >
              <notification.icon className={`h-4 w-4 mt-0.5 ${notification.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        {notifications.length > 3 && (
          <Button variant="outline" size="sm" className="w-full mt-3">
            View All Notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
}