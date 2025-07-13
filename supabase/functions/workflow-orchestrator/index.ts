import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowTrigger {
  type: 'maintenance_request' | 'iot_anomaly' | 'sla_breach' | 'cost_threshold';
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface WorkflowAction {
  type: 'notification' | 'escalation' | 'resource_allocation' | 'auto_schedule';
  target: string;
  parameters: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { trigger, context } = await req.json();
    
    console.log('Workflow orchestrator triggered:', { trigger, context });

    // Determine workflow based on trigger type
    const workflow = await determineWorkflow(trigger, supabaseClient);
    
    // Execute workflow steps
    const executionId = await executeWorkflow(workflow, trigger, context, supabaseClient);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        executionId,
        workflow: workflow.id,
        message: 'Workflow orchestrated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Workflow orchestration error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function determineWorkflow(trigger: WorkflowTrigger, supabase: any) {
  // AI-powered workflow selection logic
  let workflowId = 'default';
  let actions: WorkflowAction[] = [];

  switch (trigger.type) {
    case 'maintenance_request':
      if (trigger.priority === 'critical') {
        workflowId = 'emergency_maintenance';
        actions = [
          {
            type: 'notification',
            target: 'ops_supervisors',
            parameters: { immediate: true, method: 'sms' }
          },
          {
            type: 'escalation',
            target: 'management',
            parameters: { level: 2, timeout: 15 }
          },
          {
            type: 'resource_allocation',
            target: 'technicians',
            parameters: { priority_override: true, skills_required: trigger.data.skills }
          }
        ];
      } else {
        workflowId = 'standard_maintenance';
        actions = [
          {
            type: 'notification',
            target: 'assigned_technician',
            parameters: { method: 'email' }
          },
          {
            type: 'auto_schedule',
            target: 'maintenance_calendar',
            parameters: { sla_deadline: trigger.data.sla_deadline }
          }
        ];
      }
      break;

    case 'iot_anomaly':
      workflowId = 'anomaly_response';
      actions = [
        {
          type: 'notification',
          target: 'facility_team',
          parameters: { sensor_id: trigger.data.sensor_id, severity: trigger.priority }
        }
      ];
      
      if (trigger.priority === 'critical') {
        actions.push({
          type: 'escalation',
          target: 'emergency_contacts',
          parameters: { immediate: true }
        });
      }
      break;

    case 'cost_threshold':
      workflowId = 'cost_optimization';
      actions = [
        {
          type: 'notification',
          target: 'finance_team',
          parameters: { budget_exceeded: trigger.data.amount }
        },
        {
          type: 'resource_allocation',
          target: 'procurement',
          parameters: { freeze_requests: true }
        }
      ];
      break;
  }

  return { id: workflowId, actions };
}

async function executeWorkflow(
  workflow: any, 
  trigger: WorkflowTrigger, 
  context: any, 
  supabase: any
) {
  // Log workflow execution
  const { data: execution, error } = await supabase.rpc('log_workflow_execution', {
    rule_id: workflow.id,
    context: { trigger, workflow_context: context },
    log_entry: { 
      action: 'workflow_started', 
      timestamp: new Date().toISOString(),
      actions_planned: workflow.actions.length
    }
  });

  if (error) {
    console.error('Error logging workflow execution:', error);
    throw error;
  }

  // Execute each action in the workflow
  for (const action of workflow.actions) {
    try {
      await executeAction(action, trigger.data, supabase);
      
      // Log successful action
      await updateExecutionLog(execution, {
        action: 'action_completed',
        action_type: action.type,
        target: action.target,
        timestamp: new Date().toISOString(),
        status: 'success'
      }, supabase);
      
    } catch (actionError) {
      console.error(`Error executing action ${action.type}:`, actionError);
      
      // Log failed action
      await updateExecutionLog(execution, {
        action: 'action_failed',
        action_type: action.type,
        error: actionError.message,
        timestamp: new Date().toISOString(),
        status: 'failed'
      }, supabase);
    }
  }

  // Mark workflow as completed
  await supabase
    .from('workflow_executions')
    .update({ 
      execution_status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', execution);

  return execution;
}

async function executeAction(action: WorkflowAction, triggerData: any, supabase: any) {
  switch (action.type) {
    case 'notification':
      await sendNotification(action, triggerData, supabase);
      break;
    case 'escalation':
      await createEscalation(action, triggerData, supabase);
      break;
    case 'resource_allocation':
      await allocateResources(action, triggerData, supabase);
      break;
    case 'auto_schedule':
      await autoSchedule(action, triggerData, supabase);
      break;
  }
}

async function sendNotification(action: WorkflowAction, triggerData: any, supabase: any) {
  // Create notification records
  const message = generateNotificationMessage(action, triggerData);
  
  if (action.target === 'ops_supervisors') {
    // Get all ops supervisors
    const { data: supervisors } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ops_supervisor');

    for (const supervisor of supervisors || []) {
      await supabase.rpc('create_notification', {
        target_user_id: supervisor.id,
        notification_title: 'Urgent: Workflow Action Required',
        notification_message: message,
        notification_type: action.parameters.immediate ? 'critical' : 'info'
      });
    }
  }
}

async function createEscalation(action: WorkflowAction, triggerData: any, supabase: any) {
  // Create escalation log entry
  await supabase
    .from('escalation_logs')
    .insert({
      request_id: triggerData.request_id,
      escalation_type: 'workflow_auto',
      escalation_reason: 'Automated workflow escalation',
      metadata: {
        workflow_action: action,
        trigger_data: triggerData,
        timestamp: new Date().toISOString()
      }
    });
}

async function allocateResources(action: WorkflowAction, triggerData: any, supabase: any) {
  // Implement resource allocation logic
  console.log('Allocating resources:', action, triggerData);
}

async function autoSchedule(action: WorkflowAction, triggerData: any, supabase: any) {
  // Implement auto-scheduling logic
  console.log('Auto-scheduling:', action, triggerData);
}

function generateNotificationMessage(action: WorkflowAction, triggerData: any): string {
  return `Automated workflow action: ${action.type} for ${action.target}. Trigger data: ${JSON.stringify(triggerData).substring(0, 100)}...`;
}

async function updateExecutionLog(executionId: string, logEntry: any, supabase: any) {
  // Update the execution log with new entry
  const { data: currentExecution } = await supabase
    .from('workflow_executions')
    .select('execution_log')
    .eq('id', executionId)
    .single();

  const updatedLog = [...(currentExecution?.execution_log || []), logEntry];

  await supabase
    .from('workflow_executions')
    .update({ execution_log: updatedLog })
    .eq('id', executionId);
}