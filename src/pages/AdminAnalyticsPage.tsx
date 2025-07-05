import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Users, Download } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AnalyticsData {
  totalRequests: number;
  completedRequests: number;
  averageResolutionTime: number;
  slaBreaches: number;
  requestsByPriority: { [key: string]: number };
  requestsByStatus: { [key: string]: number };
  requestsByCategory: { [key: string]: number };
  dailyRequests: { date: string; count: number }[];
}

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const daysAgo = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), daysAgo));
      const endDate = endOfDay(new Date());

      // Fetch requests within time range
      const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories!inner(name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Calculate analytics
      const totalRequests = requests?.length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      
      // Calculate average resolution time (in hours)
      const completedWithTimes = requests?.filter(r => r.status === 'completed' && r.completed_at) || [];
      const avgResolutionMs = completedWithTimes.reduce((sum, req) => {
        const start = new Date(req.created_at).getTime();
        const end = new Date(req.completed_at).getTime();
        return sum + (end - start);
      }, 0) / (completedWithTimes.length || 1);
      const averageResolutionTime = Math.round(avgResolutionMs / (1000 * 60 * 60)); // Convert to hours

      // Count SLA breaches
      const slaBreaches = requests?.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < new Date() && r.status !== 'completed'
      ).length || 0;

      // Group by priority
      const requestsByPriority = requests?.reduce((acc, req) => {
        acc[req.priority] = (acc[req.priority] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }) || {};

      // Group by status
      const requestsByStatus = requests?.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }) || {};

      // Group by category
      const requestsByCategory = requests?.reduce((acc, req) => {
        const categoryName = req.maintenance_categories?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }) || {};

      // Daily requests for the last 7 days
      const dailyRequests = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayRequests = requests?.filter(r => {
          const createdAt = new Date(r.created_at);
          return createdAt >= dayStart && createdAt <= dayEnd;
        }).length || 0;

        dailyRequests.push({
          date: format(date, 'MMM dd'),
          count: dayRequests
        });
      }

      setAnalytics({
        totalRequests,
        completedRequests,
        averageResolutionTime,
        slaBreaches,
        requestsByPriority,
        requestsByStatus,
        requestsByCategory,
        dailyRequests
      });

    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async () => {
    if (!analytics) return;
    
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange: `${timeRange} days`,
      ...analytics
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report exported",
      description: "Analytics report has been downloaded",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const completionRate = analytics.totalRequests > 0 
    ? ((analytics.completedRequests / analytics.totalRequests) * 100).toFixed(1)
    : '0';

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-gray-400">Performance insights and metrics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48 bg-card border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-3xl font-bold text-white">{analytics.totalRequests}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completion Rate</p>
                <p className="text-3xl font-bold text-green-400">{completionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Resolution</p>
                <p className="text-3xl font-bold text-yellow-400">{analytics.averageResolutionTime}h</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">SLA Breaches</p>
                <p className="text-3xl font-bold text-red-400">{analytics.slaBreaches}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Breakdowns */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="priority">Priority</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Daily Request Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.dailyRequests.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300">{day.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-plaza-blue h-2 rounded-full" 
                          style={{ width: `${Math.max((day.count / Math.max(...analytics.dailyRequests.map(d => d.count))) * 100, 5)}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium w-8 text-right">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="mt-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Requests by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.requestsByPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        priority === 'urgent' ? 'bg-red-500' :
                        priority === 'high' ? 'bg-orange-500' :
                        priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-gray-300 capitalize">{priority}</span>
                    </div>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Requests by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.requestsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{status.replace('_', ' ')}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Requests by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.requestsByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-300">{category}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsPage;