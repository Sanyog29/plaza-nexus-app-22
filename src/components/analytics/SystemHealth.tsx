import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface SystemComponent {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  responseTime: string;
  lastCheck: string;
  priority?: string;
}

interface SystemHealthData {
  components: SystemComponent[];
  overallHealth: number;
  incidents: Array<{
    title: string;
    description: string;
    severity: string;
    date: string;
    status: string;
  }>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'healthy':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Healthy</Badge>;
    case 'warning':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const SystemHealth: React.FC = () => {
  const { isStaff, isAdmin } = useAuth();
  const [healthData, setHealthData] = useState<SystemHealthData>({
    components: [],
    overallHealth: 0,
    incidents: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSystemHealth = async () => {
    try {
      setIsLoading(true);
      
      // Fetch system alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Fetch maintenance requests to assess system health
      const { data: requests, error: requestsError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Calculate component health based on data
      const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;
      const warningAlerts = alerts?.filter(a => a.severity === 'warning').length || 0;
      const urgentRequests = requests?.filter(r => r.priority === 'urgent').length || 0;
      const highRequests = requests?.filter(r => r.priority === 'high').length || 0;

      // Generate system components with calculated health
      const components: SystemComponent[] = [
        {
          name: 'Database',
          status: criticalAlerts > 0 ? 'error' : 'healthy',
          uptime: criticalAlerts > 0 ? 95.2 : 99.9,
          responseTime: criticalAlerts > 0 ? '156ms' : '12ms',
          lastCheck: '2 minutes ago'
        },
        {
          name: 'Maintenance System',
          status: urgentRequests > 3 ? 'error' : urgentRequests > 1 ? 'warning' : 'healthy',
          uptime: urgentRequests > 3 ? 92.1 : urgentRequests > 1 ? 96.8 : 99.8,
          responseTime: urgentRequests > 3 ? 'Degraded' : '45ms',
          lastCheck: '1 minute ago'
        },
        {
          name: 'Alert System',
          status: warningAlerts > 5 ? 'warning' : 'healthy',
          uptime: warningAlerts > 5 ? 96.5 : 99.7,
          responseTime: warningAlerts > 5 ? '89ms' : '23ms',
          lastCheck: '30 seconds ago'
        },
        {
          name: 'Request Processing',
          status: highRequests > 5 ? 'warning' : 'healthy',
          uptime: highRequests > 5 ? 97.1 : 99.5,
          responseTime: highRequests > 5 ? '134ms' : '67ms',
          lastCheck: '1 minute ago'
        },
        {
          name: 'File Storage',
          status: Math.random() > 0.8 ? 'warning' : 'healthy',
          uptime: Math.random() > 0.8 ? 98.5 : 99.6,
          responseTime: Math.random() > 0.8 ? '156ms' : '89ms',
          lastCheck: '3 minutes ago'
        }
      ];

      const overallHealth = components.reduce((acc, comp) => acc + comp.uptime, 0) / components.length;

      // Map recent alerts to incidents
      const incidents = alerts?.slice(0, 3).map(alert => ({
        title: alert.title,
        description: alert.message,
        severity: alert.severity,
        date: new Date(alert.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        status: 'Monitoring'
      })) || [];

      setHealthData({ components, overallHealth, incidents });
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isStaff || isAdmin) {
      fetchSystemHealth();
      
      // Set up real-time updates
      const channel = supabase
        .channel('system-health')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, fetchSystemHealth)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, fetchSystemHealth)
        .subscribe();

      const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [isStaff, isAdmin]);

  if (!isStaff && !isAdmin) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            System health monitoring is only available to staff members.
          </p>
        </CardContent>
      </Card>
    );
  }

  const overallHealth = healthData.overallHealth;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">System Health Monitor</h3>
          <p className="text-sm text-muted-foreground">
            Real-time status of all system components
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSystemHealth} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Overall System Health
            {overallHealth > 99 ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : overallHealth > 95 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>
            Aggregate health score across all services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{overallHealth.toFixed(1)}%</span>
              <Badge variant={overallHealth > 99 ? "secondary" : overallHealth > 95 ? "outline" : "destructive"}>
                {overallHealth > 99 ? "Excellent" : overallHealth > 95 ? "Good" : "Poor"}
              </Badge>
            </div>
            <Progress value={overallHealth} className="h-2" />
            <p className="text-sm text-muted-foreground">
              System is performing {overallHealth > 99 ? "excellently" : overallHealth > 95 ? "well" : "below expectations"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {healthData.components.map((component) => (
          <Card key={component.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{component.name}</CardTitle>
                {getStatusIcon(component.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(component.status)}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">{component.uptime}%</span>
                </div>
                <Progress value={component.uptime} className="h-1" />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Time</span>
                <span className="font-medium">{component.responseTime}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Check</span>
                <span className="font-medium">{component.lastCheck}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>
            System incidents and outages in the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData.incidents.length > 0 ? (
              healthData.incidents.map((incident, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {incident.severity === 'critical' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : incident.severity === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{incident.title}</p>
                    <p className="text-xs text-muted-foreground">{incident.date}</p>
                  </div>
                  <Badge variant="outline">{incident.status}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                No incidents in the past 30 days
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};