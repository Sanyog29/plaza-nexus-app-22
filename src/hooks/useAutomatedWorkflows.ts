import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface WorkflowRule {
  id: string;
  trigger: 'visitor_status_change' | 'visitor_overdue' | 'emergency_alert' | 'maintenance_request';
  conditions: Record<string, any>;
  actions: WorkflowAction[];
  isActive: boolean;
}

interface WorkflowAction {
  type: 'create_alert' | 'send_notification' | 'create_maintenance_request' | 'send_email' | 'log_incident';
  params: Record<string, any>;
}

const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: 'visitor-vip-checkin',
    trigger: 'visitor_status_change',
    conditions: {
      status: 'checked_in',
      category: 'vip'
    },
    actions: [
      {
        type: 'send_notification',
        params: {
          title: 'VIP Visitor Checked In',
          message: 'A VIP visitor has checked in and may require special attention',
          recipients: ['admin', 'security']
        }
      },
      {
        type: 'create_alert',
        params: {
          severity: 'info',
          title: 'VIP Visitor Present',
          message: 'VIP visitor in building - ensure premium service standards'
        }
      }
    ],
    isActive: true
  },
  {
    id: 'visitor-overdue-security',
    trigger: 'visitor_overdue',
    conditions: {
      overdueMinutes: 30
    },
    actions: [
      {
        type: 'send_notification',
        params: {
          title: 'Overdue Visitor Security Check',
          message: 'Visitor significantly overdue - security verification required',
          recipients: ['security']
        }
      },
      {
        type: 'log_incident',
        params: {
          type: 'security_check',
          priority: 'medium'
        }
      }
    ],
    isActive: true
  },
  {
    id: 'emergency-maintenance-trigger',
    trigger: 'emergency_alert',
    conditions: {
      type: ['fire', 'evacuation']
    },
    actions: [
      {
        type: 'create_maintenance_request',
        params: {
          title: 'Emergency System Check Required',
          description: 'Post-emergency safety system inspection needed',
          priority: 'urgent',
          category: 'safety'
        }
      }
    ],
    isActive: true
  },
  {
    id: 'visitor-security-incident',
    trigger: 'visitor_status_change',
    conditions: {
      hasSecurityFlag: true
    },
    actions: [
      {
        type: 'send_notification',
        params: {
          title: 'Security Flagged Visitor',
          message: 'Visitor with security flag has entered the building',
          recipients: ['security', 'admin']
        }
      },
      {
        type: 'create_alert',
        params: {
          severity: 'warning',
          title: 'Security Alert',
          message: 'Flagged visitor requires monitoring'
        }
      }
    ],
    isActive: true
  }
];

export const useAutomatedWorkflows = () => {
  const { user } = useAuth();

  const executeWorkflowAction = useCallback(async (action: WorkflowAction, context: Record<string, any>) => {
    try {
      switch (action.type) {
        case 'create_alert':
          await supabase.from('alerts').insert({
            title: action.params.title,
            message: action.params.message,
            severity: action.params.severity || 'info',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          });
          break;

        case 'send_notification':
          const recipients = action.params.recipients || ['admin'];
          
          // Create notifications for each recipient role
          for (const role of recipients) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id')
              .eq('role', role);

            if (profiles) {
              for (const profile of profiles) {
                await supabase.rpc('create_notification', {
                  target_user_id: profile.id,
                  notification_title: action.params.title,
                  notification_message: action.params.message,
                  notification_type: 'info',
                  action_url: action.params.actionUrl || null
                });
              }
            }
          }
          break;

        case 'create_maintenance_request':
          await supabase.from('maintenance_requests').insert({
            title: action.params.title,
            description: action.params.description,
            priority: action.params.priority || 'medium',
            location: context.location || 'Auto-generated',
            reported_by: user?.id
          });
          break;

        case 'send_email':
          await supabase.functions.invoke('send-email', {
            body: {
              to: action.params.recipients,
              subject: action.params.subject,
              html: action.params.html
            }
          });
          break;

        case 'log_incident':
          await supabase.from('visitor_check_logs').insert({
            visitor_id: context.visitorId || null,
            action_type: 'automated_workflow',
            performed_by: user?.id,
            notes: `Automated workflow: ${action.params.type}`,
            metadata: {
              workflow_action: action.type,
              context: context,
              priority: action.params.priority
            }
          });
          break;
      }
    } catch (error) {
      console.error('Error executing workflow action:', error);
    }
  }, [user]);

  const processWorkflow = useCallback(async (
    trigger: WorkflowRule['trigger'], 
    context: Record<string, any>
  ) => {
    const applicableRules = DEFAULT_WORKFLOW_RULES.filter(rule => 
      rule.trigger === trigger && rule.isActive
    );

    for (const rule of applicableRules) {
      // Check if conditions are met
      const conditionsMet = Object.entries(rule.conditions).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(context[key]);
        }
        return context[key] === value || (typeof value === 'number' && context[key] >= value);
      });

      if (conditionsMet) {
        console.log(`Executing workflow: ${rule.id}`, context);
        
        // Execute all actions for this rule
        for (const action of rule.actions) {
          await executeWorkflowAction(action, context);
        }
      }
    }
  }, [executeWorkflowAction]);

  // Set up real-time listeners for workflow triggers
  useEffect(() => {
    if (!user) return;

    // Listen for visitor status changes
    const visitorChannel = supabase
      .channel('workflow-visitor-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'visitors'
        },
        async (payload) => {
          const { old: oldVisitor, new: newVisitor } = payload;
          
          if (oldVisitor.status !== newVisitor.status) {
            await processWorkflow('visitor_status_change', {
              visitorId: newVisitor.id,
              status: newVisitor.status,
              oldStatus: oldVisitor.status,
              category: newVisitor.category,
              hasSecurityFlag: newVisitor.security_notes ? true : false,
              location: 'Main Building'
            });
          }
        }
      )
      .subscribe();

    // Listen for emergency alerts
    const alertChannel = supabase
      .channel('workflow-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitor_check_logs'
        },
        async (payload) => {
          const log = payload.new;
          
          if (log.action_type === 'emergency_alert') {
            await processWorkflow('emergency_alert', {
              type: log.metadata?.type,
              severity: log.metadata?.severity || 'medium',
              location: log.location
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(visitorChannel);
      supabase.removeChannel(alertChannel);
    };
  }, [user, processWorkflow]);

  // Function to manually trigger workflow (for testing or external triggers)
  const triggerWorkflow = useCallback(async (
    trigger: WorkflowRule['trigger'],
    context: Record<string, any>
  ) => {
    await processWorkflow(trigger, context);
    toast.success('Workflow triggered successfully');
  }, [processWorkflow]);

  // Function to check for overdue visitors (called periodically)
  const checkOverdueVisitors = useCallback(async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const { data: overdueVisitors } = await supabase
        .from('visitors')
        .select('*')
        .eq('visit_date', today)
        .eq('status', 'scheduled')
        .eq('approval_status', 'approved');

      if (overdueVisitors) {
        for (const visitor of overdueVisitors) {
          const expectedTime = new Date(`${visitor.visit_date}T${visitor.entry_time}`);
          const overdueDuration = now.getTime() - expectedTime.getTime();
          const overdueMinutes = Math.floor(overdueDuration / (1000 * 60));

          if (overdueMinutes > 15) {
            await processWorkflow('visitor_overdue', {
              visitorId: visitor.id,
              overdueMinutes,
              expectedTime: visitor.entry_time,
              visitorName: visitor.name
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking overdue visitors:', error);
    }
  }, [processWorkflow]);

  return {
    triggerWorkflow,
    checkOverdueVisitors,
    processWorkflow
  };
};