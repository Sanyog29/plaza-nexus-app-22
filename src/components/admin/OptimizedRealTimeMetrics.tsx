import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle, Users, Zap, TrendingUp } from 'lucide-react';
import { useOptimizedAdminMetrics } from '@/hooks/useOptimizedAdminMetrics';
import { useRequestCounts } from '@/hooks/useRequestCounts';

const OptimizedRealTimeMetrics = () => {
  const { metrics, isRealTimeActive, lastFetch } = useOptimizedAdminMetrics();
  const { counts } = useRequestCounts();

  const metricCards = [
    {
      title: 'Active Requests',
      value: counts.activeRequests,
      icon: Clock,
      color: 'text-blue-500',
      subtitle: `${metrics.urgentRequests} urgent`,
      trend: metrics.urgentRequests > 0 ? 'warning' : 'normal'
    },
    {
      title: 'Avg Response',
      value: `${metrics.avgResponseTime}m`,
      icon: Zap,
      color: 'text-yellow-500',
      subtitle: 'Target: <30m',
      trend: metrics.avgResponseTime > 30 ? 'warning' : 'good'
    },
    {
      title: 'Staff Utilization',
      value: `${metrics.staffUtilization}%`,
      icon: Users,
      color: 'text-blue-500',
      subtitle: 'Current load',
      trend: metrics.staffUtilization > 80 ? 'warning' : 'normal',
      showProgress: true
    },
    {
      title: 'Completed',
      value: counts.completedRequests,
      icon: CheckCircle,
      color: 'text-green-500',
      subtitle: 'Total finished',
      trend: 'good'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Critical Alerts Row */}
      {(metrics.urgentRequests > 0 || metrics.slaBreaches > 0 || metrics.criticalAlerts > 0) && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
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
                  {metrics.criticalAlerts > 0 && (
                    <Badge variant="destructive">
                      {metrics.criticalAlerts} Critical Alert{metrics.criticalAlerts !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-destructive rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Requires attention</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title} className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <IconComponent className={`h-4 w-4 mr-2 ${metric.color}`} />
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.subtitle}
                </p>
                {metric.showProgress && (
                  <Progress 
                    value={parseInt(metric.value.toString().replace('%', ''))} 
                    className="mt-2 h-2" 
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Health Summary */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              System Health Summary
            </div>
            <Badge variant={
              metrics.systemHealth === 'healthy' ? 'default' :
              metrics.systemHealth === 'warning' ? 'secondary' : 'destructive'
            }>
              {metrics.systemHealth}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Uptime</span>
              <span className="font-medium text-green-400">
                {metrics.systemUptime.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">DB Performance</span>
              <span className="font-medium">
                {metrics.optimizationScore}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backup Status</span>
              <span className={`font-medium ${
                metrics.backupHealth === 'good' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {metrics.backupHealth}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last updated: {lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Never'}</span>
              <div className="flex items-center space-x-1">
                <div className={`h-2 w-2 rounded-full ${
                  isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`}></div>
                <span>{isRealTimeActive ? 'Live' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedRealTimeMetrics;