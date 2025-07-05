import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface ReportData {
  requestsByStatus: any[];
  requestsByPriority: any[];
  dailyTrends: any[];
  categoryBreakdown: any[];
  completionTimes: any[];
}

const StaffReportsPage = () => {
  const [reportData, setReportData] = useState<ReportData>({
    requestsByStatus: [],
    requestsByPriority: [],
    dailyTrends: [],
    categoryBreakdown: [],
    completionTimes: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const days = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Fetch maintenance requests
      const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories (name),
          profiles:reported_by (first_name, last_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Process data for charts
      const requestsByStatus = [
        { name: 'Pending', value: requests?.filter(r => r.status === 'pending').length || 0, color: '#ef4444' },
        { name: 'In Progress', value: requests?.filter(r => r.status === 'in_progress').length || 0, color: '#f59e0b' },
        { name: 'Completed', value: requests?.filter(r => r.status === 'completed').length || 0, color: '#10b981' },
        { name: 'Cancelled', value: requests?.filter(r => r.status === 'cancelled').length || 0, color: '#6b7280' },
      ];

      const requestsByPriority = [
        { name: 'Urgent', value: requests?.filter(r => r.priority === 'urgent').length || 0, color: '#dc2626' },
        { name: 'High', value: requests?.filter(r => r.priority === 'high').length || 0, color: '#ea580c' },
        { name: 'Medium', value: requests?.filter(r => r.priority === 'medium').length || 0, color: '#d97706' },
        { name: 'Low', value: requests?.filter(r => r.priority === 'low').length || 0, color: '#65a30d' },
      ];

      // Generate daily trends
      const dailyTrends = [];
      for (let i = days; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        const dayRequests = requests?.filter(r => {
          const requestDate = new Date(r.created_at);
          return requestDate >= dayStart && requestDate <= dayEnd;
        }) || [];

        dailyTrends.push({
          date: format(day, 'MMM dd'),
          total: dayRequests.length,
          completed: dayRequests.filter(r => r.status === 'completed').length,
          pending: dayRequests.filter(r => r.status === 'pending').length,
        });
      }

      // Category breakdown
      const categoryMap = new Map();
      requests?.forEach(request => {
        const category = request.maintenance_categories?.name || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }));

      // Completion times (mock data for demonstration)
      const completionTimes = [
        { timeRange: '< 1 hour', count: Math.floor(Math.random() * 20) + 5 },
        { timeRange: '1-4 hours', count: Math.floor(Math.random() * 30) + 10 },
        { timeRange: '4-24 hours', count: Math.floor(Math.random() * 25) + 8 },
        { timeRange: '1-3 days', count: Math.floor(Math.random() * 15) + 3 },
        { timeRange: '> 3 days', count: Math.floor(Math.random() * 10) + 1 },
      ];

      setReportData({
        requestsByStatus,
        requestsByPriority,
        dailyTrends,
        categoryBreakdown,
        completionTimes
      });

    } catch (error: any) {
      toast({
        title: "Error loading report data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    toast({
      title: "Downloading report",
      description: "Report will be downloaded shortly",
    });
    // Implement actual download logic here
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Staff Reports</h1>
          <p className="text-gray-400">Analyze maintenance and operational data</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={downloadReport} className="bg-plaza-blue hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-white">
                  {reportData.requestsByStatus.reduce((sum, item) => sum + item.value, 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-plaza-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {reportData.requestsByStatus.find(item => item.name === 'Completed')?.value || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-red-400">
                  {reportData.requestsByStatus.find(item => item.name === 'Pending')?.value || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Urgent</p>
                <p className="text-2xl font-bold text-orange-400">
                  {reportData.requestsByPriority.find(item => item.name === 'Urgent')?.value || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Requests by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.requestsByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {reportData.requestsByStatus.map((entry, index) => (
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
                <CardTitle className="text-white">Requests by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.requestsByPriority}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Daily Request Trends</CardTitle>
              <CardDescription>Request volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed" />
                  <Line type="monotone" dataKey="pending" stroke="#EF4444" strokeWidth={2} name="Pending" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Requests by Category</CardTitle>
              <CardDescription>Distribution of maintenance requests by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Completion Time Distribution</CardTitle>
              <CardDescription>How quickly requests are resolved</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.completionTimes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="timeRange" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffReportsPage;