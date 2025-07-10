import React from 'react';
import { 
  MessageSquare, 
  Users, 
  CalendarDays, 
  Coffee,
  AlertTriangle,
  Building,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { MobileContainer, MobileGrid, MobileHeader } from '@/components/layout/MobileOptimized';
import { useRealtimeAlerts, useRealtimeNotifications } from '@/hooks/useRealtimeUpdates';

interface QuickStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  href?: string;
}

export const MobileDashboard: React.FC = () => {
  const { user, userRole, isStaff } = useAuth();
  
  // Enable real-time updates
  useRealtimeAlerts();
  useRealtimeNotifications(user?.id);

  // Mock data - in real app, fetch from APIs
  const quickStats: QuickStat[] = [
    {
      label: 'Open Tickets',
      value: 12,
      change: '+3',
      trend: 'up',
      icon: <MessageSquare className="w-5 h-5" />,
      href: '/requests'
    },
    {
      label: 'Visitors Today',
      value: 28,
      change: '+8',
      trend: 'up',
      icon: <Users className="w-5 h-5" />,
      href: '/security'
    },
    {
      label: 'Room Bookings',
      value: 15,
      change: '0',
      trend: 'neutral',
      icon: <CalendarDays className="w-5 h-5" />,
      href: '/bookings'
    },
    {
      label: 'Cafe Orders',
      value: 24,
      change: '+12',
      trend: 'up',
      icon: <Coffee className="w-5 h-5" />,
      href: '/cafeteria'
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      title: 'HVAC System Alert',
      message: 'Temperature sensor reading high on Floor 3',
      severity: 'high',
      time: '10 min ago'
    },
    {
      id: 2,
      title: 'Visitor Overstay',
      message: 'John Doe exceeded visit duration',
      severity: 'medium',
      time: '25 min ago'
    },
    {
      id: 3,
      title: 'Maintenance Complete',
      message: 'Elevator repair completed',
      severity: 'low',
      time: '1 hour ago'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend === 'down') return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
    return null;
  };

  return (
    <MobileContainer>
      <MobileHeader 
        title={`Welcome back${user ? `, ${user.email?.split('@')[0]}` : ''}`}
        subtitle={`${userRole?.replace('_', ' ').toUpperCase()} Dashboard`}
      >
      </MobileHeader>

      <div className="space-y-6 mt-6">
        {/* Quick Stats Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Today's Overview</h2>
          <MobileGrid columns={{ mobile: 2, tablet: 4 }}>
            {quickStats.map((stat, index) => (
              <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {stat.icon}
                    </div>
                    {stat.change && (
                      <div className="flex items-center gap-1 text-xs">
                        {getTrendIcon(stat.trend)}
                        <span className={
                          stat.trend === 'up' ? 'text-green-600' : 
                          stat.trend === 'down' ? 'text-red-600' : 
                          'text-muted-foreground'
                        }>
                          {stat.change}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </MobileGrid>
        </div>

        {/* Active Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-500' :
                      alert.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <MobileGrid columns={{ mobile: 1, tablet: 2 }}>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">New Request</p>
                    <p className="text-xs text-muted-foreground">Submit maintenance request</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Check In Visitor</p>
                    <p className="text-xs text-muted-foreground">Register new visitor</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isStaff && (
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">Building Status</p>
                      <p className="text-xs text-muted-foreground">View system status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </MobileGrid>
        </div>

        {/* Building Info Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="w-4 h-4" />
              Building Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Temperature</span>
                </div>
                <p className="font-semibold">22°C</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Occupancy</span>
                </div>
                <p className="font-semibold">78%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileContainer>
  );
};