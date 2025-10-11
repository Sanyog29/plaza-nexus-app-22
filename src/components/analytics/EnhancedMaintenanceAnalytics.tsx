import React, { useEffect, useState } from 'react';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { AnalyticsDateFilter } from './AnalyticsDateFilter';
import { KPICard } from './KPICard';
import { TicketVolumeChart } from './charts/TicketVolumeChart';
import { SLAComplianceChart } from './charts/SLAComplianceChart';
import { EfficiencyGauge } from './charts/EfficiencyGauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval } from 'date-fns';

export const EnhancedMaintenanceAnalytics: React.FC = () => {
  const {
    metrics,
    isLoading,
    dateRange,
    preset,
    comparisonEnabled,
    updatePreset,
    updateCustomRange,
    toggleComparison,
    refetch
  } = useAdvancedAnalytics();

  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [slaData, setSlaData] = useState<any[]>([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Fetch daily volume data
        const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        const volumePromises = days.map(async (day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          
          const { data: requests } = await supabase
            .from('maintenance_requests')
            .select('id, status, created_at')
            .gte('created_at', `${dayStr}T00:00:00`)
            .lt('created_at', `${dayStr}T23:59:59`);

          return {
            date: format(day, 'MMM dd'),
            created: requests?.length || 0,
            resolved: requests?.filter(r => r.status === 'completed').length || 0,
            open: requests?.filter(r => r.status !== 'completed').length || 0
          };
        });

        const volumeResults = await Promise.all(volumePromises);
        setVolumeData(volumeResults);

        // Fetch SLA data by priority
        const { data: allRequests } = await supabase
          .from('maintenance_requests')
          .select('priority, sla_breach_at, completed_at, status')
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());

        const priorities = ['urgent', 'high', 'medium', 'low'];
        const slaByPriority = priorities.map(priority => {
          const priorityRequests = allRequests?.filter(r => r.priority === priority) || [];
          const onTime = priorityRequests.filter(r => 
            r.status === 'completed' && r.completed_at && r.sla_breach_at && 
            new Date(r.completed_at) < new Date(r.sla_breach_at)
          ).length;
          const breached = priorityRequests.filter(r => 
            (r.status === 'completed' && r.completed_at && r.sla_breach_at && 
             new Date(r.completed_at) >= new Date(r.sla_breach_at)) ||
            (r.status !== 'completed' && r.sla_breach_at && 
             new Date() >= new Date(r.sla_breach_at))
          ).length;

          return {
            priority: priority.charAt(0).toUpperCase() + priority.slice(1),
            onTime,
            breached
          };
        });

        setSlaData(slaByPriority);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    if (!isLoading && dateRange) {
      fetchChartData();
    }
  }, [dateRange, isLoading]);

  const current = metrics?.current;
  const previous = metrics?.previous;

  const calculateTrend = (currentVal: number, previousVal?: number) => {
    if (!previousVal || !comparisonEnabled) return undefined;
    const change = ((currentVal - previousVal) / previousVal) * 100;
    return {
      value: change,
      isPositive: change >= 0,
      label: 'vs previous period'
    };
  };

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <AnalyticsDateFilter
        dateRange={dateRange}
        preset={preset}
        comparisonEnabled={comparisonEnabled}
        onPresetChange={updatePreset}
        onCustomRangeChange={updateCustomRange}
        onComparisonToggle={toggleComparison}
        onRefresh={refetch}
        isLoading={isLoading}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Tickets"
          value={current?.totalRequests || 0}
          icon={ClipboardList}
          trend={calculateTrend(current?.totalRequests || 0, previous?.totalRequests)}
          loading={isLoading}
        />
        <KPICard
          title="Completed Tickets"
          value={current?.completedRequests || 0}
          subtitle={`${current?.completionRate.toFixed(1)}% completion rate`}
          icon={CheckCircle2}
          color="success"
          trend={calculateTrend(current?.completedRequests || 0, previous?.completedRequests)}
          loading={isLoading}
        />
        <KPICard
          title="SLA Compliance"
          value={`${current?.slaComplianceRate.toFixed(1)}%`}
          subtitle={`${current?.slaBreaches || 0} breaches`}
          icon={AlertCircle}
          color={current && current.slaComplianceRate >= 95 ? 'success' : current && current.slaComplianceRate >= 80 ? 'warning' : 'error'}
          trend={calculateTrend(current?.slaComplianceRate || 0, previous?.slaComplianceRate)}
          loading={isLoading}
        />
        <KPICard
          title="Avg Resolution Time"
          value={`${current?.avgCompletionHours.toFixed(1)}h`}
          subtitle="Hours to complete"
          icon={Clock}
          trend={calculateTrend(current?.avgCompletionHours || 0, previous?.avgCompletionHours)}
          loading={isLoading}
        />
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="First Response Time"
          value={`${current?.avgFirstResponseMinutes.toFixed(0)}m`}
          subtitle="Average response time"
          icon={TrendingUp}
          loading={isLoading}
        />
        <KPICard
          title="Open Tickets"
          value={current?.openRequests || 0}
          subtitle="Currently active"
          icon={AlertCircle}
          color={current && current.openRequests > 20 ? 'warning' : 'default'}
          loading={isLoading}
        />
        <KPICard
          title="Reopened Tickets"
          value={current?.reopenedTickets || 0}
          subtitle={`${current?.reopenedRate.toFixed(1)}% of completed`}
          icon={RotateCcw}
          color={current && current.reopenedRate > 10 ? 'warning' : 'default'}
          trend={calculateTrend(current?.reopenedTickets || 0, previous?.reopenedTickets)}
          loading={isLoading}
        />
        <KPICard
          title="Efficiency Score"
          value={`${current?.efficiencyScore.toFixed(0)}/100`}
          subtitle="Overall performance"
          icon={TrendingUp}
          color={current && current.efficiencyScore >= 80 ? 'success' : current && current.efficiencyScore >= 60 ? 'warning' : 'error'}
          trend={calculateTrend(current?.efficiencyScore || 0, previous?.efficiencyScore)}
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TicketVolumeChart data={volumeData} loading={isLoading} />
        <SLAComplianceChart data={slaData} loading={isLoading} />
      </div>

      {/* Efficiency Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EfficiencyGauge score={current?.efficiencyScore || 0} loading={isLoading} />
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Completion Rate</p>
                <p className="text-xs text-muted-foreground">
                  {current?.completionRate.toFixed(1)}% of tickets are being completed successfully
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Response Time</p>
                <p className="text-xs text-muted-foreground">
                  Average first response in {current?.avgFirstResponseMinutes.toFixed(0)} minutes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className={`h-5 w-5 mt-0.5 ${current && current.reopenedRate > 10 ? 'text-warning' : 'text-success'}`} />
              <div>
                <p className="font-semibold text-sm">Quality Indicator</p>
                <p className="text-xs text-muted-foreground">
                  {current?.reopenedRate.toFixed(1)}% of tickets are being reopened
                  {current && current.reopenedRate > 10 && ' - Consider quality improvements'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};