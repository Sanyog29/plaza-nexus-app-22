import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useOptimizedDatabase } from '@/hooks/useOptimizedDatabase';
import { useErrorLogger } from '@/utils/errorLogger';

// Memoized components for better performance
const DatabaseMetricCard = memo(({ 
  title, 
  value, 
  description, 
  trend, 
  icon: Icon 
}: {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  icon: any;
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon className="h-8 w-8 text-primary" />
          {trend && (
            <Badge variant={trend === 'up' ? 'destructive' : trend === 'down' ? 'default' : 'secondary'}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
));

const SlowQueryItem = memo(({ query }: { query: { query: string; duration: number; timestamp: Date } }) => (
  <div className="flex items-center justify-between p-3 border rounded-lg">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{query.query}</p>
      <p className="text-xs text-muted-foreground">
        {query.timestamp.toLocaleTimeString()}
      </p>
    </div>
    <Badge variant={query.duration > 2000 ? 'destructive' : 'secondary'}>
      {Math.round(query.duration)}ms
    </Badge>
  </div>
));

const ErrorLogItem = memo(({ log }: { log: any }) => (
  <div className="flex items-start gap-3 p-3 border rounded-lg">
    <div className="flex-shrink-0">
      {log.level === 'error' ? (
        <XCircle className="h-4 w-4 text-destructive mt-0.5" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{log.message}</p>
      <p className="text-xs text-muted-foreground">
        {log.component && `Component: ${log.component} • `}
        {log.timestamp.toLocaleTimeString()}
      </p>
    </div>
  </div>
));

export const PerformanceMonitoringDashboard: React.FC = memo(() => {
  const {
    metrics,
    optimizations,
    analyzeQueryPerformance,
    updateOptimization,
    isOptimized
  } = useOptimizedDatabase();
  
  const { summary, logs } = useErrorLogger();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const performanceAnalysis = React.useMemo(() => 
    analyzeQueryPerformance(), 
    [analyzeQueryPerformance, metrics]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const healthScore = React.useMemo(() => {
    let score = 100;
    
    // Deduct points for performance issues
    if (metrics.avgQueryTime > 1000) score -= 20;
    if (metrics.slowQueries.length > 5) score -= 15;
    if (summary.errors > 0) score -= 25;
    if (!optimizations.aggregateQueries) score -= 10;
    if (!optimizations.enableIndexing) score -= 10;
    
    return Math.max(0, score);
  }, [metrics, summary, optimizations]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor database performance, errors, and system health
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Health</span>
              <Badge variant={healthScore >= 80 ? 'default' : healthScore >= 60 ? 'secondary' : 'destructive'}>
                {healthScore}%
              </Badge>
            </div>
            <Progress value={healthScore} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {isOptimized ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                Database Optimized
              </div>
              <div className="flex items-center gap-2">
                {summary.errors === 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                No Critical Errors
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DatabaseMetricCard
          title="Total Queries"
          value={metrics.queryCount.toLocaleString()}
          description="Since last restart"
          icon={Database}
        />
        <DatabaseMetricCard
          title="Avg Query Time"
          value={`${Math.round(metrics.avgQueryTime)}ms`}
          description="Response time"
          trend={metrics.avgQueryTime > 1000 ? 'up' : 'down'}
          icon={Clock}
        />
        <DatabaseMetricCard
          title="Slow Queries"
          value={metrics.slowQueries.length}
          description="Queries > 1s"
          trend={metrics.slowQueries.length > 0 ? 'up' : 'stable'}
          icon={AlertTriangle}
        />
        <DatabaseMetricCard
          title="Error Rate"
          value={`${summary.errors}%`}
          description="Last 24 hours"
          trend={summary.errors > 0 ? 'up' : 'stable'}
          icon={XCircle}
        />
      </div>

      {/* Detailed Monitoring */}
      <Tabs defaultValue="database" className="space-y-4">
        <TabsList>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Slow Queries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.slowQueries.length > 0 ? (
                  metrics.slowQueries.slice(0, 5).map((query, index) => (
                    <SlowQueryItem key={index} query={query} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No slow queries detected
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceAnalysis.recommendations.length > 0 ? (
                    performanceAnalysis.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      All optimizations are active
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Error Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.slice(0, 10).map((log) => (
                <ErrorLogItem key={log.id} log={log} />
              ))}
              {logs.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No recent errors
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Optimizations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(optimizations).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {key === 'aggregateQueries' && 'Combine multiple queries into single requests'}
                      {key === 'enableIndexing' && 'Use database indexes for faster queries'}
                      {key === 'performanceMonitoring' && 'Track query performance metrics'}
                      {key === 'materializedViews' && 'Cache complex query results'}
                    </p>
                  </div>
                  <Button
                    variant={value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateOptimization(key as any, !value)}
                  >
                    {value ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});