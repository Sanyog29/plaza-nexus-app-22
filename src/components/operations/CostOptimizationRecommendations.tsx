import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Lightbulb, 
  Clock, 
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface CostRecommendation {
  id: string;
  category: 'energy' | 'maintenance' | 'staffing' | 'procurement' | 'space';
  title: string;
  description: string;
  potential_savings: number;
  implementation_cost: number;
  payback_period_months: number;
  priority: 'high' | 'medium' | 'low';
  complexity: 'easy' | 'moderate' | 'complex';
  status: 'pending' | 'in_progress' | 'implemented';
  roi_percentage: number;
  impact_areas: string[];
}

interface CostMetrics {
  total_monthly_cost: number;
  potential_monthly_savings: number;
  current_efficiency_score: number;
  recommended_actions: number;
  implemented_savings: number;
  cost_trend: number;
}

interface CostTrendData {
  month: string;
  actual_cost: number;
  optimized_cost: number;
  savings: number;
}

export const CostOptimizationRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<CostRecommendation[]>([]);
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  const [trendData, setTrendData] = useState<CostTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const generateCostRecommendations = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch maintenance requests for cost analysis
      const { data: maintenanceRequests, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

      if (maintenanceError) throw maintenanceError;

      // Fetch assets for equipment optimization
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*');

      if (assetsError) throw assetsError;

      // Generate cost optimization recommendations
      const recommendations: CostRecommendation[] = [
        {
          id: '1',
          category: 'energy',
          title: 'Implement Smart Lighting Controls',
          description: 'Install motion sensors and daylight harvesting controls to reduce lighting costs by 30-40%',
          potential_savings: 2500,
          implementation_cost: 8000,
          payback_period_months: 38,
          priority: 'high',
          complexity: 'moderate',
          status: 'pending',
          roi_percentage: 312,
          impact_areas: ['Electricity costs', 'Environmental impact']
        },
        {
          id: '2',
          category: 'maintenance',
          title: 'Preventive Maintenance Program',
          description: 'Implement predictive maintenance to reduce emergency repairs by 60%',
          potential_savings: 5000,
          implementation_cost: 15000,
          payback_period_months: 36,
          priority: 'high',
          complexity: 'complex',
          status: 'pending',
          roi_percentage: 400,
          impact_areas: ['Maintenance costs', 'Equipment downtime', 'Labor efficiency']
        },
        {
          id: '3',
          category: 'energy',
          title: 'HVAC System Optimization',
          description: 'Upgrade HVAC controls and implement zone-based temperature management',
          potential_savings: 3200,
          implementation_cost: 12000,
          payback_period_months: 45,
          priority: 'medium',
          complexity: 'complex',
          status: 'pending',
          roi_percentage: 320,
          impact_areas: ['Heating/cooling costs', 'Energy efficiency']
        },
        {
          id: '4',
          category: 'staffing',
          title: 'Optimize Maintenance Staff Scheduling',
          description: 'Implement data-driven scheduling to reduce overtime costs by 25%',
          potential_savings: 1800,
          implementation_cost: 3000,
          payback_period_months: 20,
          priority: 'medium',
          complexity: 'easy',
          status: 'in_progress',
          roi_percentage: 720,
          impact_areas: ['Labor costs', 'Staff productivity']
        },
        {
          id: '5',
          category: 'procurement',
          title: 'Bulk Purchasing Program',
          description: 'Consolidate purchasing to negotiate better rates on maintenance supplies',
          potential_savings: 1200,
          implementation_cost: 1000,
          payback_period_months: 10,
          priority: 'high',
          complexity: 'easy',
          status: 'pending',
          roi_percentage: 1440,
          impact_areas: ['Material costs', 'Inventory management']
        },
        {
          id: '6',
          category: 'space',
          title: 'Space Utilization Optimization',
          description: 'Reconfigure underutilized areas to reduce heating and maintenance costs',
          potential_savings: 2000,
          implementation_cost: 5000,
          payback_period_months: 30,
          priority: 'low',
          complexity: 'moderate',
          status: 'pending',
          roi_percentage: 480,
          impact_areas: ['Space costs', 'Utilities', 'Cleaning costs']
        }
      ];

      // Calculate metrics
      const totalMonthlyCost = 25000; // Mock current monthly operational cost
      const potentialMonthlySavings = recommendations.reduce((sum, rec) => sum + rec.potential_savings, 0);
      const currentEfficiency = 72; // Mock efficiency score
      const implementedSavings = recommendations
        .filter(rec => rec.status === 'implemented')
        .reduce((sum, rec) => sum + rec.potential_savings, 0);

      // Generate trend data
      const trendData: CostTrendData[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        const actualCost = totalMonthlyCost + (Math.random() - 0.5) * 3000;
        const optimizedCost = actualCost * (0.7 + Math.random() * 0.2); // 70-90% of actual
        
        trendData.push({
          month: monthName,
          actual_cost: Math.round(actualCost),
          optimized_cost: Math.round(optimizedCost),
          savings: Math.round(actualCost - optimizedCost)
        });
      }

      setRecommendations(recommendations);
      setMetrics({
        total_monthly_cost: totalMonthlyCost,
        potential_monthly_savings: potentialMonthlySavings,
        current_efficiency_score: currentEfficiency,
        recommended_actions: recommendations.filter(r => r.status === 'pending').length,
        implemented_savings: implementedSavings,
        cost_trend: -8.5 // Negative means cost reduction
      });
      setTrendData(trendData);

    } catch (error) {
      console.error('Error generating cost recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generateCostRecommendations();
  }, [generateCostRecommendations]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const categoryColors = {
    energy: '#10B981',
    maintenance: '#3B82F6',
    staffing: '#8B5CF6',
    procurement: '#F59E0B',
    space: '#EF4444'
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                <div className="text-2xl font-bold">{formatCurrency(metrics?.total_monthly_cost || 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Potential Savings</p>
                <div className="text-2xl font-bold text-green-500">{formatCurrency(metrics?.potential_monthly_savings || 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                <div className="text-2xl font-bold">{metrics?.current_efficiency_score || 0}%</div>
                <Progress value={metrics?.current_efficiency_score || 0} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Recommendations</p>
                <div className="text-2xl font-bold">{metrics?.recommended_actions || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Cost Trend</p>
                <div className="text-2xl font-bold text-green-500">{metrics?.cost_trend || 0}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="trends">Cost Trends</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="energy">Energy</option>
              <option value="maintenance">Maintenance</option>
              <option value="staffing">Staffing</option>
              <option value="procurement">Procurement</option>
              <option value="space">Space</option>
            </select>
            <Button onClick={generateCostRecommendations} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {filteredRecommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(rec.status)}
                        <h3 className="font-semibold">{rec.title}</h3>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getComplexityColor(rec.complexity)}>
                          {rec.complexity}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {rec.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-600">Monthly Savings:</span>
                          <div className="font-semibold">{formatCurrency(rec.potential_savings)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Implementation Cost:</span>
                          <div className="font-semibold">{formatCurrency(rec.implementation_cost)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Payback Period:</span>
                          <div className="font-semibold">{rec.payback_period_months} months</div>
                        </div>
                        <div>
                          <span className="font-medium text-primary">ROI:</span>
                          <div className="font-semibold">{rec.roi_percentage}%</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {rec.impact_areas.map((area, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      {rec.status === 'pending' && (
                        <Button size="sm">
                          Implement
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Area 
                    type="monotone" 
                    dataKey="actual_cost" 
                    stackId="1" 
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive))" 
                    fillOpacity={0.6}
                    name="Actual Cost"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="optimized_cost" 
                    stackId="2" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                    name="Optimized Cost"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Savings by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        recommendations.reduce((acc, rec) => {
                          acc[rec.category] = (acc[rec.category] || 0) + rec.potential_savings;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, savings]) => ({ category, savings }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="savings"
                    >
                      {Object.keys(categoryColors).map((category) => (
                        <Cell key={category} fill={categoryColors[category as keyof typeof categoryColors]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI vs Implementation Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={recommendations.map(rec => ({
                    name: rec.title.substring(0, 15) + '...',
                    roi: rec.roi_percentage,
                    cost: rec.implementation_cost / 1000
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="roi" stroke="hsl(var(--primary))" name="ROI %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};