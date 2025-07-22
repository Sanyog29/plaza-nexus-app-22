import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Shield, 
  Users, 
  Zap,
  TrendingUp,
  Server,
  Wifi,
  HardDrive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemMetrics {
  database: {
    health: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    activeConnections: number;
    queryPerformance: number;
  };
  authentication: {
    activeUsers: number;
    recentLogins: number;
    failedAttempts: number;
    tokenHealth: 'healthy' | 'warning' | 'critical';
  };
  rls: {
    policiesActive: number;
    violationsToday: number;
    securityScore: number;
  };
  performance: {
    pageLoadTime: number;
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

interface SecurityEvent {
  id: string;
  type: 'login_failure' | 'rls_violation' | 'suspicious_activity' | 'system_error';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  details?: any;
}

export default function SystemMonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const fetchSystemMetrics = async () => {
    try {
      // Simulate real-time metrics (in production, these would come from monitoring APIs)
      const mockMetrics: SystemMetrics = {
        database: {
          health: 'healthy',
          responseTime: Math.random() * 50 + 10,
          activeConnections: Math.floor(Math.random() * 20) + 5,
          queryPerformance: Math.random() * 30 + 70
        },
        authentication: {
          activeUsers: Math.floor(Math.random() * 100) + 50,
          recentLogins: Math.floor(Math.random() * 20) + 10,
          failedAttempts: Math.floor(Math.random() * 5),
          tokenHealth: 'healthy'
        },
        rls: {
          policiesActive: 45,
          violationsToday: Math.floor(Math.random() * 3),
          securityScore: Math.random() * 20 + 80
        },
        performance: {
          pageLoadTime: Math.random() * 2 + 1,
          apiResponseTime: Math.random() * 200 + 100,
          errorRate: Math.random() * 2,
          uptime: 99.9
        }
      };

      setMetrics(mockMetrics);

      // Note: get_system_health_info function would need to be available
      // For now, using mock data for demonstration

    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to fetch system metrics",
        variant: "destructive",
      });
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      // Simulate security events (in production, these would come from audit logs)
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'login_failure',
          message: 'Multiple failed login attempts detected',
          severity: 'medium',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          details: { attempts: 3, ip: '192.168.1.100' }
        },
        {
          id: '2',
          type: 'rls_violation',
          message: 'RLS policy violation in profiles table',
          severity: 'high',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          details: { table: 'profiles', user_id: 'xxxx-xxxx' }
        }
      ];

      setSecurityEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching security events:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSystemMetrics(), fetchSecurityEvents()]);
      setLoading(false);
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(fetchSystemMetrics, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[severity as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>{severity}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Monitoring</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time system health and security monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button size="sm" onClick={fetchSystemMetrics}>
            <Zap className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Health</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getHealthBadge(metrics.database.health)}
              <span className="text-xs text-muted-foreground">
                {metrics.database.responseTime.toFixed(1)}ms avg
              </span>
            </div>
            <Progress value={metrics.database.queryPerformance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.authentication.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.authentication.recentLogins} recent logins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rls.securityScore.toFixed(1)}%</div>
            <Progress value={metrics.rls.securityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performance.uptime}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.performance.errorRate.toFixed(2)}% error rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health Overview</CardTitle>
                <CardDescription>Current status of all system components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Database
                  </span>
                  {getHealthBadge(metrics.database.health)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Authentication
                  </span>
                  {getHealthBadge(metrics.authentication.tokenHealth)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    API Services
                  </span>
                  {getHealthBadge('healthy')}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    Storage
                  </span>
                  {getHealthBadge('healthy')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Database queries: {metrics.database.queryPerformance.toFixed(1)}% optimal</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Active connections: {metrics.database.activeConnections}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Failed logins today: {metrics.authentication.failedAttempts}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>RLS policies active: {metrics.rls.policiesActive}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Recent security-related events and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No security events in the last 24 hours</p>
                  </div>
                ) : (
                  securityEvents.map((event) => (
                    <Alert key={event.id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{event.message}</span>
                        {getSeverityBadge(event.severity)}
                      </AlertTitle>
                      <AlertDescription>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Clock className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>Average response times across the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Page Load Time</span>
                    <span>{metrics.performance.pageLoadTime.toFixed(2)}s</span>
                  </div>
                  <Progress value={(3 - metrics.performance.pageLoadTime) / 3 * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>API Response</span>
                    <span>{metrics.performance.apiResponseTime.toFixed(0)}ms</span>
                  </div>
                  <Progress value={(500 - metrics.performance.apiResponseTime) / 500 * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Database Query</span>
                    <span>{metrics.database.responseTime.toFixed(1)}ms</span>
                  </div>
                  <Progress value={(100 - metrics.database.responseTime) / 100 * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Monitoring</CardTitle>
                <CardDescription>System error rates and reliability metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {(100 - metrics.performance.errorRate).toFixed(2)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>HTTP 2xx</span>
                    <span className="text-green-600">{(100 - metrics.performance.errorRate).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>HTTP 4xx</span>
                    <span className="text-yellow-600">{(metrics.performance.errorRate * 0.8).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>HTTP 5xx</span>
                    <span className="text-red-600">{(metrics.performance.errorRate * 0.2).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
                <CardDescription>Current database metrics and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics.database.activeConnections}</div>
                    <p className="text-xs text-muted-foreground">Active Connections</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics.database.responseTime.toFixed(1)}ms</div>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Query Performance</span>
                    <span>{metrics.database.queryPerformance.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.database.queryPerformance} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Policies</CardTitle>
                <CardDescription>Row Level Security status and violations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{metrics.rls.policiesActive}</div>
                    <p className="text-xs text-muted-foreground">Active Policies</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{metrics.rls.violationsToday}</div>
                    <p className="text-xs text-muted-foreground">Violations Today</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Security Score</span>
                    <span>{metrics.rls.securityScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.rls.securityScore} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}