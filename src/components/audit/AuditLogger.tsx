import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface AuditEvent {
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
}

export const useAuditLogger = () => {
  const { user } = useAuth();

  const logEvent = async (event: AuditEvent) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: event.action,
          resource_type: event.resource_type,
          resource_id: event.resource_id,
          old_values: event.old_values,
          new_values: event.new_values,
          ip_address: await getUserIP(),
          user_agent: navigator.userAgent
        });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  };

  // Helper functions for common audit events
  const logCreate = (resourceType: string, resourceId: string, values: Record<string, any>) => {
    logEvent({
      action: 'CREATE',
      resource_type: resourceType,
      resource_id: resourceId,
      new_values: values
    });
  };

  const logUpdate = (
    resourceType: string, 
    resourceId: string, 
    oldValues: Record<string, any>, 
    newValues: Record<string, any>
  ) => {
    logEvent({
      action: 'UPDATE',
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues
    });
  };

  const logDelete = (resourceType: string, resourceId: string, values: Record<string, any>) => {
    logEvent({
      action: 'DELETE',
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: values
    });
  };

  const logView = (resourceType: string, resourceId?: string, metadata?: Record<string, any>) => {
    logEvent({
      action: 'VIEW',
      resource_type: resourceType,
      resource_id: resourceId,
      metadata
    });
  };

  const logLogin = () => {
    logEvent({
      action: 'LOGIN',
      resource_type: 'auth',
      metadata: { timestamp: new Date().toISOString() }
    });
  };

  const logLogout = () => {
    logEvent({
      action: 'LOGOUT',
      resource_type: 'auth',
      metadata: { timestamp: new Date().toISOString() }
    });
  };

  return {
    logEvent,
    logCreate,
    logUpdate,
    logDelete,
    logView,
    logLogin,
    logLogout
  };
};

// Get user IP address (simplified - in production, you'd use a proper service)
const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
};

// HOC to automatically log component views
export const withAuditLogging = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resourceType: string
) => {
  const AuditedComponent = (props: P) => {
    const { logView } = useAuditLogger();

    useEffect(() => {
      logView(resourceType);
    }, [logView]);

    return <WrappedComponent {...props} />;
  };

  AuditedComponent.displayName = `withAuditLogging(${WrappedComponent.displayName || WrappedComponent.name})`;
  return AuditedComponent;
};