import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Info, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

interface SystemAlert {
  id: string;
  type: 'maintenance' | 'equipment' | 'security' | 'general';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  location?: string;
}

const StaffAlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    fetchSystemAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading alerts",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchSystemAlerts = async () => {
    try {
      // Simulate system alerts based on maintenance requests with high priority
      const { data: urgentRequests, error } = await supabase
        .from('maintenance_requests')
        .select('id, title, description, priority, status, location, created_at')
        .in('priority', ['urgent', 'high'])
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const mockSystemAlerts: SystemAlert[] = urgentRequests?.map(req => ({
        id: `sys-${req.id}`,
        type: 'maintenance' as const,
        title: `Urgent: ${req.title}`,
        message: req.description,
        severity: req.priority === 'urgent' ? 'critical' as const : 'high' as const,
        status: req.status === 'in_progress' ? 'acknowledged' as const : 'active' as const,
        created_at: req.created_at,
        location: req.location
      })) || [];

      // Add some mock equipment alerts
      const equipmentAlerts: SystemAlert[] = [
        {
          id: 'eq-1',
          type: 'equipment',
          title: 'Generator Maintenance Due',
          message: 'Backup generator requires scheduled maintenance within 24 hours',
          severity: 'medium',
          status: 'active',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          location: 'Basement - Generator Room'
        },
        {
          id: 'eq-2',
          type: 'security',
          title: 'Camera System Alert',
          message: 'Camera #3 (Main Entrance) is offline',
          severity: 'high',
          status: 'active',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          location: 'Main Entrance'
        }
      ];

      setSystemAlerts([...mockSystemAlerts, ...equipmentAlerts]);
    } catch (error: any) {
      console.error('Error loading system alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return '🔧';
      case 'equipment': return '⚙️';
      case 'security': return '🔒';
      default: return '📢';
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    // This would update the alert status in a real system
    setSystemAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'acknowledged' as const }
          : alert
      )
    );
    
    toast({
      title: "Alert acknowledged",
      description: "Alert has been marked as acknowledged",
    });
  };

  const resolveAlert = async (alertId: string) => {
    // This would update the alert status in a real system
    setSystemAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const }
          : alert
      )
    );
    
    toast({
      title: "Alert resolved",
      description: "Alert has been marked as resolved",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  const activeSystemAlerts = systemAlerts.filter(alert => alert.status === 'active');
  const acknowledgedAlerts = systemAlerts.filter(alert => alert.status === 'acknowledged');

  return (
    <div className="w-full space-y-6 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Staff Alerts</h1>
        <p className="text-gray-400">Monitor system alerts and facility issues</p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-400">Critical</p>
                <p className="text-2xl font-bold text-red-400">
                  {systemAlerts.filter(a => a.severity === 'critical' && a.status === 'active').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-400">High</p>
                <p className="text-2xl font-bold text-orange-400">
                  {systemAlerts.filter(a => a.severity === 'high' && a.status === 'active').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400">Medium</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {systemAlerts.filter(a => a.severity === 'medium' && a.status === 'active').length}
                </p>
              </div>
              <Info className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400">Resolved</p>
                <p className="text-2xl font-bold text-green-400">
                  {systemAlerts.filter(a => a.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active System Alerts */}
      <Card className="bg-card/50 backdrop-blur mb-8">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Active Alerts ({activeSystemAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSystemAlerts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No active alerts</p>
          ) : (
            <div className="space-y-4">
              {activeSystemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-gray-800/50 rounded-lg border-l-4 border-red-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                      <div>
                        <h3 className="font-semibold text-white">{alert.title}</h3>
                        <p className="text-sm text-gray-400">
                          {alert.location && `📍 ${alert.location} • `}
                          {format(new Date(alert.created_at), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {getSeverityIcon(alert.severity)}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{alert.message}</p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <Card className="bg-card/50 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-white">Acknowledged Alerts ({acknowledgedAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {acknowledgedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-gray-800/30 rounded-lg border-l-4 border-yellow-500 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getTypeIcon(alert.type)}</span>
                      <div>
                        <h3 className="font-medium text-white">{alert.title}</h3>
                        <p className="text-sm text-gray-400">
                          {alert.location && `📍 ${alert.location} • `}
                          {format(new Date(alert.created_at), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Acknowledged</Badge>
                      <Button
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Announcements */}
      {alerts.length > 0 && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">General Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{alert.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {alert.is_active && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300 mb-2">{alert.message}</p>
                  <p className="text-sm text-gray-400">
                    Posted: {format(new Date(alert.created_at), 'MMM d, yyyy HH:mm')}
                    {alert.expires_at && (
                      <span> • Expires: {format(new Date(alert.expires_at), 'MMM d, yyyy HH:mm')}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffAlertsPage;