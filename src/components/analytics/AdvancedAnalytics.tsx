import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, 
  Target, Calendar, Users, Wrench, Building
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AnalyticsData {
  kpis: {
    totalRequests: number;
    completionRate: number;
    avgResolutionTime: number;
    slaCompliance: number;
    totalCost: number;
    costSavings: number;
    staffEfficiency: number;
    customerSatisfaction: number;
  };
  trends: {
    requestVolume: Array<{ month: string; requests: number; completed: number; }>;
    costAnalysis: Array<{ month: string; maintenance: number; utilities: number; staff: number; }>;
    slaPerformance: Array<{ week: string; compliance: number; breaches: number; }>;
  };
  predictions: {
    nextMonthRequests: number;
    predictedCost: number;
    maintenanceAlerts: Array<{ asset: string; dueDate: string; urgency: 'high' | 'medium' | 'low'; }>;
  };
  breakdowns: {
    requestsByCategory: Array<{ name: string; value: number; color: string; }>;
    costByDepartment: Array<{ department: string; amount: number; budget: number; }>;
    staffWorkload: Array<{ staff: string; assigned: number; completed: number; efficiency: number; }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const AdvancedAnalytics: React.FC = () => {
  const { isAdmin, userRole } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch analytics data from various sources
      const [requestsData, performanceData, costData] = await Promise.all([
        fetchRequestsAnalytics(),
        fetchPerformanceMetrics(),
        fetchCostAnalytics()
      ]);

      const analyticsData: AnalyticsData = {
        kpis: {
          totalRequests: requestsData.total || 0,
          completionRate: requestsData.completionRate || 0,
          avgResolutionTime: performanceData.avgResolutionTime || 0,
          slaCompliance: performanceData.slaCompliance || 0,
          totalCost: costData.totalCost || 0,
          costSavings: costData.savings || 0,
          staffEfficiency: performanceData.staffEfficiency || 0,
          customerSatisfaction: 4.2, // Mock data
        },
        trends: {
          requestVolume: generateRequestTrends(),
          costAnalysis: generateCostTrends(),
          slaPerformance: generateSLATrends(),
        },
        predictions: {
          nextMonthRequests: Math.round((requestsData.total || 0) * 1.15),
          predictedCost: Math.round((costData.totalCost || 0) * 1.08),
          maintenanceAlerts: await fetchMaintenanceAlerts(),
        },
        breakdowns: {
          requestsByCategory: await fetchCategoryBreakdown(),
          costByDepartment: generateDepartmentCosts(),
          staffWorkload: await fetchStaffWorkload(),
        }
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequestsAnalytics = async () => {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('id, status, created_at, completed_at')
      .gte('created_at', getDateRange());

    if (error) throw error;

    const total = data?.length || 0;
    const completed = data?.filter(r => r.status === 'completed').length || 0;
    
    return {
      total,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  };

  const fetchPerformanceMetrics = async () => {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('metric_date', getDateRange())
      .order('metric_date', { ascending: false });

    if (error) throw error;

    const metrics = data || [];
    const avgResolutionTime = metrics.reduce((sum, m) => sum + (m.average_completion_time_minutes || 0), 0) / metrics.length || 0;
    const totalRequests = metrics.reduce((sum, m) => sum + (m.total_requests || 0), 0);
    const totalBreaches = metrics.reduce((sum, m) => sum + (m.sla_breaches || 0), 0);
    const slaCompliance = totalRequests > 0 ? ((totalRequests - totalBreaches) / totalRequests) * 100 : 0;

    return {
      avgResolutionTime: Math.round(avgResolutionTime),
      slaCompliance: Math.round(slaCompliance),
      staffEfficiency: Math.round(Math.random() * 30 + 70), // Mock calculation
    };
  };

  const fetchCostAnalytics = async () => {
    // Mock cost data - in real implementation, this would come from cost_centers and budget_allocations
    return {
      totalCost: Math.round(Math.random() * 50000 + 25000),
      savings: Math.round(Math.random() * 5000 + 2000),
    };
  };

  const fetchMaintenanceAlerts = async () => {
    const { data, error } = await supabase
      .from('amc_alerts')
      .select('*, assets(asset_name)')
      .eq('is_resolved', false)
      .order('due_date', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching maintenance alerts:', error);
      return [];
    }

    return (data || []).map(alert => {
      const urgency: 'high' | 'medium' | 'low' = new Date(alert.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        ? 'high' : new Date(alert.due_date) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
        ? 'medium' : 'low';
      
      return {
        asset: alert.assets?.asset_name || 'Unknown Asset',
        dueDate: alert.due_date,
        urgency
      };
    });
  };

  const fetchCategoryBreakdown = async () => {
    // Since categories relationship is not available, use mock data for now
    return [
      { name: 'Electrical', value: 25, color: COLORS[0] },
      { name: 'Plumbing', value: 18, color: COLORS[1] },
      { name: 'HVAC', value: 22, color: COLORS[2] },
      { name: 'General', value: 15, color: COLORS[3] },
      { name: 'IT Equipment', value: 12, color: COLORS[4] },
      { name: 'Cleaning', value: 8, color: COLORS[5] },
    ];
  };

  const fetchStaffWorkload = async () => {
    // Use mock data for staff workload due to complex relationships
    return [
      { staff: 'John Smith', assigned: 12, completed: 10, efficiency: 83 },
      { staff: 'Sarah Johnson', assigned: 8, completed: 7, efficiency: 88 },
      { staff: 'Mike Davis', assigned: 15, completed: 11, efficiency: 73 },
      { staff: 'Emily Wilson', assigned: 9, completed: 8, efficiency: 89 },
      { staff: 'David Brown', assigned: 11, completed: 9, efficiency: 82 },
    ];
  };

  const getDateRange = () => {
    const now = new Date();
    const monthsBack = selectedPeriod === '1month' ? 1 : selectedPeriod === '6months' ? 6 : 3;
    return new Date(now.getFullYear(), now.getMonth() - monthsBack, 1).toISOString();
  };

  // Generate mock trend data
  const generateRequestTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      requests: Math.round(Math.random() * 50 + 20),
      completed: Math.round(Math.random() * 40 + 15),
    }));
  };

  const generateCostTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      maintenance: Math.round(Math.random() * 8000 + 5000),
      utilities: Math.round(Math.random() * 12000 + 8000),
      staff: Math.round(Math.random() * 15000 + 10000),
    }));
  };

  const generateSLATrends = () => {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    return weeks.map(week => ({
      week,
      compliance: Math.round(Math.random() * 20 + 80),
      breaches: Math.round(Math.random() * 5 + 1),
    }));
  };

  const generateDepartmentCosts = () => {
    return [
      { department: 'IT', amount: 25000, budget: 30000 },
      { department: 'Facilities', amount: 18000, budget: 20000 },
      { department: 'Security', amount: 12000, budget: 15000 },
      { department: 'Maintenance', amount: 22000, budget: 25000 },
    ];
  };

  if (!isAdmin && userRole !== 'ops_supervisor') {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">Advanced analytics require admin or supervisor access.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
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

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights and predictive analytics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === '1month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('1month')}
          >
            1M
          </Button>
          <Button
            variant={selectedPeriod === '3months' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('3months')}
          >
            3M
          </Button>
          <Button
            variant={selectedPeriod === '6months' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('6months')}
          >
            6M
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Requests</CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.kpis.totalRequests}</div>
            <p className="text-xs text-green-400 mt-1">
              +{analytics.predictions.nextMonthRequests - analytics.kpis.totalRequests} predicted next month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.kpis.completionRate.toFixed(1)}%</div>
            <Progress value={analytics.kpis.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.kpis.avgResolutionTime}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average time to complete
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">SLA Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.kpis.slaCompliance.toFixed(1)}%</div>
            <Progress value={analytics.kpis.slaCompliance} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${analytics.kpis.totalCost.toLocaleString()}</div>
            <p className="text-xs text-green-400 mt-1">
              ${analytics.kpis.costSavings.toLocaleString()} saved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Staff Efficiency</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.kpis.staffEfficiency}%</div>
            <Progress value={analytics.kpis.staffEfficiency} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Customer Satisfaction</CardTitle>
            <Building className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.kpis.customerSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average rating
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Predicted Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${analytics.predictions.predictedCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Next month estimate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="trends">Trends & Performance</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="predictions">Predictive Insights</TabsTrigger>
          <TabsTrigger value="breakdowns">Detailed Breakdowns</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Request Volume Trends</CardTitle>
                <CardDescription>Monthly request and completion trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analytics.trends.requestVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requests" fill="#8884d8" name="Total Requests" />
                    <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">SLA Performance</CardTitle>
                <CardDescription>Weekly SLA compliance and breach tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analytics.trends.slaPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="compliance" fill="#00C49F" name="Compliance %" />
                    <Bar dataKey="breaches" fill="#FF8042" name="Breaches" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Cost Analysis by Category</CardTitle>
                <CardDescription>Monthly breakdown of operational costs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.trends.costAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="maintenance" stackId="1" fill="#8884d8" />
                    <Area type="monotone" dataKey="utilities" stackId="1" fill="#82ca9d" />
                    <Area type="monotone" dataKey="staff" stackId="1" fill="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Department Budget vs Actual</CardTitle>
                <CardDescription>Budget utilization by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.breakdowns.costByDepartment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="budget" fill="#e3e3e3" name="Budget" />
                    <Bar dataKey="amount" fill="#8884d8" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Maintenance Alerts</CardTitle>
                <CardDescription>Upcoming maintenance and service requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.predictions.maintenanceAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-white">{alert.asset}</p>
                        <p className="text-sm text-muted-foreground">Due: {new Date(alert.dueDate).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={alert.urgency === 'high' ? 'destructive' : alert.urgency === 'medium' ? 'default' : 'secondary'}>
                        {alert.urgency.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                  {analytics.predictions.maintenanceAlerts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No upcoming maintenance alerts</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Predictive Insights</CardTitle>
                <CardDescription>AI-driven predictions and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-300 mb-2">Request Volume Forecast</h4>
                    <p className="text-sm text-white">
                      Expected {analytics.predictions.nextMonthRequests} requests next month 
                      ({((analytics.predictions.nextMonthRequests / analytics.kpis.totalRequests - 1) * 100).toFixed(1)}% increase)
                    </p>
                  </div>
                  
                  <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                    <h4 className="font-medium text-yellow-300 mb-2">Cost Prediction</h4>
                    <p className="text-sm text-white">
                      Projected monthly cost: ${analytics.predictions.predictedCost.toLocaleString()}
                      ({((analytics.predictions.predictedCost / analytics.kpis.totalCost - 1) * 100).toFixed(1)}% increase)
                    </p>
                  </div>

                  <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
                    <h4 className="font-medium text-green-300 mb-2">Optimization Opportunity</h4>
                    <p className="text-sm text-white">
                      Potential savings of ${Math.round(analytics.kpis.totalCost * 0.12).toLocaleString()} through 
                      preventive maintenance scheduling
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdowns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Requests by Category</CardTitle>
                <CardDescription>Distribution of request types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.breakdowns.requestsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.breakdowns.requestsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Staff Workload & Efficiency</CardTitle>
                <CardDescription>Individual staff performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.breakdowns.staffWorkload.map((staff, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">{staff.staff}</span>
                        <Badge variant={staff.efficiency >= 80 ? 'default' : staff.efficiency >= 60 ? 'secondary' : 'destructive'}>
                          {staff.efficiency}%
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Assigned: {staff.assigned}</span>
                        <span>Completed: {staff.completed}</span>
                      </div>
                      <Progress value={staff.efficiency} className="h-2" />
                    </div>
                  ))}
                  {analytics.breakdowns.staffWorkload.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No staff workload data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};