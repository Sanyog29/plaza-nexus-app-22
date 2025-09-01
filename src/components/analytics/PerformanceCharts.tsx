import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { extractCategoryName } from '@/utils/categoryUtils';

interface PerformanceMetric {
  date: string;
  resolved: number;
  pending: number;
  in_progress: number;
  sla_compliance: number;
  avg_resolution_time: number;
}

interface CategoryPerformance {
  category: string;
  count: number;
  avg_time: number;
  sla_compliance: number;
}

const PerformanceCharts: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [chartType, setChartType] = useState<'overview' | 'category' | 'trends'>('overview');
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryPerformance[]>([]);

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user, timeRange]);

  const fetchPerformanceData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      // Fetch maintenance requests with category data
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          main_categories(name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (requests) {
        // Process category performance
        const categoryMap = new Map<string, {
          count: number;
          total_time: number;
          sla_compliant: number;
        }>();

        requests.forEach(req => {
          const categoryName = extractCategoryName(req.main_categories);
          
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, {
              count: 0,
              total_time: 0,
              sla_compliant: 0
            });
          }

          const categoryStats = categoryMap.get(categoryName)!;
          categoryStats.count++;

          // Calculate resolution time if completed
          if (req.completed_at && req.created_at) {
            const resolutionTime = new Date(req.completed_at).getTime() - new Date(req.created_at).getTime();
            categoryStats.total_time += resolutionTime / (1000 * 60 * 60); // Convert to hours
          }

          // Check SLA compliance
          if (req.status === 'completed' && (!req.sla_breach_at || new Date(req.completed_at!) <= new Date(req.sla_breach_at))) {
            categoryStats.sla_compliant++;
          }
        });

        // Convert to array format
        const categoryPerformance: CategoryPerformance[] = Array.from(categoryMap.entries()).map(([category, stats]) => ({
          category,
          count: stats.count,
          avg_time: stats.count > 0 ? stats.total_time / stats.count : 0,
          sla_compliance: stats.count > 0 ? (stats.sla_compliant / stats.count) * 100 : 0
        }));

        setCategoryData(categoryPerformance);

        // Process performance metrics by date
        const dateMap = new Map<string, PerformanceMetric>();

        requests.forEach(req => {
          const date = new Date(req.created_at).toLocaleDateString();

          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date,
              resolved: 0,
              pending: 0,
              in_progress: 0,
              sla_compliance: 0,
              avg_resolution_time: 0
            });
          }

          const metric = dateMap.get(date)!;

          switch (req.status) {
            case 'completed':
              metric.resolved++;
              break;
            case 'pending':
              metric.pending++;
              break;
            case 'in_progress':
              metric.in_progress++;
              break;
          }
        });

        // Convert to array format
        const performanceMetrics: PerformanceMetric[] = Array.from(dateMap.values());
        setPerformanceData(performanceMetrics);
      }

    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#9cafff'];

  const renderOverviewChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={performanceData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="resolved" fill="#82ca9d" />
        <Bar dataKey="pending" fill="#8884d8" />
        <Bar dataKey="in_progress" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderCategoryChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          dataKey="count"
          isAnimationActive={false}
          data={categoryData}
          cx="50%"
          cy="50%"
          outerRadius={150}
          fill="#8884d8"
          label
        >
          {
            categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))
          }
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderTrendsChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={performanceData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="resolved" stroke="#82ca9d" />
        {/* Add more lines for other metrics as needed */}
      </LineChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
          <p className="text-muted-foreground">Visualize key performance indicators over time</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chart Options</CardTitle>
          <CardDescription>Select the type of chart to display</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={chartType === 'overview' ? 'default' : 'outline'}
              onClick={() => setChartType('overview')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={chartType === 'category' ? 'default' : 'outline'}
              onClick={() => setChartType('category')}
            >
              <PieChartIcon className="h-4 w-4 mr-2" />
              Category
            </Button>
            <Button
              variant={chartType === 'trends' ? 'default' : 'outline'}
              onClick={() => setChartType('trends')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trends
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Chart</CardTitle>
          <CardDescription>Visual representation of performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {chartType === 'overview' && renderOverviewChart()}
          {chartType === 'category' && renderCategoryChart()}
          {chartType === 'trends' && renderTrendsChart()}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceCharts;
