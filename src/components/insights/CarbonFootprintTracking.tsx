import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Leaf, Zap, Droplets, Factory, TrendingDown, 
  Target, Award, TreePine, Recycle, Sun
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface CarbonMetrics {
  totalEmissions: number; // kg CO2
  monthlyEmissions: number;
  yearlyTarget: number;
  reductionPercentage: number;
  breakdown: {
    electricity: number;
    water: number;
    waste: number;
    transportation: number;
    equipment: number;
  };
  monthlyTrend: { month: string; emissions: number; target: number }[];
  benchmarks: {
    industryAverage: number;
    bestPractice: number;
    certification: string;
  };
}

interface SustainabilityInitiative {
  id: string;
  title: string;
  category: 'energy' | 'water' | 'waste' | 'transport' | 'equipment';
  description: string;
  impact: number; // kg CO2 saved annually
  cost: number;
  roi: number; // months
  status: 'planned' | 'in_progress' | 'completed';
  startDate: string;
  completionDate?: string;
}

interface Recommendation {
  id: string;
  title: string;
  category: string;
  description: string;
  potentialSavings: number; // kg CO2 annually
  implementationCost: number;
  paybackPeriod: number; // months
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
}

export const CarbonFootprintTracking: React.FC = () => {
  const [metrics, setMetrics] = useState<CarbonMetrics>({
    totalEmissions: 0,
    monthlyEmissions: 0,
    yearlyTarget: 0,
    reductionPercentage: 0,
    breakdown: {
      electricity: 0,
      water: 0,
      waste: 0,
      transportation: 0,
      equipment: 0
    },
    monthlyTrend: [],
    benchmarks: {
      industryAverage: 0,
      bestPractice: 0,
      certification: ''
    }
  });
  const [initiatives, setInitiatives] = useState<SustainabilityInitiative[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadCarbonMetrics();
    loadSustainabilityInitiatives();
    loadRecommendations();
  }, [selectedTimeframe]);

  const loadCarbonMetrics = async () => {
    try {
      // Get utility consumption data
      const { data: utilityReadings } = await supabase
        .from('utility_readings')
        .select(`
          *,
          utility_meters(utility_type, location)
        `)
        .gte('reading_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate emissions based on utility consumption
      let electricityEmissions = 0;
      let waterEmissions = 0;

      if (utilityReadings) {
        utilityReadings.forEach(reading => {
          const consumption = reading.consumption || 0;
          
          if (reading.utility_meters?.utility_type === 'electricity') {
            // 0.4 kg CO2 per kWh (average grid factor)
            electricityEmissions += consumption * 0.4;
          } else if (reading.utility_meters?.utility_type === 'water') {
            // 0.298 kg CO2 per cubic meter
            waterEmissions += consumption * 0.298;
          }
        });
      }

      // Mock additional emissions data
      const mockMetrics: CarbonMetrics = {
        totalEmissions: Math.round(electricityEmissions + waterEmissions + 2500), // Add estimated waste/transport
        monthlyEmissions: Math.round((electricityEmissions + waterEmissions + 2500) / 12),
        yearlyTarget: 12000,
        reductionPercentage: 15.3,
        breakdown: {
          electricity: Math.round(electricityEmissions),
          water: Math.round(waterEmissions),
          waste: 800,
          transportation: 600,
          equipment: 1100
        },
        monthlyTrend: [
          { month: 'Jan', emissions: 1050, target: 1000 },
          { month: 'Feb', emissions: 980, target: 1000 },
          { month: 'Mar', emissions: 920, target: 1000 },
          { month: 'Apr', emissions: 890, target: 1000 },
          { month: 'May', emissions: 850, target: 1000 },
          { month: 'Jun', emissions: 830, target: 1000 }
        ],
        benchmarks: {
          industryAverage: 18500,
          bestPractice: 8200,
          certification: 'LEED Gold Target'
        }
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading carbon metrics:', error);
    }
  };

  const loadSustainabilityInitiatives = async () => {
    // Mock sustainability initiatives
    const mockInitiatives: SustainabilityInitiative[] = [
      {
        id: '1',
        title: 'LED Lighting Upgrade',
        category: 'energy',
        description: 'Replace all fluorescent lights with LED fixtures',
        impact: 2400,
        cost: 15000,
        roi: 18,
        status: 'completed',
        startDate: '2024-01-15',
        completionDate: '2024-03-20'
      },
      {
        id: '2',
        title: 'Smart HVAC Controls',
        category: 'energy',
        description: 'Install programmable thermostats and occupancy sensors',
        impact: 3200,
        cost: 25000,
        roi: 24,
        status: 'in_progress',
        startDate: '2024-04-01'
      },
      {
        id: '3',
        title: 'Water Conservation Program',
        category: 'water',
        description: 'Install low-flow fixtures and leak detection system',
        impact: 800,
        cost: 8000,
        roi: 20,
        status: 'planned',
        startDate: '2024-07-01'
      },
      {
        id: '4',
        title: 'Waste Reduction Initiative',
        category: 'waste',
        description: 'Implement comprehensive recycling and composting program',
        impact: 1200,
        cost: 12000,
        roi: 36,
        status: 'in_progress',
        startDate: '2024-05-15'
      }
    ];

    setInitiatives(mockInitiatives);
  };

  const loadRecommendations = async () => {
    // Mock AI-generated recommendations
    const mockRecommendations: Recommendation[] = [
      {
        id: '1',
        title: 'Solar Panel Installation',
        category: 'Energy',
        description: 'Install rooftop solar panels to reduce grid electricity dependency',
        potentialSavings: 4500,
        implementationCost: 45000,
        paybackPeriod: 48,
        difficulty: 'hard',
        priority: 'high'
      },
      {
        id: '2',
        title: 'Motion Sensor Lighting',
        category: 'Energy',
        description: 'Install motion sensors in low-traffic areas',
        potentialSavings: 600,
        implementationCost: 3000,
        paybackPeriod: 12,
        difficulty: 'easy',
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Electric Vehicle Charging',
        category: 'Transportation',
        description: 'Install EV charging stations to promote clean transportation',
        potentialSavings: 800,
        implementationCost: 12000,
        paybackPeriod: 36,
        difficulty: 'medium',
        priority: 'medium'
      }
    ];

    setRecommendations(mockRecommendations);
  };

  const implementRecommendation = async (recommendationId: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return;

    // Convert recommendation to initiative
    const newInitiative: SustainabilityInitiative = {
      id: Date.now().toString(),
      title: recommendation.title,
      category: recommendation.category.toLowerCase() as any,
      description: recommendation.description,
      impact: recommendation.potentialSavings,
      cost: recommendation.implementationCost,
      roi: recommendation.paybackPeriod,
      status: 'planned',
      startDate: new Date().toISOString()
    };

    setInitiatives(prev => [...prev, newInitiative]);
    setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
    
    toast.success('Recommendation added to sustainability initiatives');
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'energy': return <Zap className="h-4 w-4" />;
      case 'water': return <Droplets className="h-4 w-4" />;
      case 'waste': return <Recycle className="h-4 w-4" />;
      case 'transport': return <Factory className="h-4 w-4" />;
      case 'equipment': return <TreePine className="h-4 w-4" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'planned': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-blue-400 border-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            Carbon Footprint & Sustainability Tracking
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitor emissions, track initiatives, and optimize environmental impact
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400">
            <TrendingDown className="h-3 w-3 mr-1" />
            {metrics.reductionPercentage}% Reduction
          </Badge>
          <Badge className="bg-primary/20 text-primary">
            {metrics.benchmarks.certification}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Emissions</p>
                <p className="text-2xl font-bold text-white">{metrics.totalEmissions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">kg CO₂/year</p>
              </div>
              <Factory className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Average</p>
                <p className="text-2xl font-bold text-white">{metrics.monthlyEmissions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">kg CO₂/month</p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Target Progress</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round((1 - metrics.totalEmissions / metrics.yearlyTarget) * 100)}%
                </p>
                <Progress 
                  value={(1 - metrics.totalEmissions / metrics.yearlyTarget) * 100} 
                  className="h-1 mt-1" 
                />
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Initiatives Active</p>
                <p className="text-2xl font-bold text-white">
                  {initiatives.filter(i => i.status === 'in_progress').length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {initiatives.filter(i => i.status === 'completed').length} completed
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emissions Breakdown */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Emissions Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(metrics.breakdown).map(([category, emissions]) => {
              const percentage = (emissions / metrics.totalEmissions) * 100;
              return (
                <div key={category} className="text-center space-y-2">
                  <div className="flex justify-center">
                    {getCategoryIcon(category)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{category}</p>
                    <p className="text-lg font-bold text-primary">{emissions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="initiatives" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card/50">
          <TabsTrigger value="initiatives">Current Initiatives</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="benchmarks">Industry Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="initiatives" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initiatives.map((initiative) => (
              <Card key={initiative.id} className="bg-card/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(initiative.category)}
                      <h4 className="font-medium text-white">{initiative.title}</h4>
                    </div>
                    <Badge className={getStatusColor(initiative.status)}>
                      {initiative.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{initiative.description}</p>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-green-400">{initiative.impact.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">kg CO₂ saved/year</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">${initiative.cost.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Investment</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-400">{initiative.roi}m</p>
                      <p className="text-xs text-muted-foreground">ROI Period</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Started: {new Date(initiative.startDate).toLocaleDateString()}
                    {initiative.completionDate && (
                      <span> • Completed: {new Date(initiative.completionDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.map((recommendation) => (
            <Alert key={recommendation.id} className="border-l-4 border-l-primary">
              <AlertDescription>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">{recommendation.title}</h4>
                      <Badge variant="outline" className={getPriorityColor(recommendation.priority)}>
                        {recommendation.priority}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {recommendation.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-400">
                      {recommendation.potentialSavings.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">kg CO₂ saved/year</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      ${recommendation.implementationCost.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Implementation cost</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-400">{recommendation.paybackPeriod}m</p>
                    <p className="text-xs text-muted-foreground">Payback period</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="capitalize">
                      {recommendation.difficulty}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Implementation</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => implementRecommendation(recommendation.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Implement Initiative
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Current Facility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{metrics.totalEmissions.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">kg CO₂/year</p>
                  <Badge className="mt-2 bg-blue-500/20 text-blue-400">Your Performance</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Industry Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-400">{metrics.benchmarks.industryAverage.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">kg CO₂/year</p>
                  <Badge className="mt-2 bg-orange-500/20 text-orange-400">
                    {metrics.totalEmissions < metrics.benchmarks.industryAverage ? 'Below Average' : 'Above Average'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Best Practice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{metrics.benchmarks.bestPractice.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">kg CO₂/year</p>
                  <Badge className="mt-2 bg-green-500/20 text-green-400">Target Goal</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white">Current Performance</span>
                    <span className="text-sm text-primary font-medium">{metrics.totalEmissions.toLocaleString()} kg CO₂</span>
                  </div>
                  <Progress 
                    value={(metrics.totalEmissions / metrics.benchmarks.industryAverage) * 100} 
                    className="h-2" 
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white">Industry Average</span>
                    <span className="text-sm text-orange-400 font-medium">{metrics.benchmarks.industryAverage.toLocaleString()} kg CO₂</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white">Best Practice Target</span>
                    <span className="text-sm text-green-400 font-medium">{metrics.benchmarks.bestPractice.toLocaleString()} kg CO₂</span>
                  </div>
                  <Progress 
                    value={(metrics.benchmarks.bestPractice / metrics.benchmarks.industryAverage) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-background/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-white">Certification Progress</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Current target: {metrics.benchmarks.certification}
                </p>
                <Progress 
                  value={((metrics.benchmarks.industryAverage - metrics.totalEmissions) / (metrics.benchmarks.industryAverage - metrics.benchmarks.bestPractice)) * 100} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(((metrics.benchmarks.industryAverage - metrics.totalEmissions) / (metrics.benchmarks.industryAverage - metrics.benchmarks.bestPractice)) * 100)}% progress to certification
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};