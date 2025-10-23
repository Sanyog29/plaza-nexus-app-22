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
  ip_address?: unknown;
  user_agent?: string;
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    assigned_role_title?: string;
  };
}

interface AuditStats {
  totalLogs: number;
  uniqueUsers: number;
  mostActiveUser: string;
  commonActions: { action: string; count: number }[];
  recentActivity: EnhancedAuditLog[];
  riskEvents: EnhancedAuditLog[];
}

export function useEnhancedAuditLogs() {
  const { user, isAdmin } = useAuth();
  const [auditLogs, setAuditLogs] = useState<EnhancedAuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    user_id: '',
    date_range: { start: '', end: '' }
  });

  useEffect(() => {
    if (isAdmin) {
      fetchAuditLogs();
      fetchAuditStats();
    }
  }, [user, isAdmin, filters]);

  const fetchAuditLogs = async (page = 1, limit = 50) => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user_profile:profiles_public(first_name, last_name, assigned_role_title)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.date_range.start) {
        query = query.gte('created_at', filters.date_range.start);
      }
      if (filters.date_range.end) {
        query = query.lte('created_at', filters.date_range.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAuditLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    if (!isAdmin) return;

    try {
      // Get total count and stats
      const { data: allLogs, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user_profile:profiles_public(first_name, last_name, assigned_role_title)
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) throw error;

      if (!allLogs) return;

      // Calculate statistics
      const uniqueUsers = new Set(allLogs.map(log => log.user_id)).size;
      
      // Most active user
      const userActivity = allLogs.reduce((acc, log) => {
        if (log.user_id) {
          acc[log.user_id] = (acc[log.user_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const mostActiveUserId = Object.entries(userActivity)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      const mostActiveUser = allLogs.find(log => log.user_id === mostActiveUserId)?.user_profile;
      const mostActiveUserName = mostActiveUser 
        ? `${mostActiveUser.first_name} ${mostActiveUser.last_name}`.trim()
        : 'Unknown';

      // Common actions
      const actionCounts = allLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonActions = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }));

      // Recent activity (last 24 hours)
      const recentActivity = allLogs.filter(log => 
        new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).slice(0, 10);

      // Risk events (sensitive actions)
      const sensitiveActions = ['DELETE', 'UPDATE', 'user_role_change', 'system_setting_change'];
      const riskEvents = allLogs.filter(log => 
        sensitiveActions.some(action => log.action.toUpperCase().includes(action.toUpperCase()))
      ).slice(0, 10);

      setAuditStats({
        totalLogs: allLogs.length,
        uniqueUsers,
        mostActiveUser: mostActiveUserName,
        commonActions,
        recentActivity,
        riskEvents
      });

    } catch (error: any) {
      console.error('Error fetching audit stats:', error);
    }
  };

  const exportAuditLogs = async (format: 'csv' | 'json' = 'csv') => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user_profile:profiles_public(first_name, last_name, assigned_role_title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedData = data?.map(log => ({
        timestamp: log.created_at,
        user: log.user_profile ? `${log.user_profile.first_name} ${log.user_profile.last_name}` : 'System',
        action: log.action,
        resource: log.resource_type,
        resource_id: log.resource_id,
        ip_address: log.ip_address,
        user_agent: log.user_agent ? log.user_agent.substring(0, 100) : '', // Truncate for readability
        old_values: JSON.stringify(log.old_values || {}),
        new_values: JSON.stringify(log.new_values || {})
      }));

      if (format === 'csv') {
        // Simple CSV export
        const headers = Object.keys(processedData?.[0] || {});
        const csvContent = [
          headers.join(','),
          ...(processedData || []).map(row => 
            headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // JSON export
        const blob = new Blob([JSON.stringify(processedData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Success",
        description: `Audit logs exported as ${format.toUpperCase()}`,
      });

    } catch (error: any) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to export audit logs",
        variant: "destructive",
      });
    }
  };

  const searchLogs = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      fetchAuditLogs();
      return;
    }

    const filtered = auditLogs.filter(log => 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_profile && 
        `${log.user_profile.first_name} ${log.user_profile.last_name}`
          .toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    setAuditLogs(filtered);
  };

  const getActionsByTimeframe = (timeframe: 'hour' | 'day' | 'week' = 'day') => {
    const groupedData: Record<string, number> = {};
    
    auditLogs.forEach(log => {
      const logDate = new Date(log.created_at);
      let key: string;
      
      switch (timeframe) {
        case 'hour':
          key = logDate.toISOString().substring(0, 13); // YYYY-MM-DDTHH
          break;
        case 'week':
          const weekStart = new Date(logDate);
          weekStart.setDate(logDate.getDate() - logDate.getDay());
          key = weekStart.toISOString().substring(0, 10); // YYYY-MM-DD
          break;
        default:
          key = logDate.toISOString().substring(0, 10); // YYYY-MM-DD
      }
      
      groupedData[key] = (groupedData[key] || 0) + 1;
    });

    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, count]) => ({ time, count }));
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    auditLogs,
    auditStats,
    isLoading,
    filters,
    fetchAuditLogs,
    exportAuditLogs,
    searchLogs,
    getActionsByTimeframe,
    updateFilters,
    refetch: () => Promise.all([fetchAuditLogs(), fetchAuditStats()])
  };
}