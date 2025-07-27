import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Users,
  Building,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Brain,
  Shield,
  Database,
  Activity,
  Zap,
  Globe,
  FileText,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface AnalyticsData {
  totalUsers: number;
  activeBuildings: number;
  monthlyRevenue: number;
  systemHealth: number;
  taskCompletion: number;
  userSatisfaction: number;
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export const AdvancedAdminDashboard = () => {
  const { user } = useAuth();
  
  const [analyticsData] = useState<AnalyticsData>({
    totalUsers: 1247,
    activeBuildings: 15,
    monthlyRevenue: 285000,
    systemHealth: 98,
    taskCompletion: 94,
    userSatisfaction: 4.6
  });

  const [systemAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'High Server Load',
      description: 'Database server experiencing increased load during peak hours',
      timestamp: '2 hours ago',
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Scheduled Maintenance',
      description: 'System maintenance scheduled for this weekend',
      timestamp: '1 day ago',
      resolved: false
    },
    {
      id: '3',
      type: 'critical',
      title: 'Security Update Required',
      description: 'Critical security patch available for immediate deployment',
      timestamp: '3 hours ago',
      resolved: true
    }
  ]);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const quickStats = [
    {
      title: 'Total Users',
      value: analyticsData.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      trend: '+12%',
      trendColor: 'text-green-600'
    },
    {
      title: 'Active Buildings',
      value: analyticsData.activeBuildings.toString(),
      icon: Building,
      color: 'text-green-600',
      trend: '+2',
      trendColor: 'text-green-600'
    },
    {
      title: 'Monthly Revenue',
      value: `$${(analyticsData.monthlyRevenue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'text-purple-600',
      trend: '+8%',
      trendColor: 'text-green-600'
    },
    {
      title: 'System Health',
      value: `${analyticsData.systemHealth}%`,
      icon: Activity,
      color: 'text-emerald-600',
      trend: 'Stable',
      trendColor: 'text-gray-600'
    }
  ];

  const managementTools = [
    { name: 'User Management', icon: Users, path: '/admin/users' },
    { name: 'Building Config', icon: Building, path: '/admin/buildings' },
    { name: 'System Settings', icon: Settings, path: '/admin/settings' },
    { name: 'Security Center', icon: Shield, path: '/admin/security' },
    { name: 'Analytics Hub', icon: BarChart3, path: '/admin/analytics' },
    { name: 'AI Automation', icon: Brain, path: '/admin/ai' },
    { name: 'Database Admin', icon: Database, path: '/admin/database' },
    { name: 'API Gateway', icon: Globe, path: '/admin/api' }
  ];

  const automationRules = [
    {
      name: 'Auto Task Assignment',
      description: 'Automatically assign maintenance tasks based on staff availability',
      enabled: true,
      efficiency: 95
    },
    {
      name: 'Smart Scheduling',
      description: 'Optimize cleaning schedules based on building occupancy',
      enabled: true,
      efficiency: 88
    },
    {
      name: 'Predictive Maintenance',
      description: 'Predict equipment failures before they occur',
      enabled: false,
      efficiency: 0
    },
    {
      name: 'Energy Optimization',
      description: 'Automatically adjust HVAC based on occupancy patterns',
      enabled: true,
      efficiency: 92
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Advanced Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.user_metadata?.first_name || 'Administrator'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
              <Settings className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className={`text-xs ${stat.trendColor}`}>{stat.trend}</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Task Completion Rate</span>
                    <span className="font-medium">{analyticsData.taskCompletion}%</span>
                  </div>
                  <Progress value={analyticsData.taskCompletion} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>User Satisfaction</span>
                    <span className="font-medium">{analyticsData.userSatisfaction}/5.0</span>
                  </div>
                  <Progress value={(analyticsData.userSatisfaction / 5) * 100} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>System Uptime</span>
                    <span className="font-medium">99.8%</span>
                  </div>
                  <Progress value={99.8} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>New user registered: Building Manager</span>
                  <span className="text-muted-foreground ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Task completed: HVAC Maintenance</span>
                  <span className="text-muted-foreground ml-auto">15 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>System backup completed</span>
                  <span className="text-muted-foreground ml-auto">1 hour ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>Security scan completed</span>
                  <span className="text-muted-foreground ml-auto">2 hours ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Automation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {automationRules.map((rule, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{rule.name}</h3>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                    {rule.enabled && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Efficiency:</span>
                        <Progress value={rule.efficiency} className="w-20 h-2" />
                        <span className="text-xs font-medium">{rule.efficiency}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {rule.enabled ? "Configure" : "Enable"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <h3 className="font-semibold">Energy Usage</h3>
                  <p className="text-2xl font-bold text-yellow-600">-15%</p>
                  <p className="text-sm text-muted-foreground">vs last month</p>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-semibold">User Engagement</h3>
                  <p className="text-2xl font-bold text-blue-600">87%</p>
                  <p className="text-sm text-muted-foreground">daily active users</p>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h3 className="font-semibold">Task Efficiency</h3>
                  <p className="text-2xl font-bold text-green-600">+23%</p>
                  <p className="text-sm text-muted-foreground">completion speed</p>
                </div>
              </div>
              
              <Button className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generate Detailed Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Management Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {managementTools.map((tool, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => window.location.href = tool.path}
                  >
                    <tool.icon className="h-6 w-6" />
                    <span className="text-xs text-center">{tool.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                    alert.resolved ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{alert.title}</h3>
                        <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.type}
                        </Badge>
                        {alert.resolved && (
                          <Badge variant="outline">Resolved</Badge>
                        )}
                      </div>
                      <p className="text-sm opacity-80">{alert.description}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs opacity-60">
                        <Clock className="h-3 w-3" />
                        {alert.timestamp}
                      </div>
                    </div>
                    {!alert.resolved && (
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};