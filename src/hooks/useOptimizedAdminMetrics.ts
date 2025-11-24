import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { handleSupabaseError, retryWithBackoff } from '@/utils/errorHandler';
import { ACTIVE_REQUEST_STATUSES } from '@/constants/requests';

interface OptimizedMetrics {
  // Core metrics
  activeRequests: number;
  pendingRequests: number;
  completedToday: number;
  urgentRequests: number;
  slaBreaches: number;
  
  // Performance metrics
  avgResponseTime: number;
  systemUptime: number;
  staffUtilization: number;
  
  // System health
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
  
  // Database metrics
  slowQueries: number;
  optimizationScore: number;
  
  // Backup metrics
  lastBackup: string | null;
  backupHealth: 'good' | 'warning' | 'critical';
  
  // Alerts
  criticalAlerts: number;
  totalAlerts: number;
}

interface OptimizedAdminData {
  metrics: OptimizedMetrics;
  isLoading: boolean;
  error: string | null;
  isRealTimeActive: boolean;
  lastFetch: string | null;
}

export const useOptimizedAdminMetrics = (propertyId?: string | null) => {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<OptimizedAdminData>({
    metrics: {
      activeRequests: 0,
      pendingRequests: 0,
      completedToday: 0,
      urgentRequests: 0,
      slaBreaches: 0,
      avgResponseTime: 0,
      systemUptime: 0,
      staffUtilization: 0,
      systemHealth: 'healthy',
      lastUpdated: new Date().toISOString(),
      slowQueries: 0,
      optimizationScore: 0,
      lastBackup: null,
      backupHealth: 'good',
      criticalAlerts: 0,
      totalAlerts: 0
    },
    isLoading: true,
    error: null,
    isRealTimeActive: false,
    lastFetch: null
  });

  const channelRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Optimized data fetching with single query
  const fetchMetrics = useCallback(async () => {
    if (!user || !isAdmin) return;

    console.log('[useOptimizedAdminMetrics] Fetching metrics for propertyId:', propertyId);

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Single optimized query for maintenance requests - exclude soft-deleted
      let requestsQuery = supabase
        .from('maintenance_requests')
        .select('id, status, priority, created_at, completed_at, sla_breach_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply property filter if specified
      if (propertyId) {
        // Filter by specific property only
        requestsQuery = requestsQuery.eq('property_id', propertyId);
      }
      // When propertyId is null, no filter is applied (shows all properties)

      const { data: requests, error: requestsError } = await requestsQuery;

      if (requestsError) throw requestsError;

      console.log('[useOptimizedAdminMetrics] Fetched requests:', requests?.length, 'for property:', propertyId);

      // Fetch alerts (alerts are global, not property-specific)
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('id, severity, is_active')
        .eq('is_active', true);

      if (alertsError) throw alertsError;

      // Calculate all metrics using canonical definitions
      const activeRequests = requests?.filter(r => 
        ACTIVE_REQUEST_STATUSES.includes(r.status as any)
      ) || [];
      
      console.log('[useOptimizedAdminMetrics] Active requests:', activeRequests.length);
      
      const completedTotal = requests?.filter(r => r.status === 'completed') || [];
      
      const completedToday = completedTotal.filter(r => 
        r.completed_at?.startsWith(today)
      ) || [];

      const urgentRequests = activeRequests.filter(r => r.priority === 'urgent');
      
      const slaBreaches = activeRequests.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < now
      );

      // Calculate average response time
      const avgResponseTime = completedToday.length > 0
        ? completedToday.reduce((acc, req) => {
            const created = new Date(req.created_at);
            const completed = new Date(req.completed_at!);
            return acc + (completed.getTime() - created.getTime());
          }, 0) / (completedToday.length * 60000) // Convert to minutes
        : 0;

      // Calculate system health
      const criticalCount = slaBreaches.length + urgentRequests.length;
      const systemHealth: OptimizedMetrics['systemHealth'] = 
        criticalCount > 5 ? 'critical' : 
        criticalCount > 2 ? 'warning' : 'healthy';

      const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;

      const newMetrics: OptimizedMetrics = {
        activeRequests: activeRequests.length,
        pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
        completedToday: completedTotal.length, // Changed to total completed (not just today)
        urgentRequests: urgentRequests.length,
        slaBreaches: slaBreaches.length,
        avgResponseTime: Math.round(avgResponseTime),
        systemUptime: 0,
        staffUtilization: 0,
        systemHealth,
        lastUpdated: now.toISOString(),
        slowQueries: 0,
        optimizationScore: 0,
        lastBackup: null,
        backupHealth: 'good',
        criticalAlerts,
        totalAlerts: alerts?.length || 0
      };

      setData(prev => ({
        ...prev,
        metrics: newMetrics,
        isLoading: false,
        lastFetch: now.toISOString()
      }));

    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      setData(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      toast({
        title: "Error loading admin metrics",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user, isAdmin, propertyId]);

  // Smart real-time updates - only when tab is visible
  const setupRealTimeUpdates = useCallback(() => {
    if (!user || !isAdmin || !isVisibleRef.current) return;

    // Clear existing subscriptions
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Setup real-time subscription for critical changes only
    channelRef.current = supabase
      .channel('optimized-admin-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'maintenance_requests',
        filter: 'priority=eq.urgent'
      }, () => {
        // Only refetch for urgent requests
        retryWithBackoff(fetchMetrics, 2, 1000);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts'
      }, () => {
        // Refetch for new alerts
        retryWithBackoff(fetchMetrics, 2, 1000);
      })
      .subscribe();

    setData(prev => ({ ...prev, isRealTimeActive: true }));

    // Smart polling - reduced frequency
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        fetchMetrics();
      }
    }, 5 * 60 * 1000); // 5 minutes instead of 30 seconds

  }, [user, isAdmin, fetchMetrics]);

  // Handle page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (isVisibleRef.current) {
        // Page became visible - refresh data
        fetchMetrics();
        setupRealTimeUpdates();
      } else {
        // Page hidden - clean up resources
        setData(prev => ({ ...prev, isRealTimeActive: false }));
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchMetrics, setupRealTimeUpdates]);

  // Initialize
  useEffect(() => {
    if (!user || !isAdmin) return;

    fetchMetrics();
    setupRealTimeUpdates();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, isAdmin, propertyId, fetchMetrics, setupRealTimeUpdates]);

  // Manual refresh function
  const refreshMetrics = useCallback(async () => {
    await retryWithBackoff(fetchMetrics, 3, 1000);
  }, [fetchMetrics]);

  // Health check function
  const getHealthSummary = useCallback(() => {
    const { metrics } = data;
    
    return {
      overall: metrics.systemHealth,
      issues: [
        ...(metrics.urgentRequests > 0 ? [`${metrics.urgentRequests} urgent requests`] : []),
        ...(metrics.slaBreaches > 0 ? [`${metrics.slaBreaches} SLA breaches`] : []),
        ...(metrics.criticalAlerts > 0 ? [`${metrics.criticalAlerts} critical alerts`] : []),
        ...(metrics.optimizationScore < 80 ? ['Database optimization needed'] : []),
        ...(metrics.backupHealth !== 'good' ? ['Backup issues detected'] : [])
      ],
      lastCheck: metrics.lastUpdated
    };
  }, [data.metrics]);

  return {
    ...data,
    refreshMetrics,
    getHealthSummary,
    // Legacy compatibility
    dashboardStats: {
      totalRequests: data.metrics.activeRequests + data.metrics.completedToday,
      pendingRequests: data.metrics.pendingRequests,
      completedRequests: data.metrics.completedToday,
      activeAlerts: data.metrics.totalAlerts,
      slaCompliance: Math.max(0, 100 - (data.metrics.slaBreaches * 10))
    }
  };
};