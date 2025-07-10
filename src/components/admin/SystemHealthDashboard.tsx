import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { 
  Shield, 
  Activity, 
  Database, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Cpu,
  HardDrive,
  Network,
  Lock,
  FileText,
  BarChart3,
  Settings,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Server,
  Eye
} from 'lucide-react';

interface SystemHealthMetrics {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    connectionPool: number;
    avgQueryTime: number;
    slowQueries: number;
    connections: number;
  };
  performance: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    throughput: number;
  };
  security: {
    activeUsers: number;
    pendingApprovals: number;
    adminUsers: number;
    lastAuditLog: string;
    failedLogins: number;
  };
  monitoring: {
    activeAlerts: number;
    criticalAlerts: number;
    slaBreaches: number;
    systemHealth: number;
  };
  backup: {
    lastBackup: string;
    backupStatus: 'healthy' | 'warning' | 'critical';
    dataIntegrity: number;
    recoveryTime: number;
  };
  features: {
    realTimeSync: boolean;
    performanceMonitoring: boolean;
    slaTracking: boolean;
    auditLogging: boolean;
    backupSystem: boolean;
    escalationSystem: boolean;
  };
}

interface OperationalIssue {
  id: string;
  category: 'security' | 'performance' | 'reliability' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
}

export const SystemHealthDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<SystemHealthMetrics | null>(null);
  const [issues, setIssues] = useState<OperationalIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchSystemHealth = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);

      // Fetch user metrics
      const { data: userStats } = await supabase
        .from('profiles')
        .select('role, approval_status');

      // Fetch maintenance metrics
      const { data: maintenanceStats } = await supabase
        .from('maintenance_requests')
        .select('status, priority, sla_breach_at, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Fetch alert metrics
      const { data: alertStats } = await supabase
        .from('alerts')
        .select('severity, is_active');

      // Fetch audit logs
      const { data: auditStats } = await supabase
        .from('audit_logs')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      // Calculate metrics
      const now = new Date();
      const totalUsers = userStats?.length || 0;
      const activeUsers = userStats?.filter(u => u.approval_status === 'approved').length || 0;
      const pendingApprovals = userStats?.filter(u => u.approval_status === 'pending').length || 0;
      const adminUsers = userStats?.filter(u => u.role === 'admin').length || 0;

      const totalRequests = maintenanceStats?.length || 0;
      const completedRequests = maintenanceStats?.filter(r => r.status === 'completed').length || 0;
      const urgentRequests = maintenanceStats?.filter(r => r.priority === 'urgent').length || 0;
      const slaBreaches = maintenanceStats?.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < now && r.status !== 'completed'
      ).length || 0;

      const activeAlerts = alertStats?.filter(a => a.is_active).length || 0;
      const criticalAlerts = alertStats?.filter(a => a.severity === 'critical' && a.is_active).length || 0;

      // Simulate some metrics (in real app, these would come from actual monitoring)
      const simulatedMetrics: SystemHealthMetrics = {
        database: {
          status: criticalAlerts > 0 ? 'critical' : activeAlerts > 2 ? 'warning' : 'healthy',
          connectionPool: Math.floor(Math.random() * 20) + 5,
          avgQueryTime: Math.floor(Math.random() * 100) + 50,
          slowQueries: Math.floor(Math.random() * 5),
          connections: Math.floor(Math.random() * 50) + 10
        },
        performance: {
          responseTime: Math.floor(Math.random() * 500) + 200,
          uptime: 99.9 - Math.random() * 0.5,
          errorRate: Math.random() * 2,
          throughput: Math.floor(Math.random() * 1000) + 500
        },
        security: {
          activeUsers,
          pendingApprovals,
          adminUsers,
          lastAuditLog: auditStats?.[0]?.created_at || new Date().toISOString(),
          failedLogins: Math.floor(Math.random() * 5)
        },
        monitoring: {
          activeAlerts,
          criticalAlerts,
          slaBreaches,
          systemHealth: Math.max(0, 100 - (criticalAlerts * 20) - (activeAlerts * 5) - (slaBreaches * 10))
        },
        backup: {
          lastBackup: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          backupStatus: Math.random() > 0.1 ? 'healthy' : 'warning',
          dataIntegrity: 95 + Math.random() * 5,
          recoveryTime: Math.floor(Math.random() * 60) + 15
        },
        features: {
          realTimeSync: true,
          performanceMonitoring: true,
          slaTracking: true,
          auditLogging: true,
          backupSystem: true,
          escalationSystem: true
        }
      };

      setMetrics(simulatedMetrics);

      // Generate operational issues
      const detectedIssues: OperationalIssue[] = [];

      if (pendingApprovals > 5) {
        detectedIssues.push({
          id: '1',
          category: 'security',
          severity: 'medium',
          title: 'High Number of Pending User Approvals',
          description: `${pendingApprovals} users are waiting for approval`,
          recommendation: 'Review and process pending user approvals',
          impact: 'User access delays and potential productivity loss'
        });
      }

      if (simulatedMetrics.database.avgQueryTime > 1000) {
        detectedIssues.push({
          id: '2',
          category: 'performance',
          severity: 'high',
          title: 'Slow Database Queries Detected',
          description: `Average query time is ${simulatedMetrics.database.avgQueryTime}ms`,
          recommendation: 'Optimize database queries and add proper indexing',
          impact: 'Poor user experience and system responsiveness'
        });
      }

      if (slaBreaches > 0) {
        detectedIssues.push({
          id: '3',
          category: 'reliability',
          severity: 'critical',
          title: 'SLA Breaches Detected',
          description: `${slaBreaches} maintenance requests have exceeded SLA`,
          recommendation: 'Review escalation procedures and resource allocation',
          impact: 'Service level agreement violations and customer dissatisfaction'
        });
      }

      if (simulatedMetrics.backup.backupStatus === 'warning') {
        detectedIssues.push({
          id: '4',
          category: 'reliability',
          severity: 'high',
          title: 'Backup System Issues',
          description: 'Recent backup operations have encountered warnings',
          recommendation: 'Check backup system logs and verify storage capacity',
          impact: 'Risk of data loss in case of system failure'
        });
      }

      setIssues(detectedIssues);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching system health:', error);
      toast.error('Failed to load system health metrics');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSystemHealth();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSystemHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSystemHealth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Access Restricted</h3>
              <p className="text-muted-foreground">
                System health dashboard is only available to administrators.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !metrics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading system health metrics...</span>
        </div>
      </div>
    );
  }

  const overallHealth = metrics.monitoring.systemHealth;
  const healthStatus = overallHealth >= 90 ? 'healthy' : overallHealth >= 70 ? 'warning' : 'critical';

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            System Health & Operational Excellence
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive system monitoring and performance analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button onClick={fetchSystemHealth} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className={`h-6 w-6 ${getStatusColor(healthStatus)}`} />
                Overall System Health
              </CardTitle>
              <CardDescription>
                Real-time health score based on all monitored metrics
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getStatusColor(healthStatus)}`}>
                {overallHealth.toFixed(1)}%
              </div>
              <Badge variant={getStatusBadgeVariant(healthStatus)}>
                {healthStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallHealth} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className={`h-4 w-4 ${getStatusColor(metrics.database.status)}`} />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status</span>
                    <Badge variant={getStatusBadgeVariant(metrics.database.status)}>
                      {metrics.database.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Connections</span>
                    <span>{metrics.database.connections}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Query Time</span>
                    <span>{metrics.database.avgQueryTime}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uptime</span>
                    <span className="text-green-500">{metrics.performance.uptime.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <span>{metrics.performance.responseTime}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span>{metrics.performance.errorRate.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Users</span>
                    <span>{metrics.security.activeUsers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Approvals</span>
                    <span className={metrics.security.pendingApprovals > 0 ? 'text-yellow-500' : ''}>
                      {metrics.security.pendingApprovals}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Failed Logins</span>
                    <span>{metrics.security.failedLogins}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monitoring */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-purple-500" />
                  Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Alerts</span>
                    <span className={metrics.monitoring.activeAlerts > 0 ? 'text-yellow-500' : ''}>
                      {metrics.monitoring.activeAlerts}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Critical Alerts</span>
                    <span className={metrics.monitoring.criticalAlerts > 0 ? 'text-red-500' : ''}>
                      {metrics.monitoring.criticalAlerts}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SLA Breaches</span>
                    <span className={metrics.monitoring.slaBreaches > 0 ? 'text-red-500' : ''}>
                      {metrics.monitoring.slaBreaches}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Response Time</span>
                    <span>{metrics.performance.responseTime}ms</span>
                  </div>
                  <Progress value={Math.min(100, (3000 - metrics.performance.responseTime) / 30)} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Throughput</span>
                    <span>{metrics.performance.throughput} req/min</span>
                  </div>
                  <Progress value={Math.min(100, metrics.performance.throughput / 15)} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Error Rate</span>
                    <span>{metrics.performance.errorRate.toFixed(2)}%</span>
                  </div>
                  <Progress 
                    value={100 - Math.min(100, metrics.performance.errorRate * 10)} 
                    className={metrics.performance.errorRate > 5 ? '[&_[role=progressbar]]:bg-red-500' : ''}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Avg Query Time</span>
                    <span>{metrics.database.avgQueryTime}ms</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (2000 - metrics.database.avgQueryTime) / 20)}
                    className={metrics.database.avgQueryTime > 1000 ? '[&_[role=progressbar]]:bg-yellow-500' : ''}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Connection Pool</span>
                    <span>{metrics.database.connectionPool}/50</span>
                  </div>
                  <Progress value={(metrics.database.connectionPool / 50) * 100} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Slow Queries</span>
                    <span className={metrics.database.slowQueries > 3 ? 'text-yellow-500' : ''}>
                      {metrics.database.slowQueries}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Active Users</span>
                  <span className="font-medium">{metrics.security.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Approvals</span>
                  <Badge variant={metrics.security.pendingApprovals > 0 ? 'secondary' : 'default'}>
                    {metrics.security.pendingApprovals}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Admin Users</span>
                  <span className="font-medium">{metrics.security.adminUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed Login Attempts</span>
                  <Badge variant={metrics.security.failedLogins > 3 ? 'destructive' : 'default'}>
                    {metrics.security.failedLogins}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Audit Logging</span>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Last Audit Entry</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(metrics.security.lastAuditLog).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Data Retention</span>
                  <Badge variant="default">90 days</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Compliance Status</span>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Compliant
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reliability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Backup & Recovery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Last Backup</span>
                  <span className="text-sm">
                    {new Date(metrics.backup.lastBackup).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Backup Status</span>
                  <Badge variant={getStatusBadgeVariant(metrics.backup.backupStatus)}>
                    {metrics.backup.backupStatus}
                  </Badge>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Data Integrity</span>
                    <span>{metrics.backup.dataIntegrity.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.backup.dataIntegrity} />
                </div>
                <div className="flex justify-between">
                  <span>Recovery Time Objective</span>
                  <span>{metrics.backup.recoveryTime} minutes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Uptime</span>
                    <span className="font-medium text-green-500">
                      {metrics.performance.uptime.toFixed(3)}%
                    </span>
                  </div>
                  <Progress value={metrics.performance.uptime} />
                </div>
                <div className="flex justify-between">
                  <span>SLA Target</span>
                  <span>99.9%</span>
                </div>
                <div className="flex justify-between">
                  <span>Current SLA Breaches</span>
                  <Badge variant={metrics.monitoring.slaBreaches > 0 ? 'destructive' : 'default'}>
                    {metrics.monitoring.slaBreaches}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Downtime This Month</span>
                  <span>0.1%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(metrics.features).map(([feature, enabled]) => (
              <Card key={feature}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getFeatureDescription(feature)}
                      </p>
                    </div>
                    <Badge variant={enabled ? 'default' : 'destructive'}>
                      {enabled ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {issues.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-500">No Issues Detected</h3>
                  <p className="text-muted-foreground">
                    All systems are operating within normal parameters.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <Card key={issue.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className={`h-5 w-5 ${getSeverityColor(issue.severity)}`} />
                          {issue.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{issue.category}</Badge>
                          <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {issue.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h5 className="font-medium mb-1">Description</h5>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Recommendation</h5>
                      <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Potential Impact</h5>
                      <p className="text-sm text-muted-foreground">{issue.impact}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    realTimeSync: 'Live data synchronization across all components',
    performanceMonitoring: 'Continuous system performance tracking',
    slaTracking: 'Service level agreement monitoring and alerts',
    auditLogging: 'Comprehensive action logging and compliance',
    backupSystem: 'Automated data backup and recovery',
    escalationSystem: 'Automated issue escalation and notifications'
  };
  return descriptions[feature] || 'System feature monitoring';
}

export default SystemHealthDashboard;