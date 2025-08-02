import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Home, 
  Calendar, 
  Wrench, 
  CreditCard, 
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight,
  Zap,
  Coffee,
  Wifi,
  Users,
  MapPin,
  TrendingUp,
  Activity,
  Star
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export function MobileTenantDashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Enhanced data with more personalization
  const personalStats = [
    {
      label: 'Rent Status',
      value: 'Paid',
      subtitle: 'Due: Feb 28',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      progress: 100,
      trend: 'positive'
    },
    {
      label: 'Active Requests',
      value: '2',
      subtitle: '1 in progress',
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      progress: 60,
      trend: 'neutral'
    },
    {
      label: 'My Rating',
      value: '4.8',
      subtitle: 'Tenant score',
      icon: Star,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      progress: 96,
      trend: 'positive'
    }
  ];

  const smartActions = [
    { 
      label: 'Book Meeting Room', 
      icon: Calendar, 
      gradient: 'from-blue-500 to-blue-600',
      description: 'Reserve spaces',
      href: '/tenant-portal?tab=booking',
      popular: true
    },
    { 
      label: 'Report Issue', 
      icon: Plus, 
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Quick request',
      href: '/tenant-portal?tab=requests',
      urgent: false
    },
    { 
      label: 'Pay Bills', 
      icon: CreditCard, 
      gradient: 'from-purple-500 to-purple-600',
      description: 'Manage payments',
      href: '/tenant-portal?tab=billing',
      urgent: false
    },
    { 
      label: 'Building Services', 
      icon: Coffee, 
      gradient: 'from-orange-500 to-orange-600',
      description: 'Food & amenities',
      href: '/tenant-portal?tab=services',
      new: true
    }
  ];

  const todaySchedule = [
    {
      id: 1,
      time: '09:00',
      title: 'Meeting Room B booked',
      type: 'booking',
      status: 'upcoming'
    },
    {
      id: 2,
      time: '14:30',
      title: 'HVAC Maintenance',
      type: 'maintenance',
      status: 'scheduled'
    }
  ];

  const buildingInsights = [
    {
      title: 'Building Temperature',
      value: '22°C',
      icon: Activity,
      status: 'optimal'
    },
    {
      title: 'Occupancy Level',
      value: '78%',
      icon: Users,
      status: 'busy'
    },
    {
      title: 'WiFi Status',
      value: 'Excellent',
      icon: Wifi,
      status: 'good'
    }
  ];

  const recentUpdates = [
    {
      id: 1,
      title: 'New Cafeteria Menu',
      message: 'Fresh options available this week',
      time: '2 hours ago',
      type: 'announcement',
      icon: Coffee
    },
    {
      id: 2,
      title: 'Maintenance Update',
      message: 'Elevator maintenance completed',
      time: '4 hours ago',
      type: 'maintenance',
      icon: CheckCircle
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': 
      case 'good': 
        return 'text-emerald-600 bg-emerald-50';
      case 'busy': 
        return 'text-amber-600 bg-amber-50';
      case 'warning': 
        return 'text-orange-600 bg-orange-50';
      default: 
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Personalized Welcome Header */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/10 overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'T'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}!</h2>
                <p className="text-muted-foreground">Unit 4B • Plaza Nexus Tower</p>
                <p className="text-sm text-muted-foreground">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="p-2 rounded-full bg-primary/10">
              <Home className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {personalStats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-xl ${stat.bgColor} mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs font-medium text-muted-foreground">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.subtitle}</div>
              </div>
              <Progress value={stat.progress} className="h-1 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Smart Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-primary to-accent">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            {smartActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="lg"
                className="h-20 flex-col gap-2 p-4 border-muted hover:border-primary/20 group relative"
                onClick={() => window.location.href = action.href}
              >
                {action.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-xs px-1.5">
                    Popular
                  </Badge>
                )}
                {action.new && (
                  <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-xs px-1.5">
                    New
                  </Badge>
                )}
                <div className={`p-3 rounded-xl bg-gradient-to-r ${action.gradient} group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Today's Schedule</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {todaySchedule.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className="text-center min-w-[50px]">
                  <div className="text-sm font-semibold text-primary">{item.time}</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {item.type}
                  </Badge>
                </div>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Building Insights */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <span>Building Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4">
            {buildingInsights.map((insight, index) => (
              <div key={index} className="text-center space-y-2">
                <div className={`inline-flex p-2 rounded-lg ${getStatusColor(insight.status)}`}>
                  <insight.icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold">{insight.value}</div>
                <div className="text-xs text-muted-foreground">{insight.title}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <span>Recent Updates</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {recentUpdates.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {recentUpdates.map((update) => (
              <div key={update.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <update.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-medium">{update.title}</div>
                  <div className="text-xs text-muted-foreground">{update.message}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {update.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}