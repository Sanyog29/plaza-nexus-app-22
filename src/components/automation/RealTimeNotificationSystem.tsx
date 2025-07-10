import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, AlertTriangle, Clock, CheckCircle, Zap, 
  Activity, TrendingUp, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';

interface RealTimeAlert {
  id: string;
  type: 'sla_breach' | 'system_health' | 'performance' | 'urgent_request';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  actionUrl?: string;
  isRead: boolean;
}

interface SystemMetrics {
  requestsPerHour: number;
  averageResponseTime: number;
  slaBreaches: number;
  systemHealth: number;
  lastUpdated: Date;
}

const RealTimeNotificationSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin, isStaff } = useAuth();
  const { toast } = useToast();

  // Real-time subscriptions for different types of alerts
  useEffect(() => {
    if (!user) return;

    // Subscribe to maintenance requests changes for real-time alerts
    const requestsChannel = supabase
      .channel('requests-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests'
        },
        (payload) => {
          handleRequestChange(payload);
        }
      )
      .subscribe();

    // Subscribe to system health changes
    const healthChannel = supabase
      .channel('system-health')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_metrics'
        },
        () => {
          updateSystemMetrics();
        }
      )
      .subscribe();

    // Initial data load
    loadInitialData();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(healthChannel);
    };
  }, [user]);

  const handleRequestChange = (payload: any) => {
    const { new: newRecord, old: oldRecord, eventType } = payload;
    
    // Generate alerts based on changes
    if (eventType === 'INSERT') {
      // New urgent request
      if (newRecord.priority === 'urgent') {
        addAlert({
          type: 'urgent_request',
          title: 'New Urgent Request',
          message: `Urgent maintenance request: ${newRecord.title}`,
          severity: 'high',
          actionUrl: `/admin/requests`
        });
      }
    } else if (eventType === 'UPDATE') {
      // SLA breach detection
      if (newRecord.sla_breach_at && !oldRecord.sla_breach_at) {
        const breachTime = new Date(newRecord.sla_breach_at);
        if (breachTime < new Date() && newRecord.status !== 'completed') {
          addAlert({
            type: 'sla_breach',
            title: 'SLA Breach Alert',
            message: `Request #${newRecord.id} has exceeded SLA deadline`,
            severity: 'critical',
            actionUrl: `/admin/requests`
          });
        }
      }
    }

    // Update system metrics after any change
    updateSystemMetrics();
  };

  const addAlert = (alertData: Omit<RealTimeAlert, 'id' | 'timestamp' | 'isRead'>) => {
    const newAlert: RealTimeAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      timestamp: new Date(),
      isRead: false
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 19)]); // Keep last 20 alerts

    // Show toast notification
    toast({
      title: newAlert.title,
      description: newAlert.message,
      variant: newAlert.severity === 'critical' ? 'destructive' : 'default',
    });
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      await updateSystemMetrics();
      
      // Check for existing SLA breaches
      const { data: breachedRequests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .lt('sla_breach_at', new Date().toISOString())
        .neq('status', 'completed')
        .limit(5);

      if (breachedRequests && breachedRequests.length > 0) {
        breachedRequests.forEach(request => {
          addAlert({
            type: 'sla_breach',
            title: 'Existing SLA Breach',
            message: `Request #${request.id} is overdue`,
            severity: 'critical',
            actionUrl: `/admin/requests`
          });
        });
      }

    } catch (error: any) {
      toast({
        title: "Error loading notifications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSystemMetrics = async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get requests in the last hour
      const { data: recentRequests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', oneHourAgo.toISOString());

      // Get completed requests for average response time
      const { data: completedRequests } = await supabase
        .from('maintenance_requests')
        .select('created_at, completed_at')
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .gte('completed_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate average response time
      const avgResponseTime = completedRequests && completedRequests.length > 0
        ? completedRequests.reduce((sum, req) => {
            const start = new Date(req.created_at);
            const end = new Date(req.completed_at);
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
          }, 0) / completedRequests.length
        : 0;

      // Get SLA breaches
      const { data: breaches } = await supabase
        .from('maintenance_requests')
        .select('id')
        .lt('sla_breach_at', now.toISOString())
        .neq('status', 'completed');

      // Calculate system health score (simplified)
      const totalRequests = recentRequests?.length || 0;
      const breachCount = breaches?.length || 0;
      const systemHealth = Math.max(0, 100 - (breachCount * 10) - (avgResponseTime > 8 ? 20 : 0));

      const metrics: SystemMetrics = {
        requestsPerHour: totalRequests,
        averageResponseTime: Math.round(avgResponseTime * 10) / 10,
        slaBreaches: breachCount,
        systemHealth: Math.round(systemHealth),
        lastUpdated: now
      };

      setSystemMetrics(metrics);

      // Generate system health alerts
      if (systemHealth < 70) {
        addAlert({
          type: 'system_health',
          title: 'System Health Warning',
          message: `System health score is ${systemHealth}% - review performance`,
          severity: systemHealth < 50 ? 'critical' : 'high'
        });
      }

    } catch (error) {
      console.error('Error updating system metrics:', error);
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Metrics Dashboard */}
      {systemMetrics && (isAdmin || isStaff) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Requests/Hour</p>
                  <p className="text-2xl font-bold">{systemMetrics.requestsPerHour}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">{systemMetrics.averageResponseTime}h</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SLA Breaches</p>
                  <p className="text-2xl font-bold text-red-600">{systemMetrics.slaBreaches}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Health</p>
                  <p className={`text-2xl font-bold ${
                    systemMetrics.systemHealth >= 80 ? 'text-green-600' :
                    systemMetrics.systemHealth >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {systemMetrics.systemHealth}%
                  </p>
                </div>
                <TrendingUp className={`h-8 w-8 ${
                  systemMetrics.systemHealth >= 80 ? 'text-green-500' :
                  systemMetrics.systemHealth >= 60 ? 'text-yellow-500' : 'text-red-500'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Real-time Alerts
            {alerts.filter(a => !a.isRead).length > 0 && (
              <Badge variant="destructive">
                {alerts.filter(a => !a.isRead).length} new
              </Badge>
            )}
          </CardTitle>
          {alerts.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllAlerts}>
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts at the moment</p>
              <p className="text-sm">System is monitoring for real-time events</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  className={`${getSeverityColor(alert.severity)} ${
                    alert.isRead ? 'opacity-60' : ''
                  } cursor-pointer transition-opacity`}
                  onClick={() => markAsRead(alert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {alert.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {alert.message}
                        </AlertDescription>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(alert.timestamp, 'MMM dd, HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status Summary */}
      {systemMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Last updated:</span>
                <span className="text-sm text-muted-foreground">
                  {format(systemMetrics.lastUpdated, 'MMM dd, HH:mm:ss')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    systemMetrics.systemHealth >= 80 ? 'bg-green-500' :
                    systemMetrics.systemHealth >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${systemMetrics.systemHealth}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground">
                {systemMetrics.systemHealth >= 90 ? 'Excellent performance' :
                 systemMetrics.systemHealth >= 70 ? 'Good performance' :
                 systemMetrics.systemHealth >= 50 ? 'Performance needs attention' :
                 'Critical performance issues detected'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeNotificationSystem;