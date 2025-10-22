import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface PerformanceMetric {
  id: string;
  timestamp: string;
  metricType: 'response_time' | 'database_query' | 'memory_usage' | 'cpu_usage' | 'error_rate';
  value: number;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
  source: string;
  metadata?: Record<string, any>;
}

interface SystemAlert {
  id: string;
  alertType: 'performance' | 'error' | 'security' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  responseTime: { warning: number; critical: number };
  databaseQuery: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
  cpuUsage: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
}

export const usePerformanceMonitoring = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default performance thresholds
  const defaultThresholds: PerformanceThresholds = {
    responseTime: { warning: 2000, critical: 5000 }, // milliseconds
    databaseQuery: { warning: 1000, critical: 3000 }, // milliseconds
    memoryUsage: { warning: 80, critical: 95 }, // percentage
    cpuUsage: { warning: 70, critical: 90 }, // percentage
    errorRate: { warning: 5, critical: 10 } // percentage
  };

  // Track API response times
  const trackResponseTime = useCallback(async (endpoint: string, responseTime: number) => {
    const threshold = defaultThresholds.responseTime;
    const status = responseTime > threshold.critical ? 'critical' : 
                  responseTime > threshold.warning ? 'warning' : 'normal';

    const metric: PerformanceMetric = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      metricType: 'response_time',
      value: responseTime,
      threshold: threshold.warning,
      status,
      source: endpoint,
      metadata: { endpoint }
    };

    setMetrics(prev => [metric, ...prev.slice(0, 99)]); // Keep last 100 metrics

    // Create alert if threshold exceeded
    if (status !== 'normal') {
      await createPerformanceAlert('performance', status as 'warning' | 'critical', 
        `High response time detected for ${endpoint}: ${responseTime}ms`, { metric });
    }
  }, []);

  // Track database query performance
  const trackDatabaseQuery = useCallback(async (query: string, executionTime: number) => {
    const threshold = defaultThresholds.databaseQuery;
    const status = executionTime > threshold.critical ? 'critical' : 
                  executionTime > threshold.warning ? 'warning' : 'normal';

    const metric: PerformanceMetric = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      metricType: 'database_query',
      value: executionTime,
      threshold: threshold.warning,
      status,
      source: 'database',
      metadata: { query: query.substring(0, 100) + '...' }
    };

    setMetrics(prev => [metric, ...prev.slice(0, 99)]);

    if (status !== 'normal') {
      await createPerformanceAlert('performance', status as 'warning' | 'critical', 
        `Slow database query detected: ${executionTime}ms`, { metric });
    }
  }, []);

  // Track system resources (simulated)
  const trackSystemResources = useCallback(async () => {
    // In a real implementation, these would come from actual system monitoring
    const memoryUsage = Math.random() * 100;
    const cpuUsage = Math.random() * 100;

    const memoryStatus = memoryUsage > defaultThresholds.memoryUsage.critical ? 'critical' :
                        memoryUsage > defaultThresholds.memoryUsage.warning ? 'warning' : 'normal';
    
    const cpuStatus = cpuUsage > defaultThresholds.cpuUsage.critical ? 'critical' :
                     cpuUsage > defaultThresholds.cpuUsage.warning ? 'warning' : 'normal';

    const memoryMetric: PerformanceMetric = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      metricType: 'memory_usage',
      value: memoryUsage,
      threshold: defaultThresholds.memoryUsage.warning,
      status: memoryStatus,
      source: 'system'
    };

    const cpuMetric: PerformanceMetric = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      metricType: 'cpu_usage',
      value: cpuUsage,
      threshold: defaultThresholds.cpuUsage.warning,
      status: cpuStatus,
      source: 'system'
    };

    setMetrics(prev => [memoryMetric, cpuMetric, ...prev.slice(0, 98)]);

    if (memoryStatus !== 'normal') {
      await createPerformanceAlert('resource', memoryStatus as 'warning' | 'critical',
        `High memory usage detected: ${memoryUsage.toFixed(1)}%`, { metric: memoryMetric });
    }

    if (cpuStatus !== 'normal') {
      await createPerformanceAlert('resource', cpuStatus as 'warning' | 'critical',
        `High CPU usage detected: ${cpuUsage.toFixed(1)}%`, { metric: cpuMetric });
    }
  }, []);

  // Create performance alert
  const createPerformanceAlert = useCallback(async (
    type: SystemAlert['alertType'],
    severity: 'warning' | 'critical',
    message: string,
    metadata?: Record<string, any>
  ) => {
    const alert: SystemAlert = {
      id: crypto.randomUUID(),
      alertType: type,
      severity: severity === 'critical' ? 'critical' : 'medium',
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata
    };

    setAlerts(prev => [alert, ...prev]);

    // Show toast for critical alerts
    if (severity === 'critical') {
      toast.error(`Critical Alert: ${message}`);
    }

    // Store alert in database if user is admin
    if (user && await isUserAdmin()) {
      try {
        await supabase.from('alerts').insert({
          title: `Performance Alert - ${type}`,
          message,
          severity: severity === 'critical' ? 'critical' : 'warning'
        });
      } catch (error) {
        console.error('Failed to store alert:', error);
      }
    }
  }, [user]);

  // Check if user is admin
  const isUserAdmin = useCallback(async () => {
    if (!user) return false;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('assigned_role_title')
        .eq('id', user.id)
        .maybeSingle();
      
      return data?.assigned_role_title?.toLowerCase().includes('admin') || false;
    } catch {
      return false;
    }
  }, [user]);

  // Resolve alert
  const resolveAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy: user?.id }
        : alert
    ));

    toast.success('Alert resolved successfully');
  }, [user]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentMetrics = metrics.filter(m => new Date(m.timestamp) > oneHourAgo);
    
    const summary = {
      totalMetrics: recentMetrics.length,
      criticalIssues: recentMetrics.filter(m => m.status === 'critical').length,
      warnings: recentMetrics.filter(m => m.status === 'warning').length,
      averageResponseTime: recentMetrics
        .filter(m => m.metricType === 'response_time')
        .reduce((avg, m, _, arr) => avg + m.value / arr.length, 0),
      slowestQueries: recentMetrics
        .filter(m => m.metricType === 'database_query')
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      systemHealth: {
        overall: recentMetrics.filter(m => m.status === 'critical').length === 0 ? 
          (recentMetrics.filter(m => m.status === 'warning').length === 0 ? 'healthy' : 'warning') : 'critical',
        uptime: '99.9%', // This would be calculated from actual uptime data
        lastIncident: alerts.filter(a => !a.resolved)[0]?.timestamp || null
      }
    };

    return summary;
  }, [metrics, alerts]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Monitor system resources every 30 seconds
    const resourceInterval = setInterval(trackSystemResources, 30000);
    
    // Store interval for cleanup
    return () => {
      clearInterval(resourceInterval);
      setIsMonitoring(false);
    };
  }, [trackSystemResources]);

  // Enhanced Supabase client with performance tracking
  const createMonitoredSupabaseClient = useCallback(() => {
    const originalFrom = supabase.from.bind(supabase);
    
    return {
      ...supabase,
      from: (table: string) => {
        const query = originalFrom(table);
        const originalSelect = query.select.bind(query);
        const originalInsert = query.insert.bind(query);
        const originalUpdate = query.update.bind(query);
        const originalDelete = query.delete.bind(query);
        
        return {
          ...query,
          select: (...args: any[]) => {
            const startTime = Date.now();
            const result = originalSelect(...args);
            
            // Track execution time
            result.then?.(() => {
              const executionTime = Date.now() - startTime;
              trackDatabaseQuery(`SELECT from ${table}`, executionTime);
            });
            
            return result;
          },
          insert: (...args: any[]) => {
            const startTime = Date.now();
            const result = originalInsert(...args);
            
            result.then?.(() => {
              const executionTime = Date.now() - startTime;
              trackDatabaseQuery(`INSERT into ${table}`, executionTime);
            });
            
            return result;
          },
          update: (...args: any[]) => {
            const startTime = Date.now();
            const result = originalUpdate(...args);
            
            result.then?.(() => {
              const executionTime = Date.now() - startTime;
              trackDatabaseQuery(`UPDATE ${table}`, executionTime);
            });
            
            return result;
          },
          delete: (...args: any[]) => {
            const startTime = Date.now();
            const result = originalDelete(...args);
            
            result.then?.(() => {
              const executionTime = Date.now() - startTime;
              trackDatabaseQuery(`DELETE from ${table}`, executionTime);
            });
            
            return result;
          }
        };
      }
    };
  }, [trackDatabaseQuery]);

  useEffect(() => {
    if (!user) return;

    const cleanup = startMonitoring();
    setLoading(false);

    return cleanup;
  }, [user, startMonitoring]);

  return {
    metrics,
    alerts,
    isMonitoring,
    loading,
    error,
    trackResponseTime,
    trackDatabaseQuery,
    createPerformanceAlert,
    resolveAlert,
    getPerformanceSummary,
    createMonitoredSupabaseClient
  };
};