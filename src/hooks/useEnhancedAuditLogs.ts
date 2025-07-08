import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface EnhancedAuditLog {
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

interface AuditMetrics {
  totalActions: number;
  criticalActions: number;
  failedActions: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  activityTrend: Array<{ date: string; count: number }>;
}

export const useEnhancedAuditLogs = () => {
  const { user, isAdmin } = useAuth();
  const [auditLogs, setAuditLogs] = useState<EnhancedAuditLog[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
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

      setAuditLogs((data || []) as EnhancedAuditLog[]);
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

  const fetchAuditMetrics = async (days = 30) => {
    if (!isAdmin) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, resource_type, created_at, user_id')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Calculate metrics
      const totalActions = data.length;
      const criticalActions = data.filter(log => 
        ['DELETE', 'UPDATE_ROLE', 'SYSTEM_CONFIG'].some(critical => 
          log.action.toUpperCase().includes(critical)
        )
      ).length;
      const failedActions = data.filter(log => 
        log.action.includes('FAILED') || log.action.includes('ERROR')
      ).length;
      const uniqueUsers = new Set(data.map(log => log.user_id)).size;

      // Top actions
      const actionCounts = data.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topActions = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      // Activity trend (daily)
      const activityByDate = data.reduce((acc, log) => {
        const date = log.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const activityTrend = Object.entries(activityByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      setMetrics({
        totalActions,
        criticalActions,
        failedActions,
        uniqueUsers,
        topActions,
        activityTrend
      });
    } catch (error: any) {
      console.error('Error fetching audit metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load audit metrics: " + error.message,
        variant: "destructive",
      });
    }
  };

  const exportAuditLogs = async (filters?: any) => {
    if (!isAdmin) return;

    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user_profile:profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      // Apply same filters as fetchAuditLogs
      if (filters?.action) query = query.eq('action', filters.action);
      if (filters?.resource_type) query = query.eq('resource_type', filters.resource_type);
      if (filters?.user_id) query = query.eq('user_id', filters.user_id);
      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Convert to CSV
      const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Changes'];
      const rows = data.map(log => [
        log.created_at,
        log.user_profile ? `${log.user_profile.first_name} ${log.user_profile.last_name}` : 'System',
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.ip_address || '',
        JSON.stringify({ old: log.old_values, new: log.new_values })
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      // Download file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: `${data.length} audit log entries exported.`
      });
    } catch (error: any) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to export audit logs: " + error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchAuditLogs();
      if (isAdmin) {
        fetchAuditMetrics();
      }
    }
  }, [user, isAdmin]);

  return {
    auditLogs,
    metrics,
    isLoading,
    totalCount,
    fetchAuditLogs,
    fetchAuditMetrics,
    exportAuditLogs
  };
};