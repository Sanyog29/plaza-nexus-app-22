import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
  };
}

export const useAuditLogs = () => {
  const { user, isAdmin } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAuditLogs = async (page = 1, limit = 50, filters?: {
    action?: string;
    resource_type?: string;
    user_id?: string;
    date_range?: { start: string; end: string };
  }) => {
    if (!isAdmin && !user) return;

    try {
      setIsLoading(true);

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user_profile:profiles(first_name, last_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      // Apply filters
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      // If not admin, only show user's own logs
      if (!isAdmin) {
        query = query.eq('user_id', user!.id);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setAuditLogs((data || []) as AuditLog[]);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logAction = async (
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('log_audit_event', {
        action_type: action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error logging audit event:', error);
      // Don't show toast for audit logging errors to avoid user disruption
    }
  };

  const getActionSummary = () => {
    const summary = auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(summary)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  };

  const getResourceSummary = () => {
    const summary = auditLogs.reduce((acc, log) => {
      acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(summary)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  };

  const getUserActivity = () => {
    const activity = auditLogs.reduce((acc, log) => {
      if (log.user_profile) {
        const userName = `${log.user_profile.first_name} ${log.user_profile.last_name}`.trim();
        acc[userName] = (acc[userName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(activity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  };

  const getRecentActivity = (days = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return auditLogs.filter(log => 
      new Date(log.created_at) >= cutoff
    );
  };

  useEffect(() => {
    if (user) {
      fetchAuditLogs();
    }
  }, [user, isAdmin]);

  return {
    auditLogs,
    isLoading,
    totalCount,
    fetchAuditLogs,
    logAction,
    getActionSummary,
    getResourceSummary,
    getUserActivity,
    getRecentActivity
  };
};