import React, { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { useOptimizedAdminMetrics } from '@/hooks/useOptimizedAdminMetrics';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Brain
} from 'lucide-react';

// Lazy load heavy components
const AdvancedAnalytics = lazy(() => import('@/components/admin/AdvancedAnalytics').then(m => ({ default: m.AdvancedAnalytics })));
const StaffWorkloadBalancer = lazy(() => import('@/components/admin/StaffWorkloadBalancer'));
const EnhancedHelpSystem = lazy(() => import('@/components/help/EnhancedHelpSystem').then(m => ({ default: m.EnhancedHelpSystem })));
const PerformanceMonitoringDashboard = lazy(() => import('@/components/admin/PerformanceMonitoringDashboard').then(m => ({ default: m.PerformanceMonitoringDashboard })));

const OptimizedAdminDashboard = () => {
  const navigate = useNavigate();
  const { 
    metrics, 
    isLoading, 
    error, 
    isRealTimeActive, 
    lastFetch,
    refreshMetrics,
    getHealthSummary 
  } = useOptimizedAdminMetrics();

  const healthSummary = getHealthSummary();

  const quickStats = [
    {
      title: 'Active Requests',
      value: metrics.activeRequests,
      icon: Clock,
      color: metrics.urgentRequests > 0 ? 'text-red-500' : 'text-blue-500',
      change: metrics.urgentRequests > 0 ? `${metrics.urgentRequests} urgent` : 'Normal load'
    },
    {
      title: 'Completed Today',
      value: metrics.completedToday,
      icon: CheckCircle,
      color: 'text-green-500',
      change: `Avg ${metrics.avgResponseTime}m response`
    },
    {
      title: 'System Health',
      value: metrics.systemUptime.toFixed(1) + '%',
      icon: Activity,
      color: metrics.systemHealth === 'healthy' ? 'text-green-500' : 
             metrics.systemHealth === 'warning' ? 'text-yellow-500' : 'text-red-500',
      change: metrics.systemHealth
    },
    {
      title: 'Staff Utilization',
      value: metrics.staffUtilization + '%',
      icon: Users,
      color: 'text-blue-500',
      change: 'Balanced workload'
    }
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Optimized system overview with real-time monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={isRealTimeActive ? "default" : "secondary"}>
            {isRealTimeActive ? "Live" : "Offline"}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshMetrics}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {(metrics.urgentRequests > 0 || metrics.slaBreaches > 0 || metrics.criticalAlerts > 0) && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {metrics.urgentRequests > 0 && (
                    <Badge variant="destructive">
                      {metrics.urgentRequests} Urgent Requests
                    </Badge>
                  )}
                  {metrics.slaBreaches > 0 && (
                    <Badge variant="destructive">
                      {metrics.slaBreaches} SLA Breaches
                    </Badge>
                  )}
                  {metrics.criticalAlerts > 0 && (
                    <Badge variant="destructive">
                      {metrics.criticalAlerts} Critical Alerts
                    </Badge>
                  )}
                </div>
              </div>
              <Button size="sm" onClick={() => navigate('/requests')}>
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <IconComponent className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary">
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-primary">
            Performance
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary">
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="management" className="data-[state=active]:bg-primary">
            Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Health Summary */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Status</span>
                    <Badge variant={
                      healthSummary.overall === 'healthy' ? 'default' :
                      healthSummary.overall === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {healthSummary.overall}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>System Uptime</span>
                      <span>{metrics.systemUptime.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.systemUptime} className="h-2" />
                  </div>

                  {healthSummary.issues.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-500">Issues:</p>
                      {healthSummary.issues.map((issue, index) => (
                        <p key={index} className="text-xs text-muted-foreground">• {issue}</p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{metrics.optimizationScore}%</span>
                      <Database className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Response</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{metrics.avgResponseTime}m</span>
                      <Zap className="h-4 w-4 text-yellow-500" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Backup</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {metrics.lastBackup ? 
                          new Date(metrics.lastBackup).toLocaleDateString() : 
                          'None'
                        }
                      </span>
                      <HardDrive className={`h-4 w-4 ${
                        metrics.backupHealth === 'good' ? 'text-green-500' : 'text-yellow-500'
                      }`} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  Operational Excellence
                </CardTitle>
                <CardDescription>
                  AI-powered insights, staff optimization, and predictive analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/operational-excellence')}
                  className="w-full"
                >
                  Access Advanced Tools
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-6 w-6 text-secondary" />
                  System Management
                </CardTitle>
                <CardDescription>
                  Optimization tools, backup management, and security monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/admin/optimization')}
                  className="w-full"
                  variant="secondary"
                >
                  Manage System
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <LoadingWrapper loading={false}>
            <Suspense fallback={
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading analytics...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <AdvancedAnalytics />
            </Suspense>
          </LoadingWrapper>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <LoadingWrapper loading={false}>
            <Suspense fallback={
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading performance monitoring...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <PerformanceMonitoringDashboard />
            </Suspense>
          </LoadingWrapper>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <LoadingWrapper loading={false}>
            <Suspense fallback={
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading management tools...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <div className="grid gap-6">
                <StaffWorkloadBalancer />
                <EnhancedHelpSystem />
              </div>
            </Suspense>
          </LoadingWrapper>
        </TabsContent>
      </Tabs>

      {/* Status Footer */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Last updated: {lastFetch ? new Date(lastFetch).toLocaleString() : 'Never'}</p>
        <p>Real-time monitoring: {isRealTimeActive ? 'Active' : 'Inactive'}</p>
      </div>
    </div>
  );
};

export default OptimizedAdminDashboard;