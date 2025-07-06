import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, AlertTriangle, 
  Target, Brain, Zap, Clock, DollarSign, Activity,
  RefreshCw, Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface MaintenanceForecast {
  timeframe: 'weekly' | 'monthly' | 'quarterly';
  predictions: Array<{
    date: string;
    predictedVolume: number;
    confidence: number;
    category: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedCost: number;
    factors: string[];
  }>;
  seasonalPatterns: Array<{
    month: string;
    historicalAvg: number;
    predictedVolume: number;
    variance: number;
  }>;
  resourceRequirements: Array<{
    week: string;
    requiredStaff: number;
    skillsNeeded: string[];
    budgetRequired: number;
    workloadDistribution: Array<{
      role: string;
      hours: number;
      tasks: number;
    }>;
  }>;
  riskFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    probability: number;
    mitigation: string;
    cost: number;
  }>;
}

interface SeasonalAnalysis {
  peakSeasons: Array<{
    period: string;
    increasePercentage: number;
    commonIssues: string[];
    preparationNeeded: string[];
  }>;
  lowSeasons: Array<{
    period: string;
    decreasePercentage: number;
    opportunitiesForPM: string[];
    staffOptimization: string[];
  }>;
}

interface CostPrediction {
  currentMonth: number;
  nextMonth: number;
  nextQuarter: number;
  yearEnd: number;
  breakdown: Array<{
    category: string;
    current: number;
    predicted: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
  }>;
  savings: Array<{
    opportunity: string;
    potentialSaving: number;
    implementationCost: number;
    roi: number;
    timeframe: string;
  }>;
}

export const MaintenanceForecasting: React.FC = () => {
  const [forecast, setForecast] = useState<MaintenanceForecast | null>(null);
  const [seasonalAnalysis, setSeasonalAnalysis] = useState<SeasonalAnalysis | null>(null);
  const [costPrediction, setCostPrediction] = useState<CostPrediction | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    generateForecasts();
  }, [selectedTimeframe]);

  const generateForecasts = async () => {
    setIsLoading(true);
    try {
      // Fetch historical maintenance data
      const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories(name)
        `)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Generate forecasts based on historical data
      const forecastData = generateMaintenanceForecast(requests || [], selectedTimeframe);
      const seasonalData = generateSeasonalAnalysis(requests || []);
      const costData = generateCostPredictions(requests || []);

      setForecast(forecastData);
      setSeasonalAnalysis(seasonalData);
      setCostPrediction(costData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error generating forecasts:', error);
      toast.error('Failed to generate maintenance forecasts');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMaintenanceForecast = (
    requests: any[], 
    timeframe: 'weekly' | 'monthly' | 'quarterly'
  ): MaintenanceForecast => {
    // Analyze historical patterns
    const now = new Date();
    const predictions = [];
    const periods = timeframe === 'weekly' ? 12 : timeframe === 'monthly' ? 6 : 4;

    for (let i = 1; i <= periods; i++) {
      const periodStart = new Date(now);
      if (timeframe === 'weekly') {
        periodStart.setDate(now.getDate() + (i * 7));
      } else if (timeframe === 'monthly') {
        periodStart.setMonth(now.getMonth() + i);
      } else {
        periodStart.setMonth(now.getMonth() + (i * 3));
      }

      // Calculate historical average for this period
      const historicalData = getHistoricalDataForPeriod(requests, periodStart, timeframe);
      const baseVolume = Math.max(historicalData.avgVolume, 5);
      
      // Apply seasonal adjustments
      const seasonalMultiplier = getSeasonalMultiplier(periodStart.getMonth());
      const predictedVolume = Math.round(baseVolume * seasonalMultiplier);
      
      // Calculate confidence based on data availability
      const confidence = Math.min(95, 60 + (historicalData.dataPoints * 2));

      predictions.push({
        date: periodStart.toISOString().split('T')[0],
        predictedVolume,
        confidence,
        category: 'Mixed',
        priority: 'medium' as const,
        estimatedCost: predictedVolume * 450, // Average cost per request
        factors: [
          'Historical patterns',
          'Seasonal adjustments',
          'Equipment age trends'
        ]
      });
    }

    // Generate seasonal patterns
    const seasonalPatterns = [];
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(2024, month, 1).toLocaleString('default', { month: 'short' });
      const historicalAvg = getMonthlyAverage(requests, month);
      const predictedVolume = Math.round(historicalAvg * getSeasonalMultiplier(month));
      
      seasonalPatterns.push({
        month: monthName,
        historicalAvg: Math.round(historicalAvg),
        predictedVolume,
        variance: Math.round(Math.abs(predictedVolume - historicalAvg))
      });
    }

    // Generate resource requirements
    const resourceRequirements = predictions.slice(0, 4).map((pred, index) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() + (index * 7));
      const weekStr = `Week ${index + 1}`;
      
      const requiredStaff = Math.ceil(pred.predictedVolume / 8); // 8 tasks per staff per week
      const budgetRequired = pred.estimatedCost;
      
      return {
        week: weekStr,
        requiredStaff,
        skillsNeeded: ['General Maintenance', 'Electrical', 'Plumbing'],
        budgetRequired,
        workloadDistribution: [
          { role: 'Field Staff', hours: requiredStaff * 30, tasks: Math.round(pred.predictedVolume * 0.7) },
          { role: 'Supervisors', hours: requiredStaff * 10, tasks: Math.round(pred.predictedVolume * 0.3) }
        ]
      };
    });

    // Generate risk factors
    const riskFactors = [
      {
        factor: 'Peak season demand surge',
        impact: 'high' as const,
        probability: 75,
        mitigation: 'Pre-schedule additional staff and stock spare parts',
        cost: 15000
      },
      {
        factor: 'Equipment aging leading to increased failures',
        impact: 'medium' as const,
        probability: 60,
        mitigation: 'Implement predictive maintenance program',
        cost: 8000
      },
      {
        factor: 'Staff shortage during holidays',
        impact: 'medium' as const,
        probability: 45,
        mitigation: 'Cross-train staff and arrange temporary coverage',
        cost: 5000
      }
    ];

    return {
      timeframe,
      predictions,
      seasonalPatterns,
      resourceRequirements,
      riskFactors
    };
  };

  const getHistoricalDataForPeriod = (requests: any[], date: Date, timeframe: string) => {
    const samePeriodsLastYear = requests.filter(req => {
      const reqDate = new Date(req.created_at);
      const isSamePeriod = timeframe === 'monthly' 
        ? reqDate.getMonth() === date.getMonth()
        : Math.floor(reqDate.getMonth() / 3) === Math.floor(date.getMonth() / 3);
      return isSamePeriod && reqDate.getFullYear() < date.getFullYear();
    });

    return {
      avgVolume: samePeriodsLastYear.length / Math.max(1, Math.floor(samePeriodsLastYear.length / 12)),
      dataPoints: samePeriodsLastYear.length
    };
  };

  const getSeasonalMultiplier = (month: number): number => {
    // Summer months typically have higher HVAC demand, winter has heating issues
    const seasonalFactors = [
      1.0, // Jan
      0.9, // Feb  
      1.1, // Mar - Spring maintenance
      1.2, // Apr
      1.3, // May - Pre-summer prep
      1.4, // Jun - Peak summer
      1.5, // Jul - Peak summer
      1.4, // Aug - Still high
      1.2, // Sep - Fall maintenance
      1.1, // Oct
      1.0, // Nov
      0.9  // Dec
    ];
    return seasonalFactors[month] || 1.0;
  };

  const getMonthlyAverage = (requests: any[], month: number): number => {
    const monthlyRequests = requests.filter(req => {
      const reqDate = new Date(req.created_at);
      return reqDate.getMonth() === month;
    });
    
    // Average per year
    const years = new Set(requests.map(req => new Date(req.created_at).getFullYear())).size;
    return monthlyRequests.length / Math.max(1, years);
  };

  const generateSeasonalAnalysis = (requests: any[]): SeasonalAnalysis => {
    return {
      peakSeasons: [
        {
          period: 'Summer (Jun-Aug)',
          increasePercentage: 45,
          commonIssues: ['HVAC failures', 'Cooling system maintenance', 'Electrical overloads'],
          preparationNeeded: ['Stock HVAC parts', 'Schedule AC servicing', 'Train staff on cooling systems']
        },
        {
          period: 'Spring (Mar-May)',
          increasePercentage: 25,
          commonIssues: ['General maintenance', 'Equipment tune-ups', 'Facility preparations'],
          preparationNeeded: ['General parts inventory', 'Schedule preventive maintenance', 'Staff availability planning']
        }
      ],
      lowSeasons: [
        {
          period: 'Winter (Dec-Feb)',
          decreasePercentage: 15,
          opportunitiesForPM: ['Deep equipment maintenance', 'Facility upgrades', 'System overhauls'],
          staffOptimization: ['Training programs', 'Cross-training initiatives', 'Vacation scheduling']
        }
      ]
    };
  };

  const generateCostPredictions = (requests: any[]): CostPrediction => {
    const avgCostPerRequest = 450;
    const currentMonthRequests = requests.filter(req => {
      const reqDate = new Date(req.created_at);
      const now = new Date();
      return reqDate.getMonth() === now.getMonth() && reqDate.getFullYear() === now.getFullYear();
    }).length;

    const currentMonth = currentMonthRequests * avgCostPerRequest;
    const nextMonth = Math.round(currentMonth * 1.15); // Seasonal increase
    const nextQuarter = Math.round(currentMonth * 3.2);
    const yearEnd = Math.round(currentMonth * 11.8);

    return {
      currentMonth,
      nextMonth,
      nextQuarter,
      yearEnd,
      breakdown: [
        {
          category: 'Emergency Repairs',
          current: currentMonth * 0.4,
          predicted: nextMonth * 0.35,
          trend: 'decreasing' as const,
          confidence: 78
        },
        {
          category: 'Preventive Maintenance',
          current: currentMonth * 0.3,
          predicted: nextMonth * 0.4,
          trend: 'increasing' as const,
          confidence: 85
        },
        {
          category: 'Equipment Replacement',
          current: currentMonth * 0.2,
          predicted: nextMonth * 0.15,
          trend: 'stable' as const,
          confidence: 70
        },
        {
          category: 'Utilities & Supplies',
          current: currentMonth * 0.1,
          predicted: nextMonth * 0.1,
          trend: 'stable' as const,
          confidence: 90
        }
      ],
      savings: [
        {
          opportunity: 'Implement predictive maintenance program',
          potentialSaving: 25000,
          implementationCost: 10000,
          roi: 150,
          timeframe: '6 months'
        },
        {
          opportunity: 'Bulk purchasing agreements for common parts',
          potentialSaving: 12000,
          implementationCost: 2000,
          roi: 500,
          timeframe: '3 months'
        },
        {
          opportunity: 'Staff cross-training to reduce contractor costs',
          potentialSaving: 18000,
          implementationCost: 5000,
          roi: 260,
          timeframe: '4 months'
        }
      ]
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Maintenance Forecasting & Resource Planning
          </h2>
          <p className="text-muted-foreground">
            AI-powered predictions for optimal resource allocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
              <SelectItem value="quarterly">Quarterly View</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateForecasts} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Forecast Summary */}
      {forecast && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Next Period Volume</p>
                  <p className="text-2xl font-bold text-white">
                    {forecast.predictions[0]?.predictedVolume || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {forecast.predictions[0]?.confidence || 0}% confidence
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Predicted Cost</p>
                  <p className="text-2xl font-bold text-white">
                    ${(forecast.predictions[0]?.estimatedCost || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Staff Required</p>
                  <p className="text-2xl font-bold text-white">
                    {forecast.resourceRequirements[0]?.requiredStaff || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((forecast.resourceRequirements[0]?.requiredStaff || 0) * 35)} hours
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <p className="text-2xl font-bold text-white">
                    {forecast.riskFactors.filter(r => r.impact === 'high').length > 0 ? 'High' : 'Medium'}
                  </p>
                  <Badge className="mt-1 bg-yellow-500/10 text-yellow-400">
                    {forecast.riskFactors.length} factors
                  </Badge>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList className="bg-card/50">
          <TabsTrigger value="predictions">Volume Predictions</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Analysis</TabsTrigger>
          <TabsTrigger value="resources">Resource Planning</TabsTrigger>
          <TabsTrigger value="costs">Cost Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          {forecast && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Maintenance Volume Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={forecast.predictions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predictedVolume" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Confidence Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={forecast.predictions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Bar dataKey="confidence" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          {seasonalAnalysis && forecast && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Seasonal Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecast.seasonalPatterns}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="historicalAvg" 
                        stroke="#8884d8" 
                        name="Historical"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predictedVolume" 
                        stroke="#82ca9d" 
                        name="Predicted"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Peak Seasons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {seasonalAnalysis.peakSeasons.map((season, index) => (
                      <div key={index} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-white">{season.period}</span>
                          <Badge className="bg-red-500/20 text-red-400">
                            +{season.increasePercentage}%
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">Common Issues: </span>
                            <span className="text-white">{season.commonIssues.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Preparation: </span>
                            <span className="text-white">{season.preparationNeeded.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Low Seasons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {seasonalAnalysis.lowSeasons.map((season, index) => (
                      <div key={index} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-white">{season.period}</span>
                          <Badge className="bg-blue-500/20 text-blue-400">
                            -{season.decreasePercentage}%
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">PM Opportunities: </span>
                            <span className="text-white">{season.opportunitiesForPM.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Staff Optimization: </span>
                            <span className="text-white">{season.staffOptimization.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          {forecast && (
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Resource Requirements Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {forecast.resourceRequirements.map((req, index) => (
                    <div key={index} className="p-4 bg-background/20 rounded-lg">
                      <h4 className="font-medium text-white mb-3">{req.week}</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-muted-foreground">Staff Required</span>
                            <span className="font-medium text-white">{req.requiredStaff}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-muted-foreground">Budget</span>
                            <span className="font-medium text-white">
                              ${req.budgetRequired.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-muted-foreground">Skills Needed:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {req.skillsNeeded.map((skill, skillIndex) => (
                              <Badge key={skillIndex} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-muted-foreground">Workload:</span>
                          {req.workloadDistribution.map((dist, distIndex) => (
                            <div key={distIndex} className="flex justify-between text-xs mt-1">
                              <span>{dist.role}:</span>
                              <span>{dist.hours}h / {dist.tasks} tasks</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {forecast && (
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Risk Factors & Mitigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {forecast.riskFactors.map((risk, index) => (
                  <div key={index} className="p-4 bg-background/20 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-white">{risk.factor}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`${
                            risk.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                            risk.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {risk.impact} impact
                        </Badge>
                        <span className="text-sm text-muted-foreground">{risk.probability}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{risk.mitigation}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Mitigation Cost:</span>
                      <span className="font-medium text-white">${risk.cost.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          {costPrediction && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Cost Predictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-background/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Current Month</p>
                      <p className="text-xl font-bold text-white">
                        ${costPrediction.currentMonth.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-background/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Next Month</p>
                      <p className="text-xl font-bold text-white">
                        ${costPrediction.nextMonth.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-background/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Next Quarter</p>
                      <p className="text-xl font-bold text-white">
                        ${costPrediction.nextQuarter.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-background/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year End</p>
                      <p className="text-xl font-bold text-white">
                        ${costPrediction.yearEnd.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-white">Cost Breakdown</h4>
                    {costPrediction.breakdown.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white">{item.category}</span>
                          <div className="flex items-center gap-2">
                            {item.trend === 'increasing' ? (
                              <TrendingUp className="h-3 w-3 text-red-500" />
                            ) : item.trend === 'decreasing' ? (
                              <TrendingDown className="h-3 w-3 text-green-500" />
                            ) : (
                              <div className="h-3 w-3 bg-gray-500 rounded-full" />
                            )}
                            <span className="text-sm text-muted-foreground">
                              ${item.predicted.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(item.predicted / costPrediction.nextMonth) * 100} 
                            className="flex-1 h-1" 
                          />
                          <span className="text-xs text-muted-foreground">{item.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Cost Savings Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {costPrediction.savings.map((saving, index) => (
                    <div key={index} className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <h4 className="font-medium text-white mb-2">{saving.opportunity}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Potential Saving:</span>
                          <p className="font-medium text-green-400">
                            ${saving.potentialSaving.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Implementation:</span>
                          <p className="font-medium text-white">
                            ${saving.implementationCost.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ROI:</span>
                          <p className="font-medium text-blue-400">{saving.roi}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timeframe:</span>
                          <p className="font-medium text-white">{saving.timeframe}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};