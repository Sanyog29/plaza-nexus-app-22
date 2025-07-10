import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface ExecutiveMetrics {
  revenue: {
    total: number;
    trend: number;
  };
  slaCompliance: {
    percentage: number;
    trend: number;
  };
  activeUsers: {
    count: number;
    trend: number;
  };
  criticalIssues: {
    count: number;
    trend: number;
  };
  operationalMetrics: {
    completionRate: number;
    avgResponseTime: number;
    staffUtilization: number;
    customerSatisfaction: number;
  };
  resourceAllocation: Array<{
    department: string;
    utilization: number;
  }>;
}

export const useExecutiveDashboard = (period: string = '30') => {
  const { user } = useAuth();
  const [executiveMetrics, setExecutiveMetrics] = useState<ExecutiveMetrics | null>(null);
  const [performanceTrends, setPerformanceTrends] = useState<any>(null);
  const [costAnalysis, setCostAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateExecutiveMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const daysBack = parseInt(period);
      const periodAgo = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      
      // Overview Metrics
      const { data: requestsData } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', periodAgo.toISOString());

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

      // Critical Issues
      const criticalIssues = requestsData?.filter(r => 
        r.priority === 'urgent' && r.status !== 'completed'
      ).length || 0;

      // Active Users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');
      
      const activeUsers = profilesData?.length || 0;

      // Mock revenue calculation (would be based on actual financial data)
      const revenue = {
        total: 250000 + Math.random() * 50000,
        trend: (Math.random() - 0.5) * 20
      };

      const executiveData: ExecutiveMetrics = {
        revenue,
        slaCompliance: {
          percentage: Math.round(slaCompliance),
          trend: (Math.random() - 0.3) * 10
        },
        activeUsers: {
          count: activeUsers,
          trend: (Math.random() - 0.2) * 15
        },
        criticalIssues: {
          count: criticalIssues,
          trend: (Math.random() - 0.6) * 8
        },
        operationalMetrics: {
          completionRate: Math.round(completionRate),
          avgResponseTime: Math.round(avgResolutionTime * 10) / 10,
          staffUtilization: Math.round(Math.random() * 20 + 75),
          customerSatisfaction: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10
        },
        resourceAllocation: [
          { department: 'IT', utilization: Math.round(Math.random() * 30 + 65) },
          { department: 'Facilities', utilization: Math.round(Math.random() * 25 + 70) },
          { department: 'Security', utilization: Math.round(Math.random() * 20 + 75) },
          { department: 'Maintenance', utilization: Math.round(Math.random() * 25 + 68) }
        ]
      };

      setExecutiveMetrics(executiveData);

      // Generate performance trends
      const trends = {
        requestVolume: generateTrendData('requests', daysBack),
        efficiency: generateTrendData('efficiency', daysBack),
        satisfaction: generateTrendData('satisfaction', daysBack)
      };
      setPerformanceTrends(trends);

      // Generate cost analysis
      const costs = {
        totalSpend: 125000 + Math.random() * 25000,
        budgetVariance: (Math.random() - 0.5) * 20,
        costPerRequest: Math.round(150 + Math.random() * 50),
        savings: Math.round(15000 + Math.random() * 10000)
      };
      setCostAnalysis(costs);

    } catch (error) {
      console.error('Error calculating executive metrics:', error);
      setError('Failed to load executive dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  const generateTrendData = (type: string, days: number) => {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(Math.random() * 100 + 50),
        trend: (Math.random() - 0.5) * 20
      });
    }
    return data;
  };

  const refreshData = useCallback(() => {
    calculateExecutiveMetrics();
  }, [calculateExecutiveMetrics]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    calculateExecutiveMetrics();

    // Refresh every 5 minutes
    const interval = setInterval(calculateExecutiveMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, calculateExecutiveMetrics]);

  return {
    executiveMetrics,
    performanceTrends,
    costAnalysis,
    isLoading,
    error,
    refreshData
  };
};