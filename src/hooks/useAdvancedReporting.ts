import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KPIAggregation {
  id: string;
  kpi_name: string;
  kpi_category: string;
  current_value: number;
  target_value?: number;
  trend_direction: string;
  last_calculated: string;
  metadata: any;
}

interface AutomatedReport {
  id: string;
  report_name: string;
  report_type: string;
  schedule_config: any;
  recipients: any;
  template_config?: any;
  is_active: boolean;
  last_generated?: string;
  next_generation?: string;
}

interface ReportGeneration {
  id: string;
  report_id: string;
  report_data: any;
  file_url?: string;
  generation_status: string;
  generated_at: string;
  error_message?: string;
}

interface CrossModuleInsight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  recommendations: string[];
  metrics: Record<string, number>;
}

export function useAdvancedReporting() {
  const [kpis, setKpis] = useState<KPIAggregation[]>([]);
  const [reports, setReports] = useState<AutomatedReport[]>([]);
  const [generations, setGenerations] = useState<ReportGeneration[]>([]);
  const [insights, setInsights] = useState<CrossModuleInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch KPI aggregations
  const fetchKPIs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('kpi_aggregations')
        .select('*')
        .order('last_calculated', { ascending: false });

      if (error) throw error;
      setKpis(data || []);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  }, []);

  // Fetch automated reports
  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('automated_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, []);

  // Fetch recent report generations
  const fetchGenerations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('report_generations')
        .select(`
          *,
          automated_reports!inner(report_name, report_type)
        `)
        .order('generated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setGenerations(data || []);
    } catch (error) {
      console.error('Error fetching generations:', error);
    }
  }, []);

  // Calculate cross-module KPIs
  const calculateKPIs = useCallback(async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.rpc('calculate_cross_module_kpis');
      
      if (error) throw error;

      toast({
        title: 'KPIs Updated',
        description: 'Cross-module KPIs have been recalculated',
      });

      // Refresh KPI data
      await fetchKPIs();
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      toast({
        title: 'KPI Calculation Failed',
        description: 'Failed to recalculate KPIs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchKPIs, toast]);

  // Generate cross-module insights
  const generateInsights = useCallback(async () => {
    try {
      setLoading(true);

      // Analyze maintenance and asset correlation
      const { data: maintenanceData } = await supabase
        .from('maintenance_requests')
        .select('priority, status, category_id, created_at, completed_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Analyze staff performance and workload
      const { data: staffData } = await supabase
        .from('staff_workload_metrics')
        .select('*')
        .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Analyze order patterns and vendor performance
      const { data: orderData } = await supabase
        .from('cafeteria_orders')
        .select('status, total_amount, vendor_id, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const newInsights: CrossModuleInsight[] = [];

      // Maintenance efficiency insight
      if (maintenanceData && maintenanceData.length > 0) {
        const completedRequests = maintenanceData.filter(r => r.status === 'completed');
        const efficiency = (completedRequests.length / maintenanceData.length) * 100;
        
        newInsights.push({
          title: 'Maintenance Efficiency Analysis',
          description: `Current maintenance completion rate is ${efficiency.toFixed(1)}%`,
          impact: efficiency < 70 ? 'high' : efficiency < 85 ? 'medium' : 'low',
          category: 'operations',
          recommendations: efficiency < 70 ? [
            'Increase maintenance staff allocation',
            'Review SLA policies',
            'Implement predictive maintenance'
          ] : [
            'Maintain current efficiency levels',
            'Consider resource optimization'
          ],
          metrics: {
            efficiency: efficiency,
            total_requests: maintenanceData.length,
            completed: completedRequests.length
          }
        });
      }

      // Staff utilization insight
      if (staffData && staffData.length > 0) {
        const avgUtilization = staffData.reduce((sum, s) => sum + (s.total_work_hours || 0), 0) / staffData.length;
        
        newInsights.push({
          title: 'Staff Utilization Patterns',
          description: `Average staff utilization is ${avgUtilization.toFixed(1)} hours per week`,
          impact: avgUtilization > 45 ? 'high' : avgUtilization < 30 ? 'medium' : 'low',
          category: 'human_resources',
          recommendations: avgUtilization > 45 ? [
            'Consider hiring additional staff',
            'Implement workload balancing',
            'Review overtime policies'
          ] : [
            'Optimize task distribution',
            'Cross-train staff for flexibility'
          ],
          metrics: {
            avg_utilization: avgUtilization,
            staff_count: staffData.length
          }
        });
      }

      // Order fulfillment insight
      if (orderData && orderData.length > 0) {
        const completedOrders = orderData.filter(o => o.status === 'completed');
        const fulfillmentRate = (completedOrders.length / orderData.length) * 100;
        
        newInsights.push({
          title: 'Order Fulfillment Performance',
          description: `Order fulfillment rate is ${fulfillmentRate.toFixed(1)}%`,
          impact: fulfillmentRate < 90 ? 'high' : fulfillmentRate < 95 ? 'medium' : 'low',
          category: 'service_delivery',
          recommendations: fulfillmentRate < 90 ? [
            'Review vendor performance',
            'Optimize order processing workflow',
            'Implement quality controls'
          ] : [
            'Maintain service standards',
            'Consider expansion opportunities'
          ],
          metrics: {
            fulfillment_rate: fulfillmentRate,
            total_orders: orderData.length,
            completed_orders: completedOrders.length
          }
        });
      }

      setInsights(newInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create automated report
  const createReport = useCallback(async (reportConfig: Partial<AutomatedReport>) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('automated_reports')
        .insert([{
          report_name: reportConfig.report_name || '',
          report_type: reportConfig.report_type || 'performance',
          schedule_config: reportConfig.schedule_config || {},
          recipients: reportConfig.recipients || [],
          template_config: reportConfig.template_config || {},
          is_active: reportConfig.is_active ?? true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Report Created',
        description: `Automated report "${reportConfig.report_name}" has been created`,
      });

      await fetchReports();
      return data;
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: 'Failed to Create Report',
        description: 'Failed to create automated report',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchReports, toast]);

  // Generate report manually
  const generateReport = useCallback(async (reportId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { report_id: reportId }
      });

      if (error) throw error;

      toast({
        title: 'Report Generated',
        description: 'Report has been generated successfully',
      });

      await fetchGenerations();
      return data;
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Report Generation Failed',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchGenerations, toast]);

  useEffect(() => {
    fetchKPIs();
    fetchReports();
    fetchGenerations();
    generateInsights();
  }, [fetchKPIs, fetchReports, fetchGenerations, generateInsights]);

  return {
    kpis,
    reports,
    generations,
    insights,
    loading,
    calculateKPIs,
    generateInsights,
    createReport,
    generateReport,
    refreshData: () => {
      fetchKPIs();
      fetchReports();
      fetchGenerations();
      generateInsights();
    }
  };
}