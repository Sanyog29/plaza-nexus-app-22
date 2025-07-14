import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Zap,
  TrendingUp,
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  Settings,
  Plus,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { QuickActions } from './QuickActions';
import { SmartNotifications } from './SmartNotifications';
import { RecentActivity } from './RecentActivity';

interface UnifiedDashboardProps {
  userRole: 'admin' | 'staff' | 'tenant';
}

export function UnifiedDashboard({ userRole }: UnifiedDashboardProps) {
  const { user } = useAuth();
  const { metrics, isLoading } = useDashboardMetrics();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWidgets, setActiveWidgets] = useState<string[]>([]);

  // Role-based widget visibility
  useEffect(() => {
    const defaultWidgets = {
      admin: ['overview', 'quick-actions', 'analytics', 'users', 'financial', 'system-health', 'notifications', 'activity'],
      staff: ['overview', 'quick-actions', 'my-tasks', 'performance', 'system-health', 'notifications', 'activity'],
      tenant: ['overview', 'quick-actions', 'my-requests', 'bookings', 'notifications', 'activity']
    };
    
    setActiveWidgets(defaultWidgets[userRole] || defaultWidgets.tenant);
  }, [userRole]);

  const renderOverviewCard = () => (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Overview</CardTitle>
        <Activity className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{metrics?.totalRequests || 0}</div>
            <div className="text-xs text-muted-foreground">Total Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{metrics?.activeRequests || 0}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAnalyticsCard = () => (
    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Analytics</CardTitle>
        <BarChart3 className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">SLA Compliance</span>
            <Badge variant="secondary">96.2%</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Avg Response</span>
            <Badge variant="outline">2.3h</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Satisfaction</span>
            <Badge variant="secondary">4.7/5</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderUsersCard = () => (
    <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Users</CardTitle>
        <Users className="h-4 w-4 text-green-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Total Users</span>
            <span className="font-medium">1,247</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Active Today</span>
            <span className="font-medium text-green-500">342</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">New This Week</span>
            <span className="font-medium text-blue-500">23</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFinancialCard = () => (
    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Financial</CardTitle>
        <TrendingUp className="h-4 w-4 text-purple-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Monthly Budget</span>
            <span className="font-medium">$50,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Spent</span>
            <span className="font-medium text-red-500">$32,450</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Remaining</span>
            <span className="font-medium text-green-500">$17,550</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMyTasksCard = () => (
    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
        <ClipboardList className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Pending</span>
            <Badge variant="destructive">8</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">In Progress</span>
            <Badge variant="secondary">3</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Completed Today</span>
            <Badge variant="outline">5</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMyRequestsCard = () => (
    <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">My Requests</CardTitle>
        <ClipboardList className="h-4 w-4 text-indigo-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Open</span>
            <Badge variant="destructive">3</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">In Progress</span>
            <Badge variant="secondary">2</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Resolved</span>
            <Badge variant="outline">15</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSystemHealthCard = () => (
    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
        <CheckCircle className="h-4 w-4 text-emerald-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm">All Systems Operational</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Uptime</span>
            <span className="font-medium text-emerald-500">99.9%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Active Alerts</span>
            <Badge variant={metrics?.activeAlerts > 0 ? "destructive" : "secondary"}>
              {metrics?.activeAlerts || 0}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const widgetComponents = {
    'overview': renderOverviewCard(),
    'analytics': renderAnalyticsCard(),
    'users': renderUsersCard(),
    'financial': renderFinancialCard(),
    'my-tasks': renderMyTasksCard(),
    'my-requests': renderMyRequestsCard(),
    'system-health': renderSystemHealthCard(),
    'quick-actions': <QuickActions userRole={userRole} />,
    'notifications': <SmartNotifications userRole={userRole} />,
    'activity': <RecentActivity userRole={userRole} />
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {userRole === 'admin' ? 'Admin Dashboard' : 
             userRole === 'staff' ? 'Staff Dashboard' : 
             'My Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'admin' ? 'Complete system overview and management' :
             userRole === 'staff' ? 'Task management and performance tracking' :
             'Your service requests and facility access'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur"
            />
          </div>
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeWidgets.map((widgetKey) => (
          <div key={widgetKey} className="animate-fade-in">
            {widgetComponents[widgetKey]}
          </div>
        ))}
      </div>
    </div>
  );
}