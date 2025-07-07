import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard';
import { AdvancedNotificationCenter } from '@/components/notifications/AdvancedNotificationCenter';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useDatabaseOptimization } from '@/hooks/useDatabaseOptimization';
import { useDataBackup } from '@/hooks/useDataBackup';
import AccessRestricted from '@/components/admin/AccessRestricted';
import DashboardHeader from '@/components/admin/DashboardHeader';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import RealTimeMetrics from '@/components/admin/RealTimeMetrics';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';
import StaffWorkloadBalancer from '@/components/admin/StaffWorkloadBalancer';
import { EnhancedHelpSystem } from '@/components/help/EnhancedHelpSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Database, 
  HardDrive, 
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Shield,
  Brain,
  Zap
} from 'lucide-react';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdminDashboard();
  const { 
    metrics: perfMetrics, 
    alerts: perfAlerts, 
    getPerformanceSummary,
    isMonitoring 
  } = usePerformanceMonitoring();
  const { 
    databaseHealth, 
    indexRecommendations, 
    queryAnalyses 
  } = useDatabaseOptimization();
  const { 
    backupStats, 
    backupJobs, 
    backupSchedules 
  } = useDataBackup();

  if (isLoading) return <LoadingSpinner />;
  if (!isAdmin) return <AccessRestricted />;

  const performanceSummary = getPerformanceSummary();

  return (
    <div className="px-4 py-6">
      <DashboardHeader />
      
      <CustomizableDashboard userRole="admin" />
      <AdvancedNotificationCenter />
      
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

          {/* Advanced Features Access */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  Operational Excellence
                </CardTitle>
                <CardDescription>
                  AI-powered staff management, predictive analytics, and intelligent automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Staff Performance Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span>AI Task Distribution</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>Training & Forecasting</span>
                  </div>
                  <Button 
                    onClick={() => navigate('/operational-excellence')}
                    className="w-full mt-4"
                  >
                    Access Operational Excellence
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-6 w-6 text-secondary" />
                  Advanced Features
                </CardTitle>
                <CardDescription>
                  Next-generation automation, client experience, and advanced insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Server className="h-4 w-4" />
                    <span>Smart Request Routing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Tenant Satisfaction Scoring</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="h-4 w-4" />
                    <span>Carbon Footprint Tracking</span>
                  </div>
                  <Button 
                    onClick={() => navigate('/advanced-features')}
                    className="w-full mt-4"
                  >
                    Access Advanced Features
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">System Health</p>
                    <p className="text-2xl font-bold text-green-600">
                      {performanceSummary.systemHealth.overall === 'healthy' ? '✓' : '⚠'}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">DB Optimization</p>
                    <p className="text-2xl font-bold">
                      {databaseHealth?.optimizationScore || 0}%
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                    <p className="text-sm font-medium">
                      {backupStats?.lastSuccessfulBackup ? 
                        new Date(backupStats.lastSuccessfulBackup).toLocaleDateString() : 
                        'None'
                      }
                    </p>
                  </div>
                  <HardDrive className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monitoring</p>
                    <p className="text-2xl font-bold">
                      {isMonitoring ? '●' : '○'}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Critical Issues</span>
                    <Badge variant={performanceSummary.criticalIssues > 0 ? "destructive" : "default"}>
                      {performanceSummary.criticalIssues}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Warnings</span>
                    <Badge variant={performanceSummary.warnings > 0 ? "secondary" : "default"}>
                      {performanceSummary.warnings}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Response Time</span>
                    <span>{Math.round(performanceSummary.averageResponseTime)}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>System Uptime</span>
                    <span>{performanceSummary.systemHealth.uptime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {perfAlerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-2 bg-secondary rounded">
                      <span className="text-sm">{alert.message}</span>
                      <Badge variant={alert.severity === 'critical' ? "destructive" : "secondary"}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                  {perfAlerts.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active alerts</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {perfMetrics.slice(0, 3).map(metric => (
                    <div key={metric.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{metric.metricType.replace('_', ' ')}</span>
                        <span>{metric.value}{metric.metricType.includes('time') ? 'ms' : '%'}</span>
                      </div>
                      <Progress 
                        value={metric.metricType.includes('usage') ? metric.value : Math.min(metric.value / 10, 100)} 
                        className={`h-2 ${metric.status === 'critical' ? 'bg-red-500' : metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Health</CardTitle>
                <CardDescription>Overall optimization score and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Optimization Score</span>
                  <span className="text-2xl font-bold">{databaseHealth?.optimizationScore || 0}%</span>
                </div>
                <Progress value={databaseHealth?.optimizationScore || 0} />
                
                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations</h4>
                  {databaseHealth?.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Index Recommendations</CardTitle>
                <CardDescription>Suggested database optimizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {indexRecommendations.slice(0, 4).map((rec, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{rec.tableName}</div>
                        <div className="text-xs text-muted-foreground">
                          {rec.columnNames.join(', ')} • {rec.estimatedImprovement}% improvement
                        </div>
                      </div>
                      <Badge 
                        variant={rec.priority === 'high' ? "destructive" : 
                                rec.priority === 'medium' ? "secondary" : "outline"}
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Backups</p>
                    <p className="text-2xl font-bold">{backupStats?.totalBackups || 0}</p>
                  </div>
                  <HardDrive className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {backupStats?.totalBackups ? 
                        Math.round((backupStats.successfulBackups / backupStats.totalBackups) * 100) : 0}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Storage Used</p>
                    <p className="text-2xl font-bold">
                      {backupStats?.storageUsage ? 
                        Math.round(backupStats.storageUsage.percentage) : 0}%
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Duration</p>
                    <p className="text-2xl font-bold">
                      {Math.round(backupStats?.averageBackupTime || 0)}s
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Backup Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {backupJobs.slice(0, 5).map(job => (
                    <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{job.type} backup</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(job.startedAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge 
                        variant={job.status === 'completed' ? "default" : 
                                job.status === 'failed' ? "destructive" : "secondary"}
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {backupSchedules.map(schedule => (
                    <div key={schedule.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{schedule.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {schedule.frequency} at {schedule.time}
                        </div>
                      </div>
                      <Badge variant={schedule.enabled ? "default" : "secondary"}>
                        {schedule.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <EnhancedHelpSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;
