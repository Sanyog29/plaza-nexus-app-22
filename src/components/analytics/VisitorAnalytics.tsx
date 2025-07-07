import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Users, Clock, TrendingUp, Calendar, Download, 
  AlertTriangle, CheckCircle, Timer, Building 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { EmptyAnalyticsState } from './EmptyAnalyticsState';
import { AnalyticsLoadingSkeleton } from './AnalyticsLoadingSkeleton';
import { toast } from '@/hooks/use-toast';

interface VisitorMetrics {
  totalVisitors: number;
  checkedIn: number;
  checkedOut: number;
  noShows: number;
  averageVisitDuration: number;
  peakHours: { hour: number; count: number }[];
  dailyTrends: { date: string; visitors: number; checkIns: number }[];
  categoryBreakdown: { category: string; count: number; color: string }[];
  companyStats: { company: string; visitors: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const VisitorAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<VisitorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7'); // days
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const daysBack = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), daysBack));
      const endDate = endOfDay(new Date());

      // Get visitor data
      const { data: visitors, error: fetchError } = await supabase
        .from('visitors')
        .select(`
          *,
          visitor_categories (name, color),
          visitor_check_logs (*)
        `)
        .gte('visit_date', startDate.toISOString().split('T')[0])
        .lte('visit_date', endDate.toISOString().split('T')[0]);

      if (fetchError) {
        throw fetchError;
      }

      if (visitors && visitors.length > 0) {
        const processedMetrics = processVisitorData(visitors, daysBack);
        setMetrics(processedMetrics);
      } else {
        setMetrics({
          totalVisitors: 0,
          checkedIn: 0,
          checkedOut: 0,
          noShows: 0,
          averageVisitDuration: 0,
          peakHours: [],
          dailyTrends: [],
          categoryBreakdown: [],
          companyStats: []
        });
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError(error.message || 'Failed to load analytics data');
      toast({
        title: "Error loading analytics",
        description: error.message || 'Failed to load analytics data',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processVisitorData = (visitors: any[], daysBack: number): VisitorMetrics => {
    const totalVisitors = visitors.length;
    const checkedIn = visitors.filter(v => v.status === 'checked_in').length;
    const checkedOut = visitors.filter(v => v.status === 'checked_out').length;
    const noShows = visitors.filter(v => {
      if (!v.entry_time || v.status !== 'scheduled') return false;
      const expectedTime = new Date(`${v.visit_date}T${v.entry_time}`);
      const now = new Date();
      return now.getTime() - expectedTime.getTime() > 2 * 60 * 60 * 1000; // 2 hours past
    }).length;

    // Calculate average visit duration
    const completedVisits = visitors.filter(v => v.check_in_time && v.check_out_time);
    const averageVisitDuration = completedVisits.length > 0 
      ? completedVisits.reduce((sum, v) => {
          const duration = new Date(v.check_out_time).getTime() - new Date(v.check_in_time).getTime();
          return sum + duration;
        }, 0) / completedVisits.length / (1000 * 60) // minutes
      : 0;

    // Peak hours analysis
    const hourCounts: { [key: number]: number } = {};
    visitors.forEach(visitor => {
      if (visitor.check_in_time) {
        const hour = new Date(visitor.check_in_time).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);

    // Daily trends
    const dailyData: { [key: string]: { visitors: number; checkIns: number } } = {};
    for (let i = 0; i < daysBack; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyData[date] = { visitors: 0, checkIns: 0 };
    }
    
    visitors.forEach(visitor => {
      const date = visitor.visit_date;
      if (dailyData[date]) {
        dailyData[date].visitors++;
        if (visitor.status === 'checked_in' || visitor.status === 'checked_out') {
          dailyData[date].checkIns++;
        }
      }
    });

    const dailyTrends = Object.entries(dailyData)
      .map(([date, data]) => ({ date: format(new Date(date), 'MMM dd'), ...data }))
      .reverse();

    // Category breakdown
    const categoryData: { [key: string]: { count: number; color: string } } = {};
    visitors.forEach(visitor => {
      const category = visitor.visitor_categories?.name || 'Unknown';
      const color = visitor.visitor_categories?.color || '#888888';
      if (!categoryData[category]) {
        categoryData[category] = { count: 0, color };
      }
      categoryData[category].count++;
    });

    const categoryBreakdown = Object.entries(categoryData)
      .map(([category, data]) => ({ category, count: data.count, color: data.color }))
      .sort((a, b) => b.count - a.count);

    // Company stats
    const companyData: { [key: string]: number } = {};
    visitors.forEach(visitor => {
      const company = visitor.company || 'Individual';
      companyData[company] = (companyData[company] || 0) + 1;
    });

    const companyStats = Object.entries(companyData)
      .map(([company, visitors]) => ({ company, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    return {
      totalVisitors,
      checkedIn,
      checkedOut,
      noShows,
      averageVisitDuration,
      peakHours,
      dailyTrends,
      categoryBreakdown,
      companyStats
    };
  };

  const exportReport = async () => {
    if (!metrics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `${dateRange} days`,
      metrics,
      summary: {
        totalVisitors: metrics.totalVisitors,
        checkInRate: ((metrics.checkedIn + metrics.checkedOut) / metrics.totalVisitors * 100).toFixed(1),
        noShowRate: (metrics.noShows / metrics.totalVisitors * 100).toFixed(1),
        averageVisitDuration: Math.round(metrics.averageVisitDuration)
      }
    };

    // Create and download JSON report
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (error) {
    return (
      <EmptyAnalyticsState 
        title="Error Loading Data"
        description={error}
        type="visitor"
      />
    );
  }

  if (!metrics || metrics.totalVisitors === 0) {
    return (
      <EmptyAnalyticsState 
        title="No Visitor Data"
        description="No visitor data found for the selected time period. Visitor analytics will appear here once you have visitor check-ins."
        type="visitor"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Visitor Analytics</h2>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visitors</p>
                <p className="text-2xl font-bold text-foreground">{metrics.totalVisitors}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Check-in Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {((metrics.checkedIn + metrics.checkedOut) / metrics.totalVisitors * 100).toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No-Show Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {(metrics.noShows / metrics.totalVisitors * 100).toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Visit Duration</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(metrics.averageVisitDuration)}m
                </p>
              </div>
              <Timer className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 bg-card/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trends */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Daily Visitor Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="visitors" 
                      stackId="1"
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Total Visitors"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="checkIns" 
                      stackId="2"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Check-ins"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Peak Check-in Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.peakHours.slice(0, 12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      labelFormatter={(value) => `${value}:00`}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Visitor Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Total Visitors"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="checkIns" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Successful Check-ins"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Visitor Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Category Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.categoryBreakdown.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                        />
                        <span className="text-white">{category.category}</span>
                      </div>
                      <Badge variant="secondary">{category.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Top Visiting Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.companyStats} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="company" type="category" stroke="#9CA3AF" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Bar dataKey="visitors" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};