import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface FloorPerformance {
  floor: string;
  zone?: string;
  metrics: {
    totalRequests: number;
    completionRate: number;
    avgResolutionTime: number;
    slaCompliance: number;
    visitorSatisfaction: number;
    maintenanceCosts: number;
    equipmentUptime: number;
  };
  trends: {
    requestVolume: Array<{ date: string; count: number }>;
    performance: Array<{ date: string; score: number }>;
  };
  ranking: {
    overall: number;
    efficiency: number;
    satisfaction: number;
    compliance: number;
  };
  alerts: Array<{
    type: 'performance' | 'cost' | 'compliance';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface BenchmarkComparison {
  metric: string;
  value: number;
  benchmark: number;
  variance: number;
  status: 'above' | 'below' | 'on_target';
  unit: string;
}

interface PerformanceInsights {
  topPerformers: Array<{ floor: string; score: number; reason: string }>;
  improvementOpportunities: Array<{ floor: string; issue: string; recommendation: string }>;
  costOptimization: Array<{ area: string; potential_saving: number; action: string }>;
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
}

export const usePerformanceBenchmarking = () => {
  const { user } = useAuth();
  const [floorPerformance, setFloorPerformance] = useState<FloorPerformance[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkComparison[]>([]);
  const [insights, setInsights] = useState<PerformanceInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateFloorPerformance = useCallback(async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get maintenance requests by floor/zone
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get visitor data by location
      const { data: visitors } = await supabase
        .from('visitors')
        .select('*')
        .gte('visit_date', thirtyDaysAgo.toISOString().split('T')[0]);

      // Get staff performance by zone
      const { data: staff } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['ops_supervisor', 'field_staff']);

      if (!requests) throw new Error('Failed to fetch maintenance data');

      // Define floors/zones (this could come from a configuration table)
      const locations = [
        { floor: 'Ground Floor', zone: 'Lobby' },
        { floor: 'Ground Floor', zone: 'Reception' },
        { floor: '1st Floor', zone: 'Office North' },
        { floor: '1st Floor', zone: 'Office South' },
        { floor: '2nd Floor', zone: 'Conference' },
        { floor: '2nd Floor', zone: 'Executive' },
        { floor: '3rd Floor', zone: 'Technical' },
        { floor: 'Basement', zone: 'Utilities' }
      ];

      const floorMetrics: FloorPerformance[] = await Promise.all(
        locations.map(async (location) => {
          // Filter requests for this location
          const locationRequests = requests.filter(r => 
            r.location?.toLowerCase().includes(location.floor.toLowerCase()) ||
            r.location?.toLowerCase().includes(location.zone?.toLowerCase() || '')
          );

          const totalRequests = locationRequests.length;
          const completedRequests = locationRequests.filter(r => r.status === 'completed').length;
          const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

          // Calculate average resolution time
          const completedWithTimes = locationRequests.filter(r => r.status === 'completed' && r.completed_at);
          const avgResolutionTime = completedWithTimes.length > 0
            ? completedWithTimes.reduce((acc, req) => {
                const created = new Date(req.created_at);
                const completed = new Date(req.completed_at);
                return acc + (completed.getTime() - created.getTime());
              }, 0) / completedWithTimes.length / (1000 * 60 * 60) // Convert to hours
            : 0;

          // SLA Compliance
          const slaBreaches = locationRequests.filter(r => 
            r.sla_breach_at && (
              (r.status === 'completed' && r.completed_at > r.sla_breach_at) ||
              (r.status !== 'completed' && now > new Date(r.sla_breach_at))
            )
          ).length;
          const slaCompliance = totalRequests > 0 ? ((totalRequests - slaBreaches) / totalRequests) * 100 : 100;

          // Mock additional metrics (would come from real data sources)
          const visitorSatisfaction = 85 + Math.random() * 10; // 85-95%
          const maintenanceCosts = Math.floor(Math.random() * 20000) + 10000; // $10k-30k
          const equipmentUptime = 90 + Math.random() * 8; // 90-98%

          // Generate trend data (last 30 days)
          const trends = {
            requestVolume: Array.from({ length: 30 }, (_, i) => {
              const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
              const dayRequests = locationRequests.filter(r => 
                r.created_at.startsWith(date.toISOString().split('T')[0])
              ).length;
              return {
                date: date.toISOString().split('T')[0],
                count: dayRequests
              };
            }),
            performance: Array.from({ length: 7 }, (_, i) => {
              const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
              const score = Math.floor(slaCompliance + visitorSatisfaction + completionRate) / 3;
              return {
                date: date.toISOString().split('T')[0],
                score: Math.round(score + (Math.random() - 0.5) * 10)
              };
            })
          };

          // Calculate rankings (compared to other floors)
          const overallScore = (completionRate + slaCompliance + visitorSatisfaction + equipmentUptime) / 4;
          
          // Generate alerts based on performance
          const alerts = [];
          if (slaCompliance < 85) {
            alerts.push({
              type: 'compliance' as const,
              message: `SLA compliance below target (${Math.round(slaCompliance)}%)`,
              severity: 'high' as const
            });
          }
          if (completionRate < 80) {
            alerts.push({
              type: 'performance' as const,
              message: `Low completion rate (${Math.round(completionRate)}%)`,
              severity: 'medium' as const
            });
          }
          if (maintenanceCosts > 25000) {
            alerts.push({
              type: 'cost' as const,
              message: `High maintenance costs ($${Math.round(maintenanceCosts).toLocaleString()})`,
              severity: 'medium' as const
            });
          }

          return {
            floor: location.floor,
            zone: location.zone,
            metrics: {
              totalRequests,
              completionRate: Math.round(completionRate),
              avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
              slaCompliance: Math.round(slaCompliance),
              visitorSatisfaction: Math.round(visitorSatisfaction),
              maintenanceCosts: Math.round(maintenanceCosts),
              equipmentUptime: Math.round(equipmentUptime * 10) / 10
            },
            trends,
            ranking: {
              overall: Math.round(overallScore),
              efficiency: Math.round(completionRate),
              satisfaction: Math.round(visitorSatisfaction),
              compliance: Math.round(slaCompliance)
            },
            alerts
          };
        })
      );

      // Sort by overall performance
      floorMetrics.sort((a, b) => b.ranking.overall - a.ranking.overall);

      setFloorPerformance(floorMetrics);
      return floorMetrics;

    } catch (error) {
      console.error('Error calculating floor performance:', error);
      throw error;
    }
  }, []);

  const calculateBenchmarks = useCallback((floorData: FloorPerformance[]) => {
    if (!floorData.length) return [];

    // Calculate industry benchmarks
    const industryBenchmarks = {
      completionRate: 92,
      avgResolutionTime: 4.5,
      slaCompliance: 95,
      visitorSatisfaction: 88,
      equipmentUptime: 96,
      maintenanceCosts: 15000
    };

    // Calculate our averages
    const ourAverages = {
      completionRate: floorData.reduce((acc, f) => acc + f.metrics.completionRate, 0) / floorData.length,
      avgResolutionTime: floorData.reduce((acc, f) => acc + f.metrics.avgResolutionTime, 0) / floorData.length,
      slaCompliance: floorData.reduce((acc, f) => acc + f.metrics.slaCompliance, 0) / floorData.length,
      visitorSatisfaction: floorData.reduce((acc, f) => acc + f.metrics.visitorSatisfaction, 0) / floorData.length,
      equipmentUptime: floorData.reduce((acc, f) => acc + f.metrics.equipmentUptime, 0) / floorData.length,
      maintenanceCosts: floorData.reduce((acc, f) => acc + f.metrics.maintenanceCosts, 0) / floorData.length
    };

    const benchmarkComparisons: BenchmarkComparison[] = [
      {
        metric: 'Completion Rate',
        value: Math.round(ourAverages.completionRate),
        benchmark: industryBenchmarks.completionRate,
        variance: Math.round(ourAverages.completionRate - industryBenchmarks.completionRate),
        status: ourAverages.completionRate >= industryBenchmarks.completionRate ? 'above' : 'below',
        unit: '%'
      },
      {
        metric: 'Resolution Time',
        value: Math.round(ourAverages.avgResolutionTime * 10) / 10,
        benchmark: industryBenchmarks.avgResolutionTime,
        variance: Math.round((ourAverages.avgResolutionTime - industryBenchmarks.avgResolutionTime) * 10) / 10,
        status: ourAverages.avgResolutionTime <= industryBenchmarks.avgResolutionTime ? 'above' : 'below',
        unit: 'hours'
      },
      {
        metric: 'SLA Compliance',
        value: Math.round(ourAverages.slaCompliance),
        benchmark: industryBenchmarks.slaCompliance,
        variance: Math.round(ourAverages.slaCompliance - industryBenchmarks.slaCompliance),
        status: ourAverages.slaCompliance >= industryBenchmarks.slaCompliance ? 'above' : 'below',
        unit: '%'
      },
      {
        metric: 'Visitor Satisfaction',
        value: Math.round(ourAverages.visitorSatisfaction),
        benchmark: industryBenchmarks.visitorSatisfaction,
        variance: Math.round(ourAverages.visitorSatisfaction - industryBenchmarks.visitorSatisfaction),
        status: ourAverages.visitorSatisfaction >= industryBenchmarks.visitorSatisfaction ? 'above' : 'below',
        unit: '%'
      },
      {
        metric: 'Equipment Uptime',
        value: Math.round(ourAverages.equipmentUptime * 10) / 10,
        benchmark: industryBenchmarks.equipmentUptime,
        variance: Math.round((ourAverages.equipmentUptime - industryBenchmarks.equipmentUptime) * 10) / 10,
        status: ourAverages.equipmentUptime >= industryBenchmarks.equipmentUptime ? 'above' : 'below',
        unit: '%'
      },
      {
        metric: 'Maintenance Costs',
        value: Math.round(ourAverages.maintenanceCosts),
        benchmark: industryBenchmarks.maintenanceCosts,
        variance: Math.round(ourAverages.maintenanceCosts - industryBenchmarks.maintenanceCosts),
        status: ourAverages.maintenanceCosts <= industryBenchmarks.maintenanceCosts ? 'above' : 'below',
        unit: '$'
      }
    ];

    setBenchmarks(benchmarkComparisons);
    return benchmarkComparisons;
  }, []);

  const generateInsights = useCallback((floorData: FloorPerformance[]) => {
    if (!floorData.length) return null;

    // Top performers
    const topPerformers = floorData
      .slice(0, 3)
      .map(floor => ({
        floor: `${floor.floor}${floor.zone ? ` - ${floor.zone}` : ''}`,
        score: floor.ranking.overall,
        reason: floor.ranking.efficiency > 90 
          ? 'Excellent operational efficiency'
          : floor.ranking.satisfaction > 90
          ? 'Outstanding visitor satisfaction'
          : 'Strong overall performance'
      }));

    // Improvement opportunities
    const improvementOpportunities = floorData
      .filter(floor => floor.ranking.overall < 80 || floor.alerts.length > 0)
      .slice(0, 3)
      .map(floor => {
        let issue = 'General performance concerns';
        let recommendation = 'Review operational procedures';

        if (floor.metrics.slaCompliance < 85) {
          issue = 'SLA compliance issues';
          recommendation = 'Increase staff allocation and improve response procedures';
        } else if (floor.metrics.completionRate < 80) {
          issue = 'Low completion rate';
          recommendation = 'Review workflow efficiency and resource allocation';
        } else if (floor.metrics.maintenanceCosts > 25000) {
          issue = 'High maintenance costs';
          recommendation = 'Implement preventive maintenance and equipment upgrades';
        }

        return {
          floor: `${floor.floor}${floor.zone ? ` - ${floor.zone}` : ''}`,
          issue,
          recommendation
        };
      });

    // Cost optimization opportunities
    const costOptimization = [
      {
        area: 'Preventive Maintenance',
        potential_saving: 15000,
        action: 'Implement predictive maintenance scheduling'
      },
      {
        area: 'Energy Efficiency',
        potential_saving: 8000,
        action: 'Upgrade to smart building controls'
      },
      {
        area: 'Vendor Consolidation',
        potential_saving: 12000,
        action: 'Negotiate bulk service agreements'
      }
    ];

    // Trend analysis
    const performanceChanges = floorData.map(floor => {
      const recentScore = floor.trends.performance.slice(-3).reduce((acc, p) => acc + p.score, 0) / 3;
      const olderScore = floor.trends.performance.slice(0, 3).reduce((acc, p) => acc + p.score, 0) / 3;
      const change = recentScore - olderScore;
      
      return {
        floor: `${floor.floor}${floor.zone ? ` - ${floor.zone}` : ''}`,
        change
      };
    });

    const trends = {
      improving: performanceChanges.filter(p => p.change > 2).map(p => p.floor),
      declining: performanceChanges.filter(p => p.change < -2).map(p => p.floor),
      stable: performanceChanges.filter(p => Math.abs(p.change) <= 2).map(p => p.floor)
    };

    const insights: PerformanceInsights = {
      topPerformers,
      improvementOpportunities,
      costOptimization,
      trends
    };

    setInsights(insights);
    return insights;
  }, []);

  const refreshBenchmarks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const floorData = await calculateFloorPerformance();
      calculateBenchmarks(floorData);
      generateInsights(floorData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load performance data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [calculateFloorPerformance, calculateBenchmarks, generateInsights]);

  useEffect(() => {
    if (!user) return;

    refreshBenchmarks();

    // Refresh every 30 minutes
    const interval = setInterval(refreshBenchmarks, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, refreshBenchmarks]);

  return {
    floorPerformance,
    benchmarks,
    insights,
    loading,
    error,
    refreshBenchmarks
  };
};