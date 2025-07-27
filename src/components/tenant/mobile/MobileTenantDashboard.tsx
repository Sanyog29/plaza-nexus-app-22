import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Calendar, 
  Wrench, 
  CreditCard, 
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export function MobileTenantDashboard() {
  const { user } = useAuth();

  const quickStats = [
    {
      label: 'Rent Status',
      value: 'Paid',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Active Requests',
      value: '2',
      icon: Wrench,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Next Payment',
      value: 'Feb 1',
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      title: 'Maintenance Scheduled',
      message: 'HVAC maintenance tomorrow 9-11 AM',
      time: '2 hours ago',
      severity: 'info'
    },
    {
      id: 2,
      title: 'Rent Reminder',
      message: 'Rent due in 3 days',
      time: '1 day ago',
      severity: 'warning'
    }
  ];

  const quickActions = [
    { label: 'Book Room', icon: Calendar, color: 'bg-blue-500', href: '/tenant-portal?tab=booking' },
    { label: 'New Request', icon: Wrench, color: 'bg-green-500', href: '/tenant-portal?tab=requests' },
    { label: 'Pay Rent', icon: CreditCard, color: 'bg-purple-500', href: '/tenant-portal?tab=billing' },
    { label: 'Notifications', icon: Bell, color: 'bg-orange-500', href: '/tenant-portal?tab=notifications' }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/20">
              <Home className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Welcome Back!</h2>
              <p className="text-sm text-muted-foreground">Unit 4B • Plaza Nexus</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {quickStats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-3">
              <div className={`inline-flex p-2 rounded-full ${stat.bgColor} mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-lg font-semibold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1 rounded bg-gradient-to-r from-blue-500 to-purple-500">
              <div className="w-3 h-3 bg-white rounded-sm" />
            </div>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-16 flex-col gap-2 text-xs"
                onClick={() => window.location.href = action.href}
              >
                <div className={`p-2 rounded-full ${action.color}`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Recent Alerts
            </div>
            <Badge variant="secondary" className="text-xs">
              {recentAlerts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-sm">{alert.title}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {alert.time}
                </div>
              </div>
              <p className="text-xs opacity-80">{alert.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}