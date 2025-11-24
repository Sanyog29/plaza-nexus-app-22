import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Target, 
  PieChart as PieChartIcon, BarChart3, Calendar, Settings
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { usePropertyContext } from '@/contexts/PropertyContext';

interface CostData {
  budgets: {
    total: number;
    spent: number;
    remaining: number;
    variance: number;
  };
  departments: Array<{
    name: string;
    budget: number;
    spent: number;
    variance: number;
    status: 'under' | 'on-track' | 'over';
  }>;
  categories: Array<{
    name: string;
    budget: number;
    spent: number;
    percentage: number;
  }>;
  trends: Array<{
    month: string;
    budget: number;
    actual: number;
    forecast: number;
  }>;
  alerts: Array<{
    type: 'budget_exceeded' | 'approaching_limit' | 'cost_spike';
    department: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    amount: number;
  }>;
  savings: {
    total: number;
    opportunities: Array<{
      category: string;
      potential: number;
      description: string;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const CostControlSystem: React.FC = () => {
  const { isAdmin, userRole } = useAuth();
  const { currentProperty } = usePropertyContext();
  const [costData, setCostData] = useState<CostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [budgetSettings, setBudgetSettings] = useState({
    alertThreshold: 80,
    forecastPeriod: 3,
    autoApprovals: false,
  });

  useEffect(() => {
    loadCostData();
  }, [selectedPeriod, currentProperty?.id]); // Add property dependency

  const loadCostData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from cost_centers and budget_allocations
      // filtered by currentProperty?.id
      console.log('[CostControlSystem] Loading data for property:', currentProperty?.id);
      
      const mockCostData: CostData = {
        budgets: {
          total: 150000,
          spent: 89500,
          remaining: 60500,
          variance: -12.5,
        },
        departments: [
          { name: 'IT Services', budget: 45000, spent: 28500, variance: -36.7, status: 'under' },
          { name: 'Facilities', budget: 35000, spent: 31200, variance: -10.9, status: 'on-track' },
          { name: 'Security', budget: 25000, spent: 24800, variance: -0.8, status: 'on-track' },
          { name: 'Maintenance', budget: 30000, spent: 32500, variance: 8.3, status: 'over' },
          { name: 'Utilities', budget: 15000, spent: 12200, variance: -18.7, status: 'under' },
        ],
        categories: [
          { name: 'Staff Costs', budget: 65000, spent: 48200, percentage: 35.2 },
          { name: 'Equipment', budget: 35000, spent: 22100, percentage: 24.7 },
          { name: 'Utilities', budget: 25000, spent: 18900, percentage: 21.1 },
          { name: 'Maintenance', budget: 15000, spent: 8900, percentage: 12.4 },
          { name: 'Other', budget: 10000, spent: 5800, percentage: 6.5 },
        ],
        trends: generateCostTrends(),
        alerts: [
          {
            type: 'budget_exceeded',
            department: 'Maintenance',
            message: 'Budget exceeded by 8.3% ($2,500)',
            severity: 'high',
            amount: 2500,
          },
          {
            type: 'approaching_limit',
            department: 'Security',
            message: 'Approaching budget limit - 99.2% utilized',
            severity: 'medium',
            amount: 200,
          },
          {
            type: 'cost_spike',
            department: 'Facilities',
            message: '15% increase in monthly costs detected',
            severity: 'medium',
            amount: 4200,
          },
        ],
        savings: {
          total: 18500,
          opportunities: [
            { category: 'Energy Optimization', potential: 8500, description: 'LED upgrades and smart controls' },
            { category: 'Preventive Maintenance', potential: 6200, description: 'Reduce emergency repairs' },
            { category: 'Vendor Consolidation', potential: 3800, description: 'Negotiate bulk contracts' },
          ],
        },
      };

      setCostData(mockCostData);
    } catch (error) {
      console.error('Error loading cost data:', error);
      toast.error('Failed to load cost control data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCostTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      budget: 25000,
      actual: Math.round(Math.random() * 5000 + 20000),
      forecast: Math.round(Math.random() * 3000 + 24000),
    }));
  };

  const handleBudgetAdjustment = async (departmentName: string, newBudget: number) => {
    if (!isAdmin) {
      toast.error('Only administrators can adjust budgets');
      return;
    }

    try {
      // In a real implementation, this would update the database
      toast.success(`Budget for ${departmentName} updated to $${newBudget.toLocaleString()}`);
      await loadCostData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update budget');
    }
  };

  const exportCostReport = () => {
    const csvContent = costData?.departments
      .map(dept => `${dept.name},${dept.budget},${dept.spent},${dept.variance.toFixed(1)}%`)
      .join('\n');
    
    const blob = new Blob([`Department,Budget,Spent,Variance\n${csvContent}`], 
      { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cost-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin && userRole !== 'ops_supervisor') {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">Cost control requires admin or supervisor access.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !costData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
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
          <h2 className="text-2xl font-bold text-white">Cost Control System</h2>
          <p className="text-muted-foreground">Budget management and cost optimization</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCostReport} variant="outline" size="sm">
            Export Report
          </Button>
          <Button
            variant={selectedPeriod === 'current' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('current')}
          >
            Current
          </Button>
          <Button
            variant={selectedPeriod === 'ytd' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('ytd')}
          >
            YTD
          </Button>
        </div>
      </div>

      {/* Cost Alerts */}
      {costData.alerts.length > 0 && (
        <div className="space-y-2">
          {costData.alerts.map((alert, index) => (
            <Alert key={index} className={`border-l-4 ${
              alert.severity === 'high' ? 'border-l-red-500 bg-red-900/10' :
              alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-900/10' :
              'border-l-blue-500 bg-blue-900/10'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>{alert.message}</span>
                <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                  {alert.department}
                </Badge>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${costData.budgets.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Annual allocation</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${costData.budgets.spent.toLocaleString()}</div>
            <Progress value={(costData.budgets.spent / costData.budgets.total) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Remaining</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${costData.budgets.remaining.toLocaleString()}</div>
            <p className="text-xs text-green-400 mt-1">
              {((costData.budgets.remaining / costData.budgets.total) * 100).toFixed(1)}% available
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${costData.savings.total.toLocaleString()}</div>
            <p className="text-xs text-green-400 mt-1">Cost reductions achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="overview">Budget Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="trends">Cost Trends</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Budget Utilization</CardTitle>
                <CardDescription>Current spend vs allocated budget</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costData.departments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="budget" fill="#e3e3e3" name="Budget" />
                    <Bar dataKey="spent" fill="#8884d8" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Cost Distribution</CardTitle>
                <CardDescription>Spending breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costData.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="spent"
                    >
                      {costData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Department Budget Management</CardTitle>
              <CardDescription>Individual department budget tracking and controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costData.departments.map((dept, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-white">{dept.name}</h4>
                      <Badge variant={
                        dept.status === 'over' ? 'destructive' : 
                        dept.status === 'on-track' ? 'default' : 'secondary'
                      }>
                        {dept.variance > 0 ? '+' : ''}{dept.variance.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-medium text-white">${dept.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-medium text-white">${dept.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-medium text-white">${(dept.budget - dept.spent).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <Progress value={(dept.spent / dept.budget) * 100} className="h-2" />
                    
                    {isAdmin && (
                      <div className="flex gap-2 pt-2">
                        <Input
                          type="number"
                          placeholder="New budget"
                          className="w-32"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              handleBudgetAdjustment(dept.name, Number(target.value));
                              target.value = '';
                            }
                          }}
                        />
                        <Button size="sm" variant="outline">
                          Adjust Budget
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Cost Trends & Forecasting</CardTitle>
              <CardDescription>Historical spending patterns and future projections</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={costData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="budget" fill="#e3e3e3" name="Budget" />
                  <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual" strokeWidth={2} />
                  <Line type="monotone" dataKey="forecast" stroke="#82ca9d" strokeDasharray="5 5" name="Forecast" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Cost Savings Opportunities</CardTitle>
                <CardDescription>Identified areas for cost reduction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costData.savings.opportunities.map((opportunity, index) => (
                    <div key={index} className="p-3 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white">{opportunity.category}</h4>
                        <Badge variant="default" className="bg-green-900 text-green-300">
                          ${opportunity.potential.toLocaleString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Cost Control Settings</CardTitle>
                <CardDescription>Configure budget alerts and controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold" className="text-white">Alert Threshold (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={budgetSettings.alertThreshold}
                    onChange={(e) => setBudgetSettings(prev => ({ 
                      ...prev, 
                      alertThreshold: Number(e.target.value) 
                    }))}
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forecast" className="text-white">Forecast Period (months)</Label>
                  <Input
                    id="forecast"
                    type="number"
                    value={budgetSettings.forecastPeriod}
                    onChange={(e) => setBudgetSettings(prev => ({ 
                      ...prev, 
                      forecastPeriod: Number(e.target.value) 
                    }))}
                    className="bg-input border-border"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoApprovals"
                    checked={budgetSettings.autoApprovals}
                    onChange={(e) => setBudgetSettings(prev => ({ 
                      ...prev, 
                      autoApprovals: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="autoApprovals" className="text-white text-sm">
                    Enable automatic approvals for small expenses
                  </Label>
                </div>

                <Button className="w-full mt-4">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};