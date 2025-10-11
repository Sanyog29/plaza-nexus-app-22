import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { startOfDay, endOfDay, subDays, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AdvancedMetrics {
  totalRequests: number;
  completedRequests: number;
  openRequests: number;
  completionRate: number;
  slaBreaches: number;
  slaComplianceRate: number;
  avgCompletionHours: number;
  avgFirstResponseMinutes: number;
  reopenedTickets: number;
  reopenedRate: number;
  efficiencyScore: number;
  avgCostPerTicket: number;
}

export interface ComparisonData {
  current: AdvancedMetrics;
  previous: AdvancedMetrics | null;
  changePercentage: number | null;
}

export type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'mtd' | 'qtd' | 'ytd' | 'custom';

export const useAdvancedAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(new Date(), 7)),
    to: endOfDay(new Date())
  });
  const [preset, setPreset] = useState<DatePreset>('7d');
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [metrics, setMetrics] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRangeFromPreset = useCallback((presetValue: DatePreset): DateRange => {
    const now = new Date();
    switch (presetValue) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case '7d':
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case '30d':
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case '90d':
        return { from: startOfDay(subDays(now, 90)), to: endOfDay(now) };
      case 'mtd':
        return { from: startOfMonth(now), to: endOfDay(now) };
      case 'qtd':
        return { from: startOfQuarter(now), to: endOfDay(now) };
      case 'ytd':
        return { from: startOfYear(now), to: endOfDay(now) };
      default:
        return dateRange;
    }
  }, [dateRange]);

  const updatePreset = useCallback((newPreset: DatePreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      setDateRange(getDateRangeFromPreset(newPreset));
    }
  }, [getDateRangeFromPreset]);

  const updateCustomRange = useCallback((range: DateRange) => {
    setDateRange(range);
    setPreset('custom');
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];

      const { data, error: rpcError } = await supabase.rpc('generate_comprehensive_analytics', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_comparison_enabled: comparisonEnabled
      });

      if (rpcError) throw rpcError;

      if (data && data.length > 0) {
        const result = data[0];
        const currentMetrics = transformMetrics(result.current_period);
        const previousMetrics = result.previous_period ? transformMetrics(result.previous_period) : null;

        setMetrics({
          current: currentMetrics,
          previous: previousMetrics,
          changePercentage: result.change_percentage
        });
      }
    } catch (err: any) {
      console.error('Error fetching advanced analytics:', err);
      setError(err.message);
      toast({
        title: "Error loading analytics",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, comparisonEnabled]);

  const transformMetrics = (data: any): AdvancedMetrics => ({
    totalRequests: data.total_requests || 0,
    completedRequests: data.completed_requests || 0,
    openRequests: data.open_requests || 0,
    completionRate: data.completion_rate || 0,
    slaBreaches: data.sla_breaches || 0,
    slaComplianceRate: data.sla_compliance_rate || 0,
    avgCompletionHours: data.avg_completion_hours || 0,
    avgFirstResponseMinutes: data.avg_first_response_minutes || 0,
    reopenedTickets: data.reopened_tickets || 0,
    reopenedRate: data.reopened_rate || 0,
    efficiencyScore: data.efficiency_score || 0,
    avgCostPerTicket: data.avg_cost_per_ticket || 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    metrics,
    isLoading,
    error,
    dateRange,
    preset,
    comparisonEnabled,
    updatePreset,
    updateCustomRange,
    toggleComparison: () => setComparisonEnabled(prev => !prev),
    refetch: fetchAnalytics
  };
};