import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Activity,
  Users,
  Timer
} from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useRequestCounts } from '@/hooks/useRequestCounts';
import { useAuth } from '@/components/AuthProvider';

const RealTimePerformanceWidget = () => {
  const { metrics, isLoading } = useDashboardMetrics();
  const { counts } = useRequestCounts();
  const { isStaff } = useAuth();
  const [previousMetrics, setPreviousMetrics] = useState(metrics);

  useEffect(() => {
    if (!isLoading) {
      setPreviousMetrics(prev => ({ ...prev, ...metrics }));
    }
  }, [metrics, isLoading]);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral' as const
    };
  };

  const getPerformanceLevel = (compliance: number) => {
    if (compliance >= 95) return { level: 'excellent', color: 'text-green-500', bg: 'bg-green-100' };
    if (compliance >= 85) return { level: 'good', color: 'text-yellow-500', bg: 'bg-yellow-100' };
    return { level: 'needs-attention', color: 'text-red-500', bg: 'bg-red-100' };
  };

  const formatTime = (hours: number) => {
    if (hours === 0) return '0m';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const performanceData = [
    {
      title: 'Response Time',
      value: formatTime(metrics.avgCompletionTime),
      trend: calculateTrend(metrics.avgCompletionTime, previousMetrics.avgCompletionTime),
      icon: Timer,
      target: '< 4h',
      progress: Math.max(0, Math.min(100, (4 - metrics.avgCompletionTime) / 4 * 100)),
    },
    {
      title: 'SLA Compliance',
      value: `${Math.round(metrics.slaCompliance)}%`,
      trend: calculateTrend(metrics.slaCompliance, previousMetrics.slaCompliance),
      icon: CheckCircle2,
      target: '> 95%',
      progress: metrics.slaCompliance,
      performance: getPerformanceLevel(metrics.slaCompliance),
    },
    {
      title: 'Resolution Rate',
      value: `${metrics.totalRequests > 0 ? Math.round((metrics.completedRequests / metrics.totalRequests) * 100) : 0}%`,
      trend: calculateTrend(
        metrics.totalRequests > 0 ? metrics.completedRequests / metrics.totalRequests : 0,
        previousMetrics.totalRequests > 0 ? previousMetrics.completedRequests / previousMetrics.totalRequests : 0
      ),
      icon: Activity,
      target: '> 90%',
      progress: metrics.totalRequests > 0 ? (metrics.completedRequests / metrics.totalRequests) * 100 : 0,
    },
  ];

  if (!isStaff) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5" />
            Your Service Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Requests</p>
              <p className="text-2xl font-bold text-foreground">{counts.activeRequests}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-500">{counts.completedRequests}</p>
            </div>
          </div>
          
          {metrics.avgCompletionTime > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg. Response Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{formatTime(metrics.avgCompletionTime)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5" />
          Real-Time Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {performanceData.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{item.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{item.value}</span>
                {item.trend.direction !== 'neutral' && (
                  <div className="flex items-center gap-1">
                    {item.trend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${item.trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {item.trend.value.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Target: {item.target}</span>
                {item.performance && (
                  <Badge className={`${item.performance.bg} ${item.performance.color}`} variant="secondary">
                    {item.performance.level.replace('-', ' ')}
                  </Badge>
                )}
              </div>
              <Progress value={item.progress} className="h-2" />
            </div>
          </div>
        ))}

        {/* Live Metrics Summary */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Requests</p>
              <p className="text-sm font-bold text-foreground">{metrics.totalRequests}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SLA Breaches</p>
              <p className="text-sm font-bold text-red-500">{metrics.slaBreaches}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Visitors</p>
              <p className="text-sm font-bold text-blue-500">{metrics.activeVisitors}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimePerformanceWidget;