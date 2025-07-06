import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface ExecutiveMetrics {
  overview: {
    totalRequests: number;
    completionRate: number;
    avgResolutionTime: number;
    slaCompliance: number;
    costSavings: number;
  };
  visitors: {
    totalVisitors: number;
    dailyAverage: number;
    vipVisitors: number;
    overdueCheckouts: number;
    securityIncidents: number;
  };
  maintenance: {
    activeRequests: number;
    completedThisMonth: number;
    urgentRequests: number;
    equipmentUptime: number;
    maintenanceCosts: number;
  };
  staff: {
    totalStaff: number;
    activeStaff: number;
    avgWorkloadHours: number;
    completedTasks: number;
    attendanceRate: number;
  };
  trends: {
    requestTrend: Array<{ date: string; count: number; completed: number }>;
    visitorTrend: Array<{ date: string; count: number; vip: number }>;
    costTrend: Array<{ month: string; maintenance: number; utilities: number }>;
    performanceTrend: Array<{ date: string; slaCompliance: number; satisfaction: number }>;
  };
}

interface AlertSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  recentAlerts: Array<{
    id: string;
    title: string;
    severity: string;
    created_at: string;
    status: string;
  }>;
}

export const useExecutiveDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const calculateExecutiveMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Overview Metrics
      const { data: requestsData } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const totalRequests = requestsData?.length || 0;
      const completedRequests = requestsData?.filter(r => r.status === 'completed').length || 0;
      const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

      // Calculate average resolution time
      const completedWithTimes = requestsData?.filter(r => r.status === 'completed' && r.completed_at) || [];
      const avgResolutionTime = completedWithTimes.length > 0
        ? completedWithTimes.reduce((acc, req) => {
            const created = new Date(req.created_at);
            const completed = new Date(req.completed_at);
            return acc + (completed.getTime() - created.getTime());
          }, 0) / completedWithTimes.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // SLA Compliance
      const slaBreaches = requestsData?.filter(r => 
        r.sla_breach_at && (
          (r.status === 'completed' && r.completed_at > r.sla_breach_at) ||
          (r.status !== 'completed' && now > new Date(r.sla_breach_at))
        )
      ).length || 0;
      const slaCompliance = totalRequests > 0 ? ((totalRequests - slaBreaches) / totalRequests) * 100 : 100;

      // Visitors Metrics
      const { data: visitorsData } = await supabase
        .from('visitors')
        .select('*')
        .gte('visit_date', thirtyDaysAgo.toISOString().split('T')[0]);

      const totalVisitors = visitorsData?.length || 0;
      const dailyAverage = totalVisitors / 30;
      const vipVisitors = visitorsData?.filter(v => v.category_id && v.category_id.includes('vip')).length || 0;
      
      const { data: overdueVisitors } = await supabase
        .from('visitors')
        .select('*')
        .eq('status', 'checked_in')
        .lt('visit_date', now.toISOString().split('T')[0]);
      
      const overdueCheckouts = overdueVisitors?.length || 0;

      // Security Incidents
      const { data: securityLogs } = await supabase
        .from('visitor_check_logs')
        .select('*')
        .in('action_type', ['security_incident', 'emergency_alert'])
        .gte('timestamp', thirtyDaysAgo.toISOString());

      const securityIncidents = securityLogs?.length || 0;

      // Maintenance Metrics
      const activeRequests = requestsData?.filter(r => ['pending', 'in_progress'].includes(r.status)).length || 0;
      const completedThisMonth = requestsData?.filter(r => 
        r.status === 'completed' && new Date(r.completed_at) >= startOfMonth
      ).length || 0;
      const urgentRequests = requestsData?.filter(r => r.priority === 'urgent' && r.status !== 'completed').length || 0;

      // Equipment Uptime (mock calculation - would need more detailed tracking)
      const equipmentUptime = 95.5; // Placeholder

      // Staff Metrics
      const { data: staffData } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['staff', 'admin', 'ops_l1', 'ops_l2']);

      const totalStaff = staffData?.length || 0;

      const { data: attendanceData } = await supabase
        .from('staff_attendance')
        .select('*')
        .gte('check_in_time', startOfMonth.toISOString());

      const activeStaff = new Set(attendanceData?.map(a => a.staff_id)).size || 0;
      
      const { data: tasksData } = await supabase
        .from('task_assignments')
        .select('*')
        .gte('created_at', startOfMonth.toISOString());

      const completedTasks = tasksData?.filter(t => t.actual_completion).length || 0;

      // Generate trend data (last 30 days)
      const generateTrendData = () => {
        const trends = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayRequests = requestsData?.filter(r => r.created_at.startsWith(dateStr)).length || 0;
          const dayCompleted = requestsData?.filter(r => 
            r.status === 'completed' && r.completed_at?.startsWith(dateStr)
          ).length || 0;
          
          const dayVisitors = visitorsData?.filter(v => v.visit_date === dateStr).length || 0;
          const dayVip = visitorsData?.filter(v => 
            v.visit_date === dateStr && v.category_id?.includes('vip')
          ).length || 0;

          trends.push({
            date: dateStr,
            requests: dayRequests,
            completed: dayCompleted,
            visitors: dayVisitors,
            vip: dayVip
          });
        }
        return trends;
      };

      const trendData = generateTrendData();

      const executiveMetrics: ExecutiveMetrics = {
        overview: {
          totalRequests,
          completionRate: Math.round(completionRate),
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
          slaCompliance: Math.round(slaCompliance),
          costSavings: 125000 // Placeholder calculation
        },
        visitors: {
          totalVisitors,
          dailyAverage: Math.round(dailyAverage),
          vipVisitors,
          overdueCheckouts,
          securityIncidents
        },
        maintenance: {
          activeRequests,
          completedThisMonth,
          urgentRequests,
          equipmentUptime,
          maintenanceCosts: 85000 // Placeholder
        },
        staff: {
          totalStaff,
          activeStaff,
          avgWorkloadHours: 6.5, // Placeholder
          completedTasks,
          attendanceRate: 94 // Placeholder
        },
        trends: {
          requestTrend: trendData.map(d => ({ 
            date: d.date, 
            count: d.requests, 
            completed: d.completed 
          })),
          visitorTrend: trendData.map(d => ({ 
            date: d.date, 
            count: d.visitors, 
            vip: d.vip 
          })),
          costTrend: [
            { month: 'Jan', maintenance: 75000, utilities: 45000 },
            { month: 'Feb', maintenance: 82000, utilities: 48000 },
            { month: 'Mar', maintenance: 78000, utilities: 52000 },
            { month: 'Apr', maintenance: 85000, utilities: 49000 },
          ],
          performanceTrend: trendData.slice(-7).map(d => ({
            date: d.date,
            slaCompliance: Math.random() * 20 + 80, // Placeholder
            satisfaction: Math.random() * 15 + 85 // Placeholder
          }))
        }
      };

      setMetrics(executiveMetrics);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error calculating executive metrics:', error);
      setError('Failed to load executive dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateAlertSummary = useCallback(async () => {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get active alerts
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`);

      // Get recent incident logs as alerts
      const { data: incidentLogs } = await supabase
        .from('visitor_check_logs')
        .select('*')
        .in('action_type', ['security_incident', 'emergency_alert', 'incident_report'])
        .gte('timestamp', sevenDaysAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(10);

      const severityCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      // Count alert severities
      alertsData?.forEach(alert => {
        const severity = alert.severity?.toLowerCase() || 'low';
        if (severity in severityCounts) {
          severityCounts[severity as keyof typeof severityCounts]++;
        }
      });

      // Add incident logs to severity counts
      incidentLogs?.forEach(log => {
        const severity = (log.metadata && typeof log.metadata === 'object' && (log.metadata as any)?.priority) || 'low';
        if (severity in severityCounts) {
          severityCounts[severity as keyof typeof severityCounts]++;
        }
      });

      const recentAlerts = [
        ...(alertsData?.map(alert => ({
          id: alert.id,
          title: alert.title,
          severity: alert.severity,
          created_at: alert.created_at,
          status: 'active'
        })) || []),
        ...(incidentLogs?.map(log => ({
          id: log.id,
          title: `${log.action_type.replace('_', ' ').toUpperCase()}`,
          severity: (log.metadata && typeof log.metadata === 'object' && (log.metadata as any)?.priority) || 'medium',
          created_at: log.timestamp,
          status: 'resolved'
        })) || [])
      ].slice(0, 10);

      setAlerts({
        ...severityCounts,
        recentAlerts
      });

    } catch (error) {
      console.error('Error calculating alert summary:', error);
    }
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    calculateExecutiveMetrics();
    calculateAlertSummary();

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      calculateExecutiveMetrics();
      calculateAlertSummary();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, calculateExecutiveMetrics, calculateAlertSummary]);

  const refreshDashboard = useCallback(() => {
    calculateExecutiveMetrics();
    calculateAlertSummary();
  }, [calculateExecutiveMetrics, calculateAlertSummary]);

  return {
    metrics,
    alerts,
    loading,
    error,
    lastUpdated,
    refreshDashboard
  };
};