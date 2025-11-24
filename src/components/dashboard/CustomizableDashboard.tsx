import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  BarChart3, 
  Users, 
  Wrench, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useRequestCounts } from '@/hooks/useRequestCounts';

interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'status';
  size: 'small' | 'medium' | 'large';
  data?: any;
  visible: boolean;
}

interface CustomizableDashboardProps {
  userRole: 'admin' | 'staff' | 'tenant';
}

export function CustomizableDashboard({ userRole }: CustomizableDashboardProps) {
  const { user } = useAuth();
  const { isLoadingProperties } = usePropertyContext();
  const { counts, isLoading: isLoadingCounts } = useRequestCounts();
  const navigate = useNavigate();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  // Show loading state while PropertyContext or counts are loading
  if (isLoadingProperties || isLoadingCounts) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50 backdrop-blur animate-pulse">
              <CardContent className="p-6 h-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getDefaultWidgets = (role: string): DashboardWidget[] => {
    const baseWidgets: DashboardWidget[] = [
      {
        id: 'requests-overview',
        title: 'Requests Overview',
        type: 'metric',
        size: 'medium',
        visible: true,
        data: {
          total: counts.totalRequests,
          active: counts.activeRequests,
          completed: counts.completedRequests
        }
      },
      {
        id: 'recent-activity',
        title: 'Recent Activity',
        type: 'list',
        size: 'large',
        visible: true
      },
      {
        id: 'system-health',
        title: 'System Health',
        type: 'status',
        size: 'small',
        visible: true,
        data: {
          status: 'healthy',
          uptime: '99.9%',
          alerts: 0
        }
      }
    ];

    if (role === 'admin') {
      baseWidgets.push(
        {
          id: 'user-analytics',
          title: 'User Analytics',
          type: 'chart',
          size: 'medium',
          visible: true,
          data: {
            totalUsers: 1247,
            activeToday: 342,
            newThisWeek: 23
          }
        },
        {
          id: 'financial-overview',
          title: 'Financial Overview',
          type: 'metric',
          size: 'medium',
          visible: true,
          data: {
            monthlyBudget: 50000,
            spent: 32450,
            savings: 17550
          }
        },
        {
          id: 'compliance-status',
          title: 'Compliance Status',
          type: 'status',
          size: 'small',
          visible: true,
          data: {
            slaCompliance: 94.2,
            auditScore: 98.5
          }
        }
      );
    }

    if (role === 'staff') {
      baseWidgets.push(
        {
          id: 'my-tasks',
          title: 'My Tasks',
          type: 'list',
          size: 'medium',
          visible: true,
          data: {
            pending: 8,
            inProgress: 3,
            completed: 42
          }
        },
        {
          id: 'performance-metrics',
          title: 'My Performance',
          type: 'metric',
          size: 'medium',
          visible: true,
          data: {
            efficiency: 94,
            quality: 89,
            slaCompliance: 96
          }
        }
      );
    }

    return baseWidgets;
  };

  useEffect(() => {
    const savedLayout = localStorage.getItem(`dashboard-layout-${userRole}-${user?.id}`);
    if (savedLayout) {
      setWidgets(JSON.parse(savedLayout));
    } else {
      setWidgets(getDefaultWidgets(userRole));
    }
  }, [userRole, user?.id]);

  const saveLayout = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(`dashboard-layout-${userRole}-${user?.id}`, JSON.stringify(newWidgets));
  };

  const toggleWidget = (widgetId: string) => {
    const newWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
    );
    saveLayout(newWidgets);
  };

  const resetToDefault = () => {
    const defaultWidgets = getDefaultWidgets(userRole);
    saveLayout(defaultWidgets);
    setIsCustomizing(false);
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.visible) return null;

    // Force requests-overview to be full width
    const displaySize = widget.id === 'requests-overview' ? 'large' : widget.size;
    
    const sizeClasses = {
      small: 'col-span-1',
      medium: 'col-span-2',
      large: 'col-span-3'
    };

    return (
      <Card key={widget.id} className={`bg-card/50 backdrop-blur ${sizeClasses[displaySize]}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">
            {widget.title}
          </CardTitle>
          {widget.type === 'metric' && (
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          {widget.type === 'metric' && renderMetricWidget(widget)}
          {widget.type === 'status' && renderStatusWidget(widget)}
          {widget.type === 'list' && renderListWidget(widget)}
          {widget.type === 'chart' && renderChartWidget(widget)}
        </CardContent>
      </Card>
    );
  };

  const renderMetricWidget = (widget: DashboardWidget) => {
    const { data } = widget;
    
    if (widget.id === 'requests-overview') {
      // Determine routes based on role
      const getRouteForStatus = (status: 'all' | 'in_progress' | 'completed') => {
        const baseRoute = userRole === 'admin' ? '/admin/requests' : 
                          userRole === 'staff' ? '/staff/requests' : 
                          '/requests';
        return status === 'all' ? baseRoute : `${baseRoute}?status=${status}`;
      };

      return (
        <div className="grid grid-cols-3 gap-2 text-center">
           <div className="cursor-pointer hover:bg-white/5 rounded p-2 transition-colors" 
                onClick={() => navigate(getRouteForStatus('all'))}>
             <div className="text-2xl font-bold text-foreground">{counts.totalRequests}</div>
             <div className="text-xs text-muted-foreground">Total</div>
           </div>
           <div className="cursor-pointer hover:bg-white/5 rounded p-2 transition-colors" 
                onClick={() => navigate(getRouteForStatus('in_progress'))}>
             <div className="text-2xl font-bold text-blue-400">{counts.activeRequests}</div>
             <div className="text-xs text-muted-foreground">Active</div>
           </div>
           <div className="cursor-pointer hover:bg-white/5 rounded p-2 transition-colors" 
                onClick={() => navigate(getRouteForStatus('completed'))}>
             <div className="text-2xl font-bold text-green-400">{counts.completedRequests}</div>
             <div className="text-xs text-muted-foreground">Completed</div>
           </div>
        </div>
      );
    }

    if (widget.id === 'financial-overview') {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Budget</span>
            <span className="text-sm font-medium">${data?.monthlyBudget?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Spent</span>
            <span className="text-sm font-medium text-red-400">${data?.spent?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Remaining</span>
            <span className="text-sm font-medium text-green-400">${data?.savings?.toLocaleString()}</span>
          </div>
        </div>
      );
    }

    if (widget.id === 'performance-metrics') {
      return (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xl font-bold text-green-400">{data?.efficiency}%</div>
            <div className="text-xs text-muted-foreground">Efficiency</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-400">{data?.quality}%</div>
            <div className="text-xs text-muted-foreground">Quality</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-400">{data?.slaCompliance}%</div>
            <div className="text-xs text-muted-foreground">SLA</div>
          </div>
        </div>
      );
    }

    return <div className="text-center text-muted-foreground">No data available</div>;
  };

  const renderStatusWidget = (widget: DashboardWidget) => {
    const { data } = widget;

    if (widget.id === 'system-health') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm">System Online</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Uptime</span>
            <span className="text-green-400">{data?.uptime}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Alerts</span>
            <Badge variant={data?.alerts > 0 ? "destructive" : "secondary"}>
              {data?.alerts || 0}
            </Badge>
          </div>
        </div>
      );
    }

    if (widget.id === 'compliance-status') {
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>SLA Compliance</span>
            <span className="text-green-400">{data?.slaCompliance}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Audit Score</span>
            <span className="text-blue-400">{data?.auditScore}%</span>
          </div>
        </div>
      );
    }

    return <div className="text-center text-muted-foreground">Status unknown</div>;
  };

  const renderListWidget = (widget: DashboardWidget) => {
    if (widget.id === 'recent-activity') {
      const activities = [
        { action: 'New request created', time: '2 minutes ago', type: 'request' },
        { action: 'User role updated', time: '15 minutes ago', type: 'admin' },
        { action: 'Maintenance completed', time: '1 hour ago', type: 'completion' },
        { action: 'New visitor registered', time: '2 hours ago', type: 'visitor' }
      ];

      return (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <span className="text-sm">{activity.action}</span>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      );
    }

    if (widget.id === 'my-tasks') {
      const { data } = widget;
      return (
        <div className="space-y-2">
          <div className="flex justify-between p-2 bg-yellow-500/10 rounded">
            <span className="text-sm">Pending Tasks</span>
            <Badge variant="outline">{data?.pending || 0}</Badge>
          </div>
          <div className="flex justify-between p-2 bg-blue-500/10 rounded">
            <span className="text-sm">In Progress</span>
            <Badge variant="outline">{data?.inProgress || 0}</Badge>
          </div>
          <div className="flex justify-between p-2 bg-green-500/10 rounded">
            <span className="text-sm">Completed</span>
            <Badge variant="outline">{data?.completed || 0}</Badge>
          </div>
        </div>
      );
    }

    return <div className="text-center text-muted-foreground">No activities</div>;
  };

  const renderChartWidget = (widget: DashboardWidget) => {
    if (widget.id === 'user-analytics') {
      const { data } = widget;
      return (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data?.totalUsers?.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-400">{data?.activeToday}</div>
              <div className="text-xs text-muted-foreground">Active Today</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-400">{data?.newThisWeek}</div>
              <div className="text-xs text-muted-foreground">New This Week</div>
            </div>
          </div>
        </div>
      );
    }

    return <div className="text-center text-muted-foreground">Chart not available</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header with customization controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={isCustomizing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isCustomizing ? 'Done' : 'Customize'}
          </Button>
          {isCustomizing && (
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Customization panel */}
      {isCustomizing && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Widget Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {widgets.map(widget => (
                <Button
                  key={widget.id}
                  variant={widget.visible ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleWidget(widget.id)}
                  className="justify-start"
                >
                  {widget.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {widgets.filter(w => w.visible).map(renderWidget)}
      </div>
    </div>
  );
}