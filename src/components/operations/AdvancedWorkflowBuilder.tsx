import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Workflow, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  GitBranch, 
  Zap, 
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Target
} from 'lucide-react';

interface WorkflowExecution {
  id: string;
  workflow_rule_id: string;
  trigger_context: any;
  execution_status: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  execution_log: any;
}

export const AdvancedWorkflowBuilder: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkflows, setActiveWorkflows] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkflowExecutions();
    calculateMetrics();
  }, []);

  const fetchWorkflowExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workflow executions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('execution_status')
        .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      
      const total = data?.length || 0;
      const successful = data?.filter(w => w.execution_status === 'completed').length || 0;
      const running = data?.filter(w => w.execution_status === 'running').length || 0;
      
      setActiveWorkflows(running);
      setSuccessRate(total > 0 ? (successful / total) * 100 : 0);
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'running':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold text-blue-600">{activeWorkflows}</p>
              </div>
              <Workflow className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate (24h)</p>
                <p className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Decisions</p>
                <p className="text-2xl font-bold text-purple-600">247</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
          <TabsTrigger value="executions">Live Executions</TabsTrigger>
          <TabsTrigger value="ai-engine">AI Engine</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Visual Workflow Designer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Workflow Templates</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Equipment Failure Response', triggers: 3, actions: 7 },
                      { name: 'Emergency Escalation', triggers: 2, actions: 5 },
                      { name: 'Predictive Maintenance', triggers: 4, actions: 8 },
                      { name: 'Resource Optimization', triggers: 3, actions: 6 }
                    ].map((template, index) => (
                      <Card key={index} className="p-3 hover:bg-accent/50 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {template.triggers} triggers • {template.actions} actions
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Use
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Smart Triggers</h3>
                  <div className="space-y-2">
                    {[
                      { type: 'IoT Anomaly', description: 'Sensor readings outside normal range', active: true },
                      { type: 'SLA Breach Risk', description: 'Predictive early warning system', active: true },
                      { type: 'Cost Threshold', description: 'Budget limit approaching', active: false },
                      { type: 'Pattern Recognition', description: 'AI-detected unusual patterns', active: true }
                    ].map((trigger, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{trigger.type}</p>
                          <p className="text-sm text-muted-foreground">{trigger.description}</p>
                        </div>
                        <Badge className={trigger.active ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'}>
                          {trigger.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Live Workflow Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.execution_status)}
                      <div>
                        <p className="font-medium">{execution.workflow_rule_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Started {new Date(execution.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(execution.execution_status)}>
                        {execution.execution_status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {executions.length === 0 && (
                  <div className="text-center py-12">
                    <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No workflow executions found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-engine" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Decision Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Decision Models</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Escalation Predictor', accuracy: 85.4, status: 'active' },
                      { name: 'Resource Optimizer', accuracy: 78.9, status: 'active' },
                      { name: 'Failure Forecaster', accuracy: 92.1, status: 'training' },
                      { name: 'Cost Analyzer', accuracy: 76.3, status: 'active' }
                    ].map((model, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{model.name}</p>
                          <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                            {model.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Accuracy</span>
                            <span>{model.accuracy}%</span>
                          </div>
                          <Progress value={model.accuracy} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recent AI Decisions</h3>
                  <div className="space-y-2">
                    {[
                      { decision: 'Auto-escalated maintenance request #M-2024-1234', confidence: 94, time: '2 min ago' },
                      { decision: 'Optimized staff allocation for Zone A', confidence: 87, time: '5 min ago' },
                      { decision: 'Predicted equipment failure in 3 days', confidence: 91, time: '8 min ago' },
                      { decision: 'Recommended cost optimization strategy', confidence: 83, time: '12 min ago' }
                    ].map((decision, index) => (
                      <div key={index} className="p-3 bg-accent/50 rounded-lg">
                        <p className="text-sm font-medium">{decision.decision}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-muted-foreground">{decision.time}</span>
                          <Badge variant="outline" className="text-xs">
                            {decision.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};