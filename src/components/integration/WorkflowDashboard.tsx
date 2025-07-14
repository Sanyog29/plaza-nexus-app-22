import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  GitBranch, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ArrowRightLeft
} from 'lucide-react';
import { useWorkflowEngine } from '@/hooks/useWorkflowEngine';
import { formatDistanceToNow } from 'date-fns';

export const WorkflowDashboard: React.FC = () => {
  const { 
    triggers, 
    executions, 
    dataFlowMetrics, 
    loading, 
    refreshData 
  } = useWorkflowEngine();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const recentExecutions = executions.slice(0, 10);
  const successRate = executions.length > 0 
    ? (executions.filter(e => e.status === 'completed').length / executions.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integration Workflows</h2>
          <p className="text-muted-foreground">Monitor cross-module data flows and automation</p>
        </div>
        <Button onClick={refreshData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Triggers</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggers.length}</div>
            <p className="text-xs text-muted-foreground">
              Automated workflows enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions.filter(e => 
                new Date(e.started_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Workflows executed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Flows</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataFlowMetrics.length}</div>
            <p className="text-xs text-muted-foreground">
              Cross-module integrations
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="triggers">Active Triggers</TabsTrigger>
          <TabsTrigger value="dataflows">Data Flows</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Executions</CardTitle>
              <CardDescription>
                Latest automated workflow executions across all modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExecutions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No workflow executions found
                  </div>
                ) : (
                  recentExecutions.map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(execution.status)}
                        <div>
                          <div className="font-medium">
                            Execution #{execution.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(execution.status) as any}>
                          {execution.status}
                        </Badge>
                        {execution.error_message && (
                          <div className="text-xs text-destructive mt-1 max-w-xs truncate">
                            {execution.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflow Triggers</CardTitle>
              <CardDescription>
                Configured automation triggers for cross-module workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggers.map((trigger) => (
                  <div key={trigger.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <GitBranch className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{trigger.trigger_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {trigger.source_module} → {trigger.event_type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                        {trigger.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dataflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Module Data Flows</CardTitle>
              <CardDescription>
                Monitor data integration performance between system modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataFlowMetrics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data flow metrics available
                  </div>
                ) : (
                  dataFlowMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">
                            {metric.source_module} → {metric.target_module}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {metric.flow_type} • {metric.records_processed} records
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {metric.success_rate.toFixed(1)}% success
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {metric.avg_processing_time_ms}ms avg
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};