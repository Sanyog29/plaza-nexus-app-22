import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';
import { useAuditLogs } from './useAuditLogs';

interface AnalyticsSummary {
  id: string;
  summary_date: string;
  summary_type: string;
  metric_category: string;
  metric_data: any;
  calculated_at: string;
}

interface DashboardMetrics {
  maintenance: {
    total_requests: number;
    completed_requests: number;
    avg_completion_hours: number;
    sla_breaches: number;
    priority_breakdown: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  utilities: {
    total_consumption: number;
    total_cost: number;
    readings_count: number;
    by_utility_type: Record<string, {
      consumption: number;
      cost: number;
      readings: number;
    }>;
  };
  staff_performance: {
    active_staff: number;
    total_attendance_hours: number;
    completed_checklists: number;
    completed_tasks: number;
  };
}

export function useAnalyticsDashboard() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<AnalyticsSummary[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });

  useEffect(() => {
    if (user) {
      fetchAnalyticsSummaries();
      generateCurrentMetrics();
    }
  }, [user, dateRange]);

  const fetchAnalyticsSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_summaries')
        .select('*')
        .gte('summary_date', dateRange.from.toISOString().split('T')[0])
        .lte('summary_date', dateRange.to.toISOString().split('T')[0])
        .order('summary_date', { ascending: false });

      if (error) {
        console.error('Error fetching analytics summaries:', error);
        throw error;
      }
      setSummaries(data || []);
    } catch (error) {
      console.error('Error fetching analytics summaries:', error);
      toast.error('Failed to load analytics data');
    }
  };

  const generateCurrentMetrics = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Generate today's analytics summary
      await supabase.rpc('generate_analytics_summary', {
        summary_date: today,
        summary_type: 'daily'
      });

      // Fetch the generated summary
      const { data, error } = await supabase
        .from('analytics_summaries')
        .select('*')
        .eq('summary_date', today)
        .eq('summary_type', 'daily');

      if (error) {
        console.error('Error fetching generated analytics:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const metrics: DashboardMetrics = {
          maintenance: data.find(s => s.metric_category === 'maintenance')?.metric_data as any || {},
          utilities: data.find(s => s.metric_category === 'utilities')?.metric_data as any || {},
          staff_performance: data.find(s => s.metric_category === 'staff_performance')?.metric_data as any || {}
        };
        setCurrentMetrics(metrics);
      }
    } catch (error) {
      console.error('Error generating current metrics:', error);
      toast.error('Failed to generate analytics metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = async (date: Date, type: 'daily' | 'weekly' | 'monthly') => {
    setIsLoading(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      await supabase.rpc('generate_analytics_summary', {
        summary_date: dateString,
        summary_type: type
      });

      await fetchAnalyticsSummaries();
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} analytics summary generated`);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate analytics summary');
    } finally {
      setIsLoading(false);
    }
  };

  const getMaintenanceKPIs = () => {
    if (!currentMetrics?.maintenance) return null;

    const { maintenance } = currentMetrics;
    const completionRate = maintenance.total_requests > 0 
      ? (maintenance.completed_requests / maintenance.total_requests) * 100 
      : 0;
    
    const slaCompliance = maintenance.total_requests > 0
      ? ((maintenance.total_requests - maintenance.sla_breaches) / maintenance.total_requests) * 100
      : 100;

    return {
      totalRequests: maintenance.total_requests,
      completionRate: Math.round(completionRate),
      avgCompletionTime: Math.round(maintenance.avg_completion_hours * 10) / 10,
      slaCompliance: Math.round(slaCompliance),
      priorityBreakdown: maintenance.priority_breakdown
    };
  };

  const getUtilityKPIs = () => {
    if (!currentMetrics?.utilities) return null;

    const { utilities } = currentMetrics;
    return {
      totalCost: Math.round(utilities.total_cost * 100) / 100,
      totalConsumption: Math.round(utilities.total_consumption * 100) / 100,
      readingsCount: utilities.readings_count,
      byType: utilities.by_utility_type || {}
    };
  };

  const getStaffKPIs = () => {
    if (!currentMetrics?.staff_performance) return null;

    const { staff_performance } = currentMetrics;
    const avgHoursPerStaff = staff_performance.active_staff > 0
      ? staff_performance.total_attendance_hours / staff_performance.active_staff
      : 0;

    return {
      activeStaff: staff_performance.active_staff,
      totalHours: Math.round(staff_performance.total_attendance_hours * 10) / 10,
      avgHoursPerStaff: Math.round(avgHoursPerStaff * 10) / 10,
      completedChecklists: staff_performance.completed_checklists,
      completedTasks: staff_performance.completed_tasks
    };
  };

  const getTrendData = (category: string, metric: string, days: number = 7) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const relevantSummaries = summaries
      .filter(s => 
        s.metric_category === category &&
        s.summary_type === 'daily' &&
        new Date(s.summary_date) >= startDate &&
        new Date(s.summary_date) <= endDate
      )
      .sort((a, b) => new Date(a.summary_date).getTime() - new Date(b.summary_date).getTime());

    return relevantSummaries.map(summary => ({
      date: summary.summary_date,
      value: summary.metric_data[metric] || 0
    }));
  };

  const updateDateRange = (from: Date, to: Date) => {
    setDateRange({ from, to });
  };

  return {
    summaries,
    currentMetrics,
    isLoading,
    dateRange,
    generateSummary,
    getMaintenanceKPIs,
    getUtilityKPIs,
    getStaffKPIs,
    getTrendData,
    updateDateRange,
    refetch: () => Promise.all([fetchAnalyticsSummaries(), generateCurrentMetrics()])
  };
}