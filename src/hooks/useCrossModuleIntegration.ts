import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface IntegrationEvent {
  module: 'visitor' | 'security' | 'maintenance' | 'emergency';
  action: string;
  data: Record<string, any>;
  timestamp: string;
}

export const useCrossModuleIntegration = () => {
  const { user } = useAuth();

  // Create maintenance request from visitor incident
  const createMaintenanceFromIncident = useCallback(async (
    incidentType: string,
    location: string,
    description: string,
    visitorId?: string
  ) => {
    try {
      const maintenanceData = {
        title: `${incidentType} - Maintenance Required`,
        description: `${description}\n\nTriggered by: ${incidentType}${visitorId ? ` (Visitor ID: ${visitorId})` : ''}`,
        location,
        priority: (incidentType.includes('emergency') ? 'urgent' : 'high') as 'low' | 'medium' | 'high' | 'urgent',
        reported_by: user?.id,
        category_id: null // Will be auto-categorized
      };

      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert(maintenanceData)
        .select()
        .maybeSingle();

      if (error) throw error;

      toast.success('Maintenance request created from incident');
      return data;
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      toast.error('Failed to create maintenance request');
    }
  }, [user]);

  // Create security alert from visitor anomaly
  const createSecurityAlert = useCallback(async (
    alertType: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ) => {
    try {
      const alertData = {
        title: `Security Alert: ${alertType}`,
        message,
        severity,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      const { data, error } = await supabase
        .from('alerts')
        .insert(alertData)
        .select()
        .maybeSingle();

      if (error) throw error;

      // Also log the security incident
      await supabase.from('visitor_check_logs').insert({
        visitor_id: metadata?.visitorId || null,
        action_type: 'security_alert',
        performed_by: user?.id,
        notes: `Security alert created: ${alertType}`,
        metadata: {
          alert_type: alertType,
          severity,
          ...metadata
        }
      });

      toast.success('Security alert created');
      return data;
    } catch (error) {
      console.error('Error creating security alert:', error);
      toast.error('Failed to create security alert');
    }
  }, [user]);

  // Process visitor event and trigger cross-module actions
  const processVisitorEvent = useCallback(async (
    visitorId: string,
    eventType: string,
    eventData: Record<string, any>
  ) => {
    try {
      // Get visitor details
      const { data: visitor } = await supabase
        .from('visitors')
        .select(`
          *,
          visitor_categories (name, color),
          profiles_public!inner (first_name, last_name, assigned_role_title)
        `)
        .eq('id', visitorId)
        .maybeSingle();

      if (!visitor) return;

      // Process different event types
      switch (eventType) {
        case 'security_incident':
          await createSecurityAlert(
            'Visitor Security Incident',
            `Security incident involving visitor: ${visitor.name}`,
            'high',
            { visitorId, ...eventData }
          );
          
          // Create maintenance request if facility damage reported
          if (eventData.facilityDamage) {
            await createMaintenanceFromIncident(
              'Security Incident',
              eventData.location || 'Unknown Location',
              `Facility damage reported during security incident with visitor ${visitor.name}`,
              visitorId
            );
          }
          break;

        case 'medical_emergency':
          await createSecurityAlert(
            'Medical Emergency',
            `Medical emergency involving visitor: ${visitor.name}`,
            'critical',
            { visitorId, ...eventData }
          );
          
          // Trigger emergency protocols
          await supabase.functions.invoke('send-email', {
            body: {
              to: ['admin@plaza.com', 'security@plaza.com'],
              subject: '🚨 MEDICAL EMERGENCY - Immediate Response Required',
              html: `
                <h2 style="color: #dc2626;">MEDICAL EMERGENCY</h2>
                <p><strong>Visitor:</strong> ${visitor.name}</p>
                <p><strong>Company:</strong> ${visitor.company || 'N/A'}</p>
                <p><strong>Host:</strong> ${(() => {
                  const profiles = visitor.profiles_public;
                  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
                  return profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';
                })()}</p>
                <p><strong>Location:</strong> ${eventData.location || 'Unknown'}</p>
                <p><strong>Details:</strong> ${eventData.details || 'No details provided'}</p>
                <hr>
                <p><em>Immediate response required. Contact emergency services if not already done.</em></p>
              `
            }
          });
          break;

        case 'equipment_damage':
          await createMaintenanceFromIncident(
            'Equipment Damage',
            eventData.location || 'Unknown Location',
            `Equipment damage reported by/involving visitor ${visitor.name}. Details: ${eventData.details}`,
            visitorId
          );
          break;

        case 'vip_arrival':
          // Send notifications to relevant staff via user_roles
          const { data: adminRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .in('role', ['admin', 'ops_supervisor']);
          
          const staffProfiles = adminRoles ? { data: adminRoles.map(r => ({ id: r.user_id })) } : { data: null };

          if (staffProfiles.data) {
            for (const profile of staffProfiles.data) {
              await supabase.rpc('create_notification', {
                target_user_id: profile.id,
                notification_title: 'VIP Visitor Arrival',
                notification_message: `VIP visitor ${visitor.name} has arrived. Please ensure premium service standards.`,
                notification_type: 'info',
                action_url: '/security'
              });
            }
          }
          break;

        case 'overdue_checkout':
          await createSecurityAlert(
            'Overdue Visitor',
            `Visitor ${visitor.name} is overdue for checkout`,
            'medium',
            { visitorId, expectedCheckout: eventData.expectedCheckout }
          );
          break;
      }

      // Log the cross-module integration event
      await supabase.from('visitor_check_logs').insert({
        visitor_id: visitorId,
        action_type: 'cross_module_integration',
        performed_by: user?.id,
        notes: `Cross-module event processed: ${eventType}`,
        metadata: {
          event_type: eventType,
          integration_actions: ['alert_created', 'notifications_sent'],
          ...eventData
        }
      });

    } catch (error) {
      console.error('Error processing visitor event:', error);
      toast.error('Failed to process visitor event');
    }
  }, [user, createSecurityAlert, createMaintenanceFromIncident]);

  // Set up real-time integration listeners
  useEffect(() => {
    if (!user) return;

    // Listen for visitor check logs that might trigger cross-module actions
    const integrationChannel = supabase
      .channel('cross-module-integration')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitor_check_logs'
        },
        async (payload) => {
          const log = payload.new;
          
          // Process logs that indicate cross-module integration needs
          if (log.metadata?.requiresIntegration) {
            await processVisitorEvent(
              log.visitor_id,
              log.metadata.event_type,
              log.metadata
            );
          }
        }
      )
      .subscribe();

    // Listen for maintenance requests that might need visitor context
    const maintenanceChannel = supabase
      .channel('maintenance-visitor-integration')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maintenance_requests'
        },
        async (payload) => {
          const request = payload.new;
          
          // If maintenance request mentions visitor, add context
          if (request.description?.toLowerCase().includes('visitor')) {
            // Get current visitors in the area
            const { data: nearbyVisitors } = await supabase
              .from('visitors')
              .select('*')
              .eq('status', 'checked_in');

            if (nearbyVisitors && nearbyVisitors.length > 0) {
              // Add comment with visitor context
              await supabase.from('request_comments').insert({
                request_id: request.id,
                user_id: user.id,
                content: `Active visitors in building during this request: ${nearbyVisitors.map(v => v.name).join(', ')}`
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(integrationChannel);
      supabase.removeChannel(maintenanceChannel);
    };
  }, [user, processVisitorEvent]);

  return {
    processVisitorEvent,
    createSecurityAlert,
    createMaintenanceFromIncident
  };
};