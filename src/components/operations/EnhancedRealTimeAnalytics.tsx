import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  DollarSign,
  Zap,
  Bell,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalyticsMetric {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  target?: number;
  icon: any;
}

interface PredictiveInsight {
  id: string;
  type: 'maintenance' | 'cost' | 'performance';
  title: string;
  description: string;
  probability: number;
  impact: 'low' | 'medium' | 'high';
  recommendedAction: string;
  daysAhead: number;
}

interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export function EnhancedRealTimeAnalytics() {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Fetch real-time metrics
  const fetchMetrics = useCallback(async () => {
    try {
      // Fetch maintenance metrics
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: performance } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(7);

      // Calculate current metrics
      const totalRequests = requests?.length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const overdueRequests = requests?.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < new Date() && r.status !== 'completed'
      ).length || 0;
      
      const avgCompletionTime = performance?.[0]?.average_completion_time_minutes || 0;
      const slaCompliance = totalRequests > 0 ? ((totalRequests - overdueRequests) / totalRequests) * 100 : 100;

      // Generate predictive cost analysis
      const estimatedMonthlyCost = completedRequests * 150; // Estimated cost per request
      const costTrend = performance && performance.length > 1 
        ? performance[0].completed_requests > performance[1].completed_requests ? 'up' : 'down'
        : 'stable';

      const newMetrics: AnalyticsMetric[] = [
        {
          id: 'total-requests',
          label: 'Total Requests (30d)',
          value: totalRequests,
          previousValue: totalRequests - (requests?.filter(r => 
            new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length || 0),
          unit: 'requests',
          trend: totalRequests > (performance?.[1]?.total_requests || 0) ? 'up' : 'down',
          status: totalRequests > 50 ? 'warning' : 'good',
          icon: Activity
        },
        {
          id: 'completion-rate',
          label: 'Completion Rate',
          value: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0,
          unit: '%',
          trend: 'up',
          status: completedRequests / totalRequests > 0.8 ? 'good' : 'warning',
          target: 90,
          icon: CheckCircle
        },
        {
          id: 'sla-compliance',
          label: 'SLA Compliance',
          value: slaCompliance,
          unit: '%',
          trend: overdueRequests === 0 ? 'up' : 'down',
          status: slaCompliance > 85 ? 'good' : slaCompliance > 70 ? 'warning' : 'critical',
          target: 95,
          icon: Target
        },
        {
          id: 'avg-response',
          label: 'Avg Response Time',
          value: avgCompletionTime,
          unit: 'minutes',
          trend: avgCompletionTime < 240 ? 'up' : 'down',
          status: avgCompletionTime < 240 ? 'good' : avgCompletionTime < 480 ? 'warning' : 'critical',
          target: 180,
          icon: Clock
        },
        {
          id: 'monthly-cost',
          label: 'Est. Monthly Cost',
          value: estimatedMonthlyCost,
          unit: '$',
          trend: costTrend as 'up' | 'down' | 'stable',
          status: estimatedMonthlyCost > 10000 ? 'warning' : 'good',
          icon: DollarSign
        },
        {
          id: 'efficiency-score',
          label: 'Efficiency Score',
          value: Math.round((slaCompliance + (totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0)) / 2),
          unit: '/100',
          trend: 'up',
          status: 'good',
          target: 85,
          icon: Zap
        }
      ];

      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to fetch real-time metrics');
    }
  }, []);

  // Generate predictive insights
  const generateInsights = useCallback(async () => {
    try {
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'operational');

      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      const newInsights: PredictiveInsight[] = [];

      // Predictive maintenance insights
      assets?.forEach(asset => {
        const lastService = asset.last_service_date ? new Date(asset.last_service_date) : null;
        const daysSinceService = lastService ? Math.floor((Date.now() - lastService.getTime()) / (1000 * 60 * 60 * 24)) : 999;
        
        if (daysSinceService > 300) {
          newInsights.push({
            id: `maintenance-${asset.id}`,
            type: 'maintenance',
            title: `${asset.asset_name} Maintenance Due`,
            description: `Asset has not been serviced for ${daysSinceService} days. Failure risk increasing.`,
            probability: Math.min(95, 60 + (daysSinceService - 300) * 0.5),
            impact: daysSinceService > 400 ? 'high' : 'medium',
            recommendedAction: 'Schedule immediate inspection and maintenance',
            daysAhead: Math.max(1, 365 - daysSinceService)
          });
        }
      });

      // Cost optimization insights
      const weeklyRequestCount = requests?.filter(r => 
        new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;

      if (weeklyRequestCount > 15) {
        newInsights.push({
          id: 'cost-spike',
          type: 'cost',
          title: 'Unusual Maintenance Activity',
          description: `${weeklyRequestCount} requests this week (above normal). Potential systemic issue.`,
          probability: 78,
          impact: 'high',
          recommendedAction: 'Investigate common failure patterns and implement preventive measures',
          daysAhead: 7
        });
      }

      // Performance insights
      const overdueCount = requests?.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < new Date() && r.status !== 'completed'
      ).length || 0;

      if (overdueCount > 5) {
        newInsights.push({
          id: 'performance-decline',
          type: 'performance',
          title: 'SLA Performance Declining',
          description: `${overdueCount} overdue requests detected. Team capacity may be insufficient.`,
          probability: 85,
          impact: 'medium',
          recommendedAction: 'Consider increasing team capacity or optimizing workflow',
          daysAhead: 14
        });
      }

      setInsights(newInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  }, []);

  // Generate system alerts
  const generateAlerts = useCallback(async () => {
    const newAlerts: SystemAlert[] = [];

    // Check for critical metrics
    metrics.forEach(metric => {
      if (metric.status === 'critical') {
        newAlerts.push({
          id: `alert-${metric.id}`,
          severity: 'critical',
          title: `Critical: ${metric.label}`,
          message: `${metric.label} is at ${metric.value}${metric.unit}, which is critically low.`,
          timestamp: new Date(),
          acknowledged: false
        });
      } else if (metric.status === 'warning' && metric.trend === 'down') {
        newAlerts.push({
          id: `warning-${metric.id}`,
          severity: 'warning',
          title: `Warning: ${metric.label} Declining`,
          message: `${metric.label} has been trending downward and is now at ${metric.value}${metric.unit}.`,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });

    // Add high-probability insights as alerts
    insights.forEach(insight => {
      if (insight.probability > 80 && insight.impact === 'high') {
        newAlerts.push({
          id: `insight-${insight.id}`,
          severity: 'warning',
          title: `Prediction: ${insight.title}`,
          message: `${insight.description} (${insight.probability}% probability)`,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });

    setAlerts(newAlerts);
  }, [metrics, insights]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      await fetchMetrics();
      await generateInsights();
      setLastUpdate(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics, generateInsights]);

  // Generate alerts when metrics or insights change
  useEffect(() => {
    if (metrics.length > 0 || insights.length > 0) {
      generateAlerts();
    }
  }, [metrics, insights, generateAlerts]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchMetrics();
      await generateInsights();
      setIsLoading(false);
      setLastUpdate(new Date());
    };

    loadData();
  }, [fetchMetrics, generateInsights]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, () => {
        fetchMetrics();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => {
        generateInsights();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics, generateInsights]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading real-time analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-Time Analytics Dashboard
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* System Alerts */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => !a.acknowledged).map(alert => (
            <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>{alert.title}</strong>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  Acknowledge
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(metric => {
          const IconComponent = metric.icon;
          const changePercent = metric.previousValue 
            ? ((metric.value - metric.previousValue) / metric.previousValue) * 100
            : 0;

          return (
            <Card key={metric.id} className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <Badge 
                    variant={metric.status === 'good' ? 'default' : 
                           metric.status === 'warning' ? 'secondary' : 'destructive'}
                  >
                    {metric.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {metric.value.toLocaleString()}{metric.unit}
                    </span>
                    <div className="flex items-center gap-1 text-sm">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : metric.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                      {changePercent !== 0 && (
                        <span className={changePercent > 0 ? 'text-green-500' : 'text-red-500'}>
                          {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {metric.target && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Target: {metric.target}{metric.unit}</span>
                        <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (metric.value / metric.target) * 100)} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Predictive Insights */}
      {insights.length > 0 && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Predictive Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map(insight => (
              <div key={insight.id} className="p-4 rounded-lg border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{insight.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={insight.impact === 'high' ? 'destructive' : 
                                  insight.impact === 'medium' ? 'secondary' : 'default'}>
                      {insight.impact} impact
                    </Badge>
                    <Badge variant="outline">
                      {insight.probability}% probability
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-primary">Recommended Action:</span>
                  <span className="text-muted-foreground">In {insight.daysAhead} days</span>
                </div>
                <p className="text-sm">{insight.recommendedAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}