import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface CostCenter {
  id: string;
  name: string;
  category: string;
  budget: number;
  spent: number;
  forecasted: number;
  variance: number;
  last_month_spent: number;
}

interface FinancialMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface BudgetAlert {
  id: string;
  cost_center: string;
  alert_type: 'overspend' | 'underspend' | 'trending_over';
  severity: 'low' | 'medium' | 'high';
  message: string;
  amount: number;
  percentage: number;
}

export const FinancialAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'quarter' | 'year' | 'ytd'>('quarter');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Mock cost center data
  const costCenters: CostCenter[] = [
    {
      id: '1',
      name: 'Maintenance & Repairs',
      category: 'Operations',
      budget: 50000,
      spent: 42500,
      forecasted: 48000,
      variance: -4500,
      last_month_spent: 14200
    },
    {
      id: '2',
      name: 'Utilities & Energy',
      category: 'Operations',
      budget: 35000,
      spent: 31200,
      forecasted: 33800,
      variance: -1200,
      last_month_spent: 10800
    },
    {
      id: '3',
      name: 'Security Services',
      category: 'Security',
      budget: 28000,
      spent: 29400,
      forecasted: 30200,
      variance: 2200,
      last_month_spent: 9800
    },
    {
      id: '4',
      name: 'Cleaning & Janitorial',
      category: 'Operations',
      budget: 22000,
      spent: 19800,
      forecasted: 21500,
      variance: -500,
      last_month_spent: 6600
    },
    {
      id: '5',
      name: 'Technology & Systems',
      category: 'IT',
      budget: 18000,
      spent: 15600,
      forecasted: 17200,
      variance: -800,
      last_month_spent: 5200
    },
    {
      id: '6',
      name: 'Insurance & Legal',
      category: 'Administrative',
      budget: 15000,
      spent: 15000,
      forecasted: 15000,
      variance: 0,
      last_month_spent: 5000
    }
  ];

  // Mock financial metrics
  const financialMetrics: FinancialMetric[] = [
    { name: 'Operating Ratio', current: 78.5, previous: 82.1, target: 75.0, unit: '%', trend: 'down' },
    { name: 'Cost per Sq Ft', current: 12.45, previous: 13.20, target: 11.50, unit: '$/sq ft', trend: 'down' },
    { name: 'Revenue per Unit', current: 2850, previous: 2780, target: 3000, unit: '$', trend: 'up' },
    { name: 'Occupancy Rate', current: 94.2, previous: 91.8, target: 95.0, unit: '%', trend: 'up' },
    { name: 'Net Operating Income', current: 485000, previous: 460000, target: 500000, unit: '$', trend: 'up' },
    { name: 'Maintenance Cost Ratio', current: 8.2, previous: 9.1, target: 7.5, unit: '%', trend: 'down' }
  ];

  // Mock budget alerts
  const budgetAlerts: BudgetAlert[] = [
    {
      id: '1',
      cost_center: 'Security Services',
      alert_type: 'overspend',
      severity: 'high',
      message: 'Security Services has exceeded budget by $1,400',
      amount: 1400,
      percentage: 5.0
    },
    {
      id: '2',
      cost_center: 'Technology & Systems',
      alert_type: 'underspend',
      severity: 'medium',
      message: 'Technology & Systems is under budget, potential for additional investments',
      amount: 2400,
      percentage: 13.3
    },
    {
      id: '3',
      cost_center: 'Maintenance & Repairs',
      alert_type: 'trending_over',
      severity: 'medium',
      message: 'Maintenance costs trending 4% above forecast',
      amount: 2000,
      percentage: 4.2
    }
  ];

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGeneratingReport(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-500';
    if (variance < 0) return 'text-green-500';
    return 'text-gray-500';
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateUtilization = (spent: number, budget: number) => {
    return Math.round((spent / budget) * 100);
  };

  const totalBudget = costCenters.reduce((sum, center) => sum + center.budget, 0);
  const totalSpent = costCenters.reduce((sum, center) => sum + center.spent, 0);
  const totalForecasted = costCenters.reduce((sum, center) => sum + center.forecasted, 0);
  const budgetUtilization = (totalSpent / totalBudget) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Financial Analytics</h2>
          <p className="text-muted-foreground">Comprehensive cost center tracking and budget optimization</p>
        </div>
        <Button 
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className="bg-primary hover:bg-primary/90"
        >
          {isGeneratingReport ? (
            <>
              <BarChart3 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'quarter' | 'year' | 'ytd')}>
        <TabsList>
          <TabsTrigger value="quarter">This Quarter</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
          <TabsTrigger value="ytd">Year to Date</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold text-foreground">${totalBudget.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-foreground">${totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Forecasted</p>
                    <p className="text-2xl font-bold text-foreground">${totalForecasted.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                    <p className="text-2xl font-bold text-foreground">{budgetUtilization.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Alerts */}
          {budgetAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Budget Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgetAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`border rounded-lg p-4 ${getAlertSeverityColor(alert.severity)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{alert.cost_center}</h3>
                          <p className="text-sm mt-1">{alert.message}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={alert.severity === 'high' ? 'border-red-300' : alert.severity === 'medium' ? 'border-yellow-300' : 'border-blue-300'}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            ${alert.amount.toLocaleString()} ({alert.percentage.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cost Center Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Cost Center Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costCenters.map((center) => {
                  const utilization = calculateUtilization(center.spent, center.budget);
                  const isOverBudget = center.spent > center.budget;
                  
                  return (
                    <div key={center.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-foreground">{center.name}</h3>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {center.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Utilization</p>
                          <p className={`text-lg font-bold ${isOverBudget ? 'text-red-500' : 'text-foreground'}`}>
                            {utilization}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-medium text-foreground">${center.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Spent</p>
                          <p className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-foreground'}`}>
                            ${center.spent.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Forecasted</p>
                          <p className="font-medium text-foreground">${center.forecasted.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Variance</p>
                          <p className={`font-medium ${getVarianceColor(center.variance)}`}>
                            {center.variance > 0 ? '+' : ''}${center.variance.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Month</p>
                          <p className="font-medium text-foreground">${center.last_month_spent.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Budget Progress</span>
                          <span className={isOverBudget ? 'text-red-500' : 'text-foreground'}>
                            ${center.spent.toLocaleString()} / ${center.budget.toLocaleString()}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(utilization, 100)} 
                          className={`h-2 ${isOverBudget ? 'bg-red-100' : ''}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Key Financial Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Key Financial Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {financialMetrics.map((metric, index) => {
                  const isOnTarget = metric.current >= metric.target;
                  const changePercent = ((metric.current - metric.previous) / metric.previous) * 100;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{metric.name}</h3>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {metric.unit === '$' ? '$' : ''}{metric.current.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
                          </p>
                        </div>
                        {getTrendIcon(metric.trend)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Previous:</span>
                          <span className="text-foreground">{metric.unit === '$' ? '$' : ''}{metric.previous.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target:</span>
                          <span className={isOnTarget ? 'text-green-500' : 'text-red-500'}>
                            {metric.unit === '$' ? '$' : ''}{metric.target.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Change:</span>
                          <span className={changePercent > 0 ? 'text-green-500' : 'text-red-500'}>
                            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};