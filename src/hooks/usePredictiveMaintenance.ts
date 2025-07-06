import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface EquipmentPrediction {
  equipmentId: string;
  equipmentName: string;
  location: string;
  currentStatus: 'optimal' | 'warning' | 'critical';
  predictions: {
    failureRisk: number; // 0-100
    recommendedAction: 'monitor' | 'schedule_maintenance' | 'immediate_attention';
    timeToFailure: number; // days
    confidence: number; // 0-100
  };
  patterns: {
    maintenanceFrequency: number; // requests per month
    costTrend: 'increasing' | 'stable' | 'decreasing';
    seasonalPatterns: Array<{ month: string; frequency: number }>;
    failureTypes: Array<{ type: string; frequency: number }>;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    estimatedCost: number;
    potentialSaving: number;
    timeframe: string;
  }>;
  alerts: Array<{
    type: 'maintenance_due' | 'pattern_anomaly' | 'cost_spike' | 'performance_decline';
    message: string;
    severity: 'info' | 'warning' | 'critical';
    createdAt: string;
  }>;
}

interface MaintenancePattern {
  pattern: string;
  frequency: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface CostAnalysis {
  currentMonthSpend: number;
  projectedAnnualSpend: number;
  potentialSavings: number;
  costDrivers: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  budgetHealth: 'under_budget' | 'on_budget' | 'over_budget';
}

export const usePredictiveMaintenance = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<EquipmentPrediction[]>([]);
  const [patterns, setPatterns] = useState<MaintenancePattern[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analyzeEquipmentPatterns = useCallback(async (equipmentData: any[], maintenanceData: any[]) => {
    // Group maintenance requests by equipment/location
    const equipmentGroups = equipmentData.reduce((acc, equipment) => {
      const key = `${equipment.asset_name}-${equipment.location}`;
      acc[key] = {
        equipment,
        requests: maintenanceData.filter(req => 
          req.location?.toLowerCase().includes(equipment.location.toLowerCase()) ||
          req.description?.toLowerCase().includes(equipment.asset_name.toLowerCase())
        )
      };
      return acc;
    }, {} as Record<string, any>);

    const predictions: EquipmentPrediction[] = [];

    for (const [key, group] of Object.entries(equipmentGroups)) {
      const { equipment, requests } = group as any;
      
      if (requests.length === 0) continue;

      // Calculate maintenance frequency
      const monthlyRequests = requests.length / 12; // Assuming 1 year of data
      
      // Analyze failure patterns
      const failureTypes = requests.reduce((acc: Record<string, number>, req: any) => {
        const type = req.description?.toLowerCase().includes('electrical') ? 'electrical' :
                    req.description?.toLowerCase().includes('mechanical') ? 'mechanical' :
                    req.description?.toLowerCase().includes('plumbing') ? 'plumbing' :
                    req.description?.toLowerCase().includes('hvac') ? 'hvac' : 'general';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Calculate cost trend
      const recentCosts = requests
        .filter((req: any) => new Date(req.created_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
        .length;
      const olderCosts = requests
        .filter((req: any) => {
          const date = new Date(req.created_at);
          const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
          return date <= threeMonthsAgo && date > sixMonthsAgo;
        })
        .length;
      
      const costTrend = recentCosts > olderCosts * 1.2 ? 'increasing' :
                      recentCosts < olderCosts * 0.8 ? 'decreasing' : 'stable';

      // Risk assessment based on patterns
      let failureRisk = 20; // Base risk
      if (monthlyRequests > 2) failureRisk += 30;
      if (costTrend === 'increasing') failureRisk += 25;
      if (equipment.last_service_date && new Date(equipment.last_service_date) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)) {
        failureRisk += 20;
      }
      failureRisk = Math.min(failureRisk, 95); // Cap at 95%

      // Determine status and recommendations
      let currentStatus: 'optimal' | 'warning' | 'critical' = 'optimal';
      let recommendedAction: 'monitor' | 'schedule_maintenance' | 'immediate_attention' = 'monitor';
      let timeToFailure = 365; // Default 1 year

      if (failureRisk > 70) {
        currentStatus = 'critical';
        recommendedAction = 'immediate_attention';
        timeToFailure = 30;
      } else if (failureRisk > 40) {
        currentStatus = 'warning';
        recommendedAction = 'schedule_maintenance';
        timeToFailure = 90;
      }

      // Generate recommendations
      const recommendations = [];
      
      if (monthlyRequests > 1.5) {
        recommendations.push({
          priority: 'high' as const,
          action: `Implement preventive maintenance schedule for ${equipment.asset_name}`,
          estimatedCost: 2500,
          potentialSaving: monthlyRequests * 800, // Avg cost per reactive maintenance
          timeframe: '30 days'
        });
      }

      if (costTrend === 'increasing') {
        recommendations.push({
          priority: 'medium' as const,
          action: `Review and optimize maintenance procedures for ${equipment.asset_name}`,
          estimatedCost: 1200,
          potentialSaving: recentCosts * 300,
          timeframe: '60 days'
        });
      }

      if (equipment.warranty_expiry && new Date(equipment.warranty_expiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
        recommendations.push({
          priority: 'low' as const,
          action: `Consider equipment replacement or extended warranty for ${equipment.asset_name}`,
          estimatedCost: 15000,
          potentialSaving: 5000,
          timeframe: '90 days'
        });
      }

      // Generate alerts
      const alerts = [];
      if (currentStatus === 'critical') {
        alerts.push({
          type: 'performance_decline' as const,
          message: `${equipment.asset_name} showing critical failure patterns`,
          severity: 'critical' as const,
          createdAt: new Date().toISOString()
        });
      }

      if (monthlyRequests > 2) {
        alerts.push({
          type: 'pattern_anomaly' as const,
          message: `Unusual maintenance frequency detected for ${equipment.asset_name}`,
          severity: 'warning' as const,
          createdAt: new Date().toISOString()
        });
      }

      // Seasonal patterns (mock data for demonstration)
      const seasonalPatterns = [
        { month: 'Jan', frequency: monthlyRequests * 0.8 },
        { month: 'Feb', frequency: monthlyRequests * 0.9 },
        { month: 'Mar', frequency: monthlyRequests * 1.1 },
        { month: 'Apr', frequency: monthlyRequests * 1.2 },
        { month: 'May', frequency: monthlyRequests * 1.3 },
        { month: 'Jun', frequency: monthlyRequests * 1.4 },
        { month: 'Jul', frequency: monthlyRequests * 1.5 },
        { month: 'Aug', frequency: monthlyRequests * 1.4 },
        { month: 'Sep', frequency: monthlyRequests * 1.2 },
        { month: 'Oct', frequency: monthlyRequests * 1.0 },
        { month: 'Nov', frequency: monthlyRequests * 0.9 },
        { month: 'Dec', frequency: monthlyRequests * 0.8 }
      ];

      predictions.push({
        equipmentId: equipment.id,
        equipmentName: equipment.asset_name,
        location: equipment.location,
        currentStatus,
        predictions: {
          failureRisk: Math.round(failureRisk),
          recommendedAction,
          timeToFailure: Math.round(timeToFailure),
          confidence: Math.round(85 + Math.random() * 10) // 85-95% confidence
        },
        patterns: {
          maintenanceFrequency: Math.round(monthlyRequests * 10) / 10,
          costTrend,
          seasonalPatterns,
          failureTypes: Object.entries(failureTypes).map(([type, frequency]) => ({
            type,
            frequency: frequency as number
          }))
        },
        recommendations,
        alerts
      });
    }

    return predictions.sort((a, b) => b.predictions.failureRisk - a.predictions.failureRisk);
  }, []);

  const analyzeMaintenancePatterns = useCallback((requests: any[]) => {
    const patterns: MaintenancePattern[] = [];

    // Analyze by category
    const categories = requests.reduce((acc, req) => {
      const category = req.maintenance_categories?.name || 'General';
      acc[category] = (acc[category] || []);
      acc[category].push(req);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [category, categoryRequests] of Object.entries(categories)) {
      const requests = categoryRequests as any[];
      const recentCount = requests.filter(req => 
        new Date(req.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;
      
      const previousCount = requests.filter(req => {
        const date = new Date(req.created_at);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        return date <= monthAgo && date > twoMonthsAgo;
      }).length;

      const trend = recentCount > previousCount * 1.2 ? 'increasing' :
                   recentCount < previousCount * 0.8 ? 'decreasing' : 'stable';

      let impact: 'high' | 'medium' | 'low' = 'low';
      let recommendation = `Monitor ${category.toLowerCase()} maintenance patterns`;

      if (recentCount > 5) {
        impact = 'high';
        recommendation = `Investigate root causes for high ${category.toLowerCase()} maintenance volume`;
      } else if (recentCount > 2) {
        impact = 'medium';
        recommendation = `Review ${category.toLowerCase()} maintenance procedures`;
      }

      patterns.push({
        pattern: `${category} Maintenance`,
        frequency: recentCount,
        trend,
        impact,
        recommendation
      });
    }

    return patterns.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }, []);

  const analyzeCosts = useCallback((requests: any[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Current month costs (mock calculation)
    const currentMonthRequests = requests.filter(req => 
      new Date(req.created_at) >= startOfMonth
    );
    const currentMonthSpend = currentMonthRequests.length * 850; // Average cost per request

    // Projected annual spend
    const dailyAverage = currentMonthSpend / now.getDate();
    const projectedAnnualSpend = dailyAverage * 365;

    // Cost drivers analysis
    const costDrivers = [
      { category: 'Emergency Repairs', amount: currentMonthSpend * 0.35, percentage: 35 },
      { category: 'Preventive Maintenance', amount: currentMonthSpend * 0.25, percentage: 25 },
      { category: 'Equipment Replacement', amount: currentMonthSpend * 0.20, percentage: 20 },
      { category: 'Utilities', amount: currentMonthSpend * 0.15, percentage: 15 },
      { category: 'Other', amount: currentMonthSpend * 0.05, percentage: 5 }
    ];

    // Budget health (mock calculation)
    const budgetTarget = 120000; // Annual budget
    const budgetHealth: 'under_budget' | 'on_budget' | 'over_budget' = projectedAnnualSpend > budgetTarget * 1.1 ? 'over_budget' :
                        projectedAnnualSpend < budgetTarget * 0.9 ? 'under_budget' : 'on_budget';

    // Potential savings calculation
    const emergencyRepairCost = costDrivers[0].amount;
    const preventiveSavings = emergencyRepairCost * 0.3; // 30% savings by switching to preventive
    const potentialSavings = preventiveSavings * 12; // Annual savings

    return {
      currentMonthSpend: Math.round(currentMonthSpend),
      projectedAnnualSpend: Math.round(projectedAnnualSpend),
      potentialSavings: Math.round(potentialSavings),
      costDrivers,
      budgetHealth
    };
  }, []);

  const generatePredictions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch equipment/assets data
      const { data: equipment } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'operational');

      // Fetch maintenance requests
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories (name)
        `);

      if (!equipment || !requests) {
        throw new Error('Failed to fetch data for predictions');
      }

      // Generate predictions and analysis
      const equipmentPredictions = await analyzeEquipmentPatterns(equipment, requests);
      const maintenancePatterns = analyzeMaintenancePatterns(requests);
      const costAnalysis = analyzeCosts(requests);

      setPredictions(equipmentPredictions);
      setPatterns(maintenancePatterns);
      setCostAnalysis(costAnalysis);

    } catch (error) {
      console.error('Error generating predictions:', error);
      setError('Failed to generate predictive maintenance analysis');
    } finally {
      setLoading(false);
    }
  }, [analyzeEquipmentPatterns, analyzeMaintenancePatterns, analyzeCosts]);

  useEffect(() => {
    if (!user) return;

    generatePredictions();

    // Refresh predictions every hour
    const interval = setInterval(generatePredictions, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, generatePredictions]);

  return {
    predictions,
    patterns,
    costAnalysis,
    loading,
    error,
    refreshPredictions: generatePredictions
  };
};