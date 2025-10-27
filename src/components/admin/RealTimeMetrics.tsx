import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle, Users, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MetricsData {
  activeRequests: number;
  urgentRequests: number;
  avgResponseTime: number;
  staffUtilization: number;
  systemUptime: number;
  todayCompletions: number;
  slaBreaches: number;
  peakHours: string;
}

const RealTimeMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsData>({
    activeRequests: 0,
    urgentRequests: 0,
    avgResponseTime: 0,
    staffUtilization: 0,
    systemUptime: 99.2,
    todayCompletions: 0,
    slaBreaches: 0,
    peakHours: '9-11 AM'
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchRealTimeMetrics = async () => {
    try {
      // Fetch active maintenance requests
      const { data: activeRequests } = await supabase
        .from('maintenance_requests')
        .select('id, priority, created_at, sla_breach_at')
        .in('status', ['pending', 'in_progress'])
        .is('deleted_at', null);

      // Fetch today's completed requests
      const today = new Date().toISOString().split('T')[0];
      const { data: completedToday } = await supabase
        .from('maintenance_requests')
        .select('id, completed_at, created_at')
        .eq('status', 'completed')
        .gte('completed_at', today)
        .is('deleted_at', null);

      // Fetch staff data for utilization
      const { data: staffData } = await supabase.rpc('get_user_management_data');
      const staffCount = staffData?.filter(s => s.role === 'staff').length || 1;

      // Calculate metrics
      const urgentCount = activeRequests?.filter(r => r.priority === 'urgent').length || 0;
      const totalActive = activeRequests?.length || 0;
      const completedCount = completedToday?.length || 0;

      // Calculate average response time (mock calculation)
      const avgResponseTime = completedToday?.length 
        ? completedToday.reduce((acc, req) => {
            const created = new Date(req.created_at);
            const completed = new Date(req.completed_at);
            return acc + (completed.getTime() - created.getTime());
          }, 0) / (completedToday.length * 60000) // Convert to minutes
        : 0;

      // Calculate SLA breaches
      const now = new Date();
      const breaches = activeRequests?.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < now
      ).length || 0;

      // Staff utilization (simulate based on active requests)
      const utilization = Math.min((totalActive / staffCount) * 20, 100);

      setMetrics({
        activeRequests: totalActive,
        urgentRequests: urgentCount,
        avgResponseTime: Math.round(avgResponseTime),
        staffUtilization: Math.round(utilization),
        systemUptime: 99.2 + Math.random() * 0.7, // Simulate slight variation
        todayCompletions: completedCount,
        slaBreaches: breaches,
        peakHours: new Date().getHours() >= 9 && new Date().getHours() <= 11 ? '9-11 AM (Current)' : '9-11 AM'
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error loading real-time metrics",
        description: "Please refresh the page",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeMetrics();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchRealTimeMetrics, 30000);
    
    // Set up Supabase real-time subscription for maintenance requests
    const channel = supabase
      .channel('admin-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'maintenance_requests'
      }, () => {
        fetchRealTimeMetrics();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading real-time metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical Alerts Row */}
      {(metrics.urgentRequests > 0 || metrics.slaBreaches > 0) && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  {metrics.urgentRequests > 0 && (
                    <Badge variant="destructive">
                      {metrics.urgentRequests} Urgent Request{metrics.urgentRequests !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {metrics.slaBreaches > 0 && (
                    <Badge variant="destructive">
                      {metrics.slaBreaches} SLA Breach{metrics.slaBreaches !== 1 ? 'es' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="animate-pulse">
                <div className="h-2 w-2 bg-destructive rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Requests */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              Active Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.activeRequests}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.urgentRequests} urgent priority
            </p>
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-500" />
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.avgResponseTime}m</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;30m
            </p>
          </CardContent>
        </Card>

        {/* Staff Utilization */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              Staff Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.staffUtilization}%</div>
            <Progress value={metrics.staffUtilization} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Today's Completions */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Today's Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.todayCompletions}</div>
            <p className="text-xs text-muted-foreground">
              Peak: {metrics.peakHours}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">System Uptime</span>
            <span className="text-sm font-medium text-green-400">
              {metrics.systemUptime.toFixed(1)}%
            </span>
          </div>
          <Progress value={metrics.systemUptime} className="h-2" />
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeMetrics;