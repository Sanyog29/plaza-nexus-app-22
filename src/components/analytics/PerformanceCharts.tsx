import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface ChartData {
  lineData: Array<{ name: string; requests: number; resolved: number; sla_breaches: number }>;
  barData: Array<{ category: string; count: number; avg_time: number }>;
  pieData: Array<{ name: string; value: number; color: string }>;
}

export const PerformanceCharts: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6m');
  const [chartData, setChartData] = useState<ChartData>({
    lineData: [],
    barData: [],
    pieData: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchChartData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch performance metrics for line chart
      const { data: performanceData, error: performanceError } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('metric_date', { ascending: true })
        .limit(6);

      if (performanceError) {
        console.error('Error fetching performance data:', performanceError);
        throw performanceError;
      }

      const lineData = performanceData?.map(item => ({
        name: new Date(item.metric_date).toLocaleDateString('en-US', { month: 'short' }),
        requests: item.total_requests,
        resolved: item.completed_requests,
        sla_breaches: item.sla_breaches
      })) || [];

      // Fetch maintenance requests by category for bar chart
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          status,
          created_at,
          completed_at,
          maintenance_categories(name)
        `);

      const categoryStats = requests?.reduce((acc, req) => {
        const category = req.maintenance_categories?.name || 'General';
        if (!acc[category]) {
          acc[category] = { count: 0, totalTime: 0, completedCount: 0 };
        }
        acc[category].count++;
        
        if (req.status === 'completed' && req.completed_at && req.created_at) {
          const timeHours = (new Date(req.completed_at).getTime() - new Date(req.created_at).getTime()) / (1000 * 60 * 60);
          acc[category].totalTime += timeHours;
          acc[category].completedCount++;
        }
        return acc;
      }, {} as Record<string, { count: number; totalTime: number; completedCount: number }>);

      const barData = Object.entries(categoryStats || {}).map(([category, stats]) => ({
        category,
        count: stats.count,
        avg_time: stats.completedCount > 0 ? stats.totalTime / stats.completedCount : 0
      }));

      // Calculate status distribution for pie chart
      const statusCounts = requests?.reduce((acc, req) => {
        const status = req.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = requests?.length || 1;
      const pieData = [
        { 
          name: 'Completed', 
          value: Math.round(((statusCounts?.completed || 0) / total) * 100), 
          color: 'hsl(var(--primary))' 
        },
        { 
          name: 'In Progress', 
          value: Math.round(((statusCounts?.in_progress || 0) / total) * 100), 
          color: 'hsl(var(--secondary))' 
        },
        { 
          name: 'Pending', 
          value: Math.round(((statusCounts?.pending || 0) / total) * 100), 
          color: 'hsl(var(--muted))' 
        },
      ];

      setChartData({ lineData, barData, pieData });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Performance Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track system performance over time
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">1 Month</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Request Volume & Resolution</CardTitle>
            <CardDescription>
              Monthly trends for maintenance requests and resolutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.lineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Total Requests"
                />
                <Line 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Resolved"
                />
                <Line 
                  type="monotone" 
                  dataKey="sla_breaches" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  name="SLA Breaches"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests by Category</CardTitle>
            <CardDescription>
              Distribution of maintenance requests by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.barData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="category" 
                  className="text-xs fill-muted-foreground"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>
              Current status of all maintenance requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};