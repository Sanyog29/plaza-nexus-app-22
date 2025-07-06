import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, 
  Target, Users, Building, Zap, Award, Calendar
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface ExecutiveMetrics {
  kpis: {
    operationalEfficiency: number;
    costEffectiveness: number;
    serviceQuality: number;
    complianceScore: number;
    staffSatisfaction: number;
    budgetUtilization: number;
  };
  financials: {
    totalSpend: number;
    budgetVariance: number;
    costSavings: number;
    roi: number;
    forecastAccuracy: number;
  };
  operations: {
    requestVolume: number;
    resolutionRate: number;
    slaCompliance: number;
    avgResponseTime: number;
    customerSatisfaction: number;
  };
  trends: Array<{
    month: string;
    efficiency: number;
    costs: number;
    satisfaction: number;
    compliance: number;
  }>;
  benchmarks: Array<{
    metric: string;
    current: number;
    industry: number;
    target: number;
    status: 'above' | 'below' | 'on-target';
  }>;
  insights: Array<{
    category: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionRequired: boolean;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ExecutiveDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('quarterly');

  useEffect(() => {
    loadExecutiveMetrics();
  }, [selectedTimeframe]);

  const loadExecutiveMetrics = async () => {
    setIsLoading(true);
    try {
      // Mock executive-level data
      const executiveData: ExecutiveMetrics = {
        kpis: {
          operationalEfficiency: 87.5,
          costEffectiveness: 92.3,
          serviceQuality: 4.2,
          complianceScore: 96.8,
          staffSatisfaction: 4.1,
          budgetUtilization: 78.9,
        },
        financials: {
          totalSpend: 1250000,
          budgetVariance: -8.5,
          costSavings: 185000,
          roi: 145.7,
          forecastAccuracy: 91.2,
        },
        operations: {
          requestVolume: 2847,
          resolutionRate: 94.2,
          slaCompliance: 89.7,
          avgResponseTime: 2.3,
          customerSatisfaction: 4.2,
        },
        trends: generateExecutiveTrends(),
        benchmarks: [
          { metric: 'Response Time', current: 2.3, industry: 3.1, target: 2.0, status: 'on-target' },
          { metric: 'Cost per Request', current: 145, industry: 180, target: 120, status: 'above' },
          { metric: 'SLA Compliance', current: 89.7, industry: 85.0, target: 95.0, status: 'below' },
          { metric: 'Staff Efficiency', current: 87.5, industry: 82.0, target: 90.0, status: 'on-target' },
        ],
        insights: [
          {
            category: 'Cost Optimization',
            title: 'Preventive Maintenance ROI',
            description: 'Implementing predictive maintenance could reduce emergency repair costs by 35%',
            impact: 'high',
            actionRequired: true,
          },
          {
            category: 'Service Quality',
            title: 'SLA Compliance Gap',
            description: 'Current SLA compliance is 5.3% below target, affecting customer satisfaction',
            impact: 'high',
            actionRequired: true,
          },
          {
            category: 'Operational Efficiency',
            title: 'Staff Workload Balance',
            description: 'Uneven workload distribution detected across maintenance teams',
            impact: 'medium',
            actionRequired: false,
          },
          {
            category: 'Technology',
            title: 'Automation Opportunity',
            description: '40% of routine requests could be automated, freeing up staff time',
            impact: 'medium',
            actionRequired: false,
          },
        ],
      };

      setMetrics(executiveData);
    } catch (error) {
      console.error('Error loading executive metrics:', error);
      toast.error('Failed to load executive dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateExecutiveTrends = () => {
    const months = ['Q1', 'Q2', 'Q3', 'Q4'];
    return months.map(month => ({
      month,
      efficiency: Math.round(Math.random() * 15 + 80),
      costs: Math.round(Math.random() * 50000 + 200000),
      satisfaction: Math.round(Math.random() * 10 + 85) / 10,
      compliance: Math.round(Math.random() * 10 + 85),
    }));
  };

  const exportExecutiveReport = () => {
    if (!metrics) return;
    
    const reportData = {
      summary: metrics.kpis,
      financials: metrics.financials,
      operations: metrics.operations,
      insights: metrics.insights,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'executive-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Executive Access Required</h3>
          <p className="text-muted-foreground">This dashboard is restricted to administrators only.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-muted-foreground">Strategic overview and key performance indicators</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportExecutiveReport} variant="outline" size="sm">
            Export Report
          </Button>
          <Button
            variant={selectedTimeframe === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={selectedTimeframe === 'quarterly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('quarterly')}
          >
            Quarterly
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-blue-300 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Operational Excellence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white">Efficiency Score</span>
              <span className="text-2xl font-bold text-blue-300">{metrics.kpis.operationalEfficiency}%</span>
            </div>
            <Progress value={metrics.kpis.operationalEfficiency} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
              <div>
                <p className="text-muted-foreground">Resolution Rate</p>
                <p className="font-semibold text-white">{metrics.operations.resolutionRate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Response</p>
                <p className="font-semibold text-white">{metrics.operations.avgResponseTime}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-800/50">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white">Cost Effectiveness</span>
              <span className="text-2xl font-bold text-green-300">{metrics.kpis.costEffectiveness}%</span>
            </div>
            <Progress value={metrics.kpis.costEffectiveness} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
              <div>
                <p className="text-muted-foreground">Savings</p>
                <p className="font-semibold text-white">${(metrics.financials.costSavings / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <p className="text-muted-foreground">ROI</p>
                <p className="font-semibold text-white">{metrics.financials.roi}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-800/50">
          <CardHeader>
            <CardTitle className="text-purple-300 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Service Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white">Quality Score</span>
              <span className="text-2xl font-bold text-purple-300">{metrics.kpis.serviceQuality}/5</span>
            </div>
            <Progress value={(metrics.kpis.serviceQuality / 5) * 100} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
              <div>
                <p className="text-muted-foreground">SLA Compliance</p>
                <p className="font-semibold text-white">{metrics.operations.slaCompliance}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Satisfaction</p>
                <p className="font-semibold text-white">{metrics.operations.customerSatisfaction}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Strategic Insights & Recommendations</CardTitle>
          <CardDescription>AI-powered insights for executive decision making</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {metrics.insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                insight.impact === 'high' ? 'border-l-red-500 bg-red-900/10' :
                insight.impact === 'medium' ? 'border-l-yellow-500 bg-yellow-900/10' :
                'border-l-blue-500 bg-blue-900/10'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Badge variant="outline" className="mb-2 text-xs">
                      {insight.category}
                    </Badge>
                    <h4 className="font-semibold text-white">{insight.title}</h4>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={insight.impact === 'high' ? 'destructive' : 
                                  insight.impact === 'medium' ? 'default' : 'secondary'}>
                      {insight.impact.toUpperCase()}
                    </Badge>
                    {insight.actionRequired && (
                      <Badge variant="outline" className="text-orange-400 border-orange-400">
                        ACTION
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Industry Benchmarks</CardTitle>
            <CardDescription>Performance comparison against industry standards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.benchmarks.map((benchmark, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">{benchmark.metric}</span>
                    <Badge variant={
                      benchmark.status === 'above' ? 'default' :
                      benchmark.status === 'on-target' ? 'secondary' : 'destructive'
                    }>
                      {benchmark.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-semibold text-white">
                        {typeof benchmark.current === 'number' && benchmark.current < 10 
                          ? benchmark.current.toFixed(1) 
                          : benchmark.current.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Industry</p>
                      <p className="font-semibold text-gray-400">
                        {typeof benchmark.industry === 'number' && benchmark.industry < 10 
                          ? benchmark.industry.toFixed(1) 
                          : benchmark.industry.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-semibold text-green-400">
                        {typeof benchmark.target === 'number' && benchmark.target < 10 
                          ? benchmark.target.toFixed(1) 
                          : benchmark.target.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Performance Trends</CardTitle>
            <CardDescription>Quarterly performance evolution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="efficiency" stroke="#8884d8" name="Efficiency %" />
                <Line type="monotone" dataKey="satisfaction" stroke="#82ca9d" name="Satisfaction" />
                <Line type="monotone" dataKey="compliance" stroke="#ffc658" name="Compliance %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};