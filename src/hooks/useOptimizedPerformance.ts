import { useOptimizedAdminMetrics } from './useOptimizedAdminMetrics';

// Legacy compatibility hook - wraps optimized metrics
export const useOptimizedPerformance = () => {
  const { metrics, isLoading, error } = useOptimizedAdminMetrics();

  // Transform to legacy format for backward compatibility
  const legacyMetrics = [
    {
      id: 'response_time',
      metricType: 'response_time' as const,
      value: metrics.avgResponseTime,
      threshold: 30,
      status: metrics.avgResponseTime > 60 ? 'critical' as const : 
              metrics.avgResponseTime > 30 ? 'warning' as const : 'normal' as const,
      source: 'system'
    },
    {
      id: 'active_requests',
      metricType: 'active_requests' as const,
      value: metrics.activeRequests,
      threshold: 20,
      status: metrics.urgentRequests > 5 ? 'critical' as const : 
              metrics.urgentRequests > 2 ? 'warning' as const : 'normal' as const,
      source: 'maintenance'
    }
  ];

  const legacyAlerts = [
    ...(metrics.urgentRequests > 0 ? [{
      id: 'urgent_requests',
      alertType: 'performance' as const,
      severity: 'critical' as const,
      message: `${metrics.urgentRequests} urgent maintenance requests require immediate attention`,
      timestamp: new Date().toISOString(),
      resolved: false
    }] : []),
    ...(metrics.slaBreaches > 0 ? [{
      id: 'sla_breaches',
      alertType: 'performance' as const,
      severity: 'critical' as const,
      message: `${metrics.slaBreaches} SLA breaches detected`,
      timestamp: new Date().toISOString(),
      resolved: false
    }] : [])
  ];

  const performanceSummary = {
    totalMetrics: legacyMetrics.length,
    criticalIssues: legacyMetrics.filter(m => m.status === 'critical').length,
    warnings: legacyMetrics.filter(m => m.status === 'warning').length,
    averageResponseTime: metrics.avgResponseTime,
    systemHealth: {
      overall: metrics.systemHealth,
      uptime: `${metrics.systemUptime.toFixed(1)}%`,
      lastIncident: legacyAlerts[0]?.timestamp || null
    }
  };

  return {
    metrics: legacyMetrics,
    alerts: legacyAlerts,
    isMonitoring: true,
    loading: isLoading,
    error,
    getPerformanceSummary: () => performanceSummary
  };
};