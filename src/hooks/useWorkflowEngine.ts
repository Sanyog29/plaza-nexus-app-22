import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkflowTrigger {
  id: string;
  trigger_name: string;
  source_module: string;
  event_type: string;
  conditions: any;
  is_active: boolean;
}

interface WorkflowExecution {
  id: string;
  trigger_id: string;
  execution_data: any;
  status: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  metadata: any;
}

interface DataFlowMetric {
  id: string;
  source_module: string;
  target_module: string;
  flow_type: string;
  records_processed: number;
  success_rate: number;
  avg_processing_time_ms: number;
  last_execution: string;
  metric_date: string;
}

export function useWorkflowEngine() {
  const [triggers, setTriggers] = useState<WorkflowTrigger[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [dataFlowMetrics, setDataFlowMetrics] = useState<DataFlowMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Execute a workflow trigger
  const executeWorkflow = useCallback(async (triggerName: string, eventData: Record<string, any>) => {
    try {
      setLoading(true);
      
      // Call the workflow orchestrator edge function
      const { data, error } = await supabase.functions.invoke('workflow-orchestrator', {
        body: {
          trigger: {
            type: triggerName,
            data: eventData,
            priority: 'medium'
          },
          context: {
            user_id: (await supabase.auth.getUser()).data.user?.id,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Workflow Executed',
        description: `Successfully triggered ${triggerName} workflow`,
      });

      return data;
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: 'Workflow Error',
        description: 'Failed to execute workflow',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get workflow triggers
  const fetchTriggers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_triggers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error) {
      console.error('Error fetching triggers:', error);
    }
  }, []);

  // Get recent workflow executions
  const fetchExecutions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_execution_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  }, []);

  // Get data flow metrics
  const fetchDataFlowMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('data_flow_metrics')
        .select('*')
        .gte('metric_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('last_execution', { ascending: false });

      if (error) throw error;
      setDataFlowMetrics(data || []);
    } catch (error) {
      console.error('Error fetching data flow metrics:', error);
    }
  }, []);

  // Auto-trigger workflows based on data changes
  const triggerMaintenanceCompleted = useCallback(async (requestId: string) => {
    return executeWorkflow('maintenance_completed', { request_id: requestId });
  }, [executeWorkflow]);

  const triggerTaskAssigned = useCallback(async (taskId: string, assignedTo: string) => {
    return executeWorkflow('task_assigned', { task_id: taskId, assigned_to: assignedTo });
  }, [executeWorkflow]);

  const triggerOrderCompleted = useCallback(async (orderId: string) => {
    return executeWorkflow('order_completed', { order_id: orderId });
  }, [executeWorkflow]);

  const triggerVisitorCheckedIn = useCallback(async (visitorId: string) => {
    return executeWorkflow('visitor_checked_in', { visitor_id: visitorId });
  }, [executeWorkflow]);

  useEffect(() => {
    fetchTriggers();
    fetchExecutions();
    fetchDataFlowMetrics();
  }, [fetchTriggers, fetchExecutions, fetchDataFlowMetrics]);

  // Set up real-time subscriptions for workflow executions
  useEffect(() => {
    const channel = supabase
      .channel('workflow-executions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_execution_logs'
        },
        (payload) => {
          setExecutions(prev => [payload.new as WorkflowExecution, ...prev.slice(0, 49)]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflow_execution_logs'
        },
        (payload) => {
          setExecutions(prev => 
            prev.map(exec => 
              exec.id === payload.new.id ? payload.new as WorkflowExecution : exec
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    triggers,
    executions,
    dataFlowMetrics,
    loading,
    executeWorkflow,
    triggerMaintenanceCompleted,
    triggerTaskAssigned,
    triggerOrderCompleted,
    triggerVisitorCheckedIn,
    refreshData: () => {
      fetchTriggers();
      fetchExecutions();
      fetchDataFlowMetrics();
    }
  };
}