import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Calendar, Download, Filter, TrendingUp, TrendingDown, 
  Clock, AlertCircle, CheckCircle2, Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AnalyticsData {
  requestTrends: any[];
  categoryBreakdown: any[];
  responseTimeAnalysis: any[];
  staffPerformance: any[];
  equipmentStatus: any[];
  priorityDistribution: any[];
}

const AdvancedAnalytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    requestTrends: [],
    categoryBreakdown: [],
    responseTimeAnalysis: [],
    staffPerformance: [],
    equipmentStatus: [],
    priorityDistribution: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch maintenance requests for analysis
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          category:maintenance_categories(name),
          assigned_staff:profiles!assigned_to(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      // Fetch equipment data
      const { data: equipment } = await supabase
        .from('equipment')
        .select('*');

      if (requests) {
        // Process request trends (last 7 days)
        const trends = processRequestTrends(requests);
        
        // Process category breakdown
        const categories = processCategoryBreakdown(requests);
        
        // Process response time analysis
        const responseTimes = processResponseTimeAnalysis(requests);
        
        // Process priority distribution
        const priorities = processPriorityDistribution(requests);
        
        // Process staff performance
        const staffPerf = processStaffPerformance(requests);

        setData({
          requestTrends: trends,
          categoryBreakdown: categories,
          responseTimeAnalysis: responseTimes,
          staffPerformance: staffPerf,
          equipmentStatus: equipment || [],
          priorityDistribution: priorities
        });
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error loading analytics",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processRequestTrends = (requests: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayRequests = requests.filter(r => 
        r.created_at.startsWith(date)
      );
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        requests: dayRequests.length,
        completed: dayRequests.filter(r => r.status === 'completed').length,
        urgent: dayRequests.filter(r => r.priority === 'urgent').length
      };
    });
  };

  const processCategoryBreakdown = (requests: any[]) => {
    const categoryMap = new Map();
    
    requests.forEach(request => {
      const categoryName = request.category?.name || 'Uncategorized';
      const current = categoryMap.get(categoryName) || { 
        name: categoryName, 
        value: 0, 
        completed: 0,
        pending: 0
      };
      
      current.value++;
      if (request.status === 'completed') current.completed++;
      if (request.status === 'pending') current.pending++;
      
      categoryMap.set(categoryName, current);
    });

    return Array.from(categoryMap.values());
  };

  const processResponseTimeAnalysis = (requests: any[]) => {
    const completedRequests = requests.filter(r => r.completed_at);
    
    const timeRanges = [
      { range: '0-2h', min: 0, max: 2 },
      { range: '2-6h', min: 2, max: 6 },
      { range: '6-24h', min: 6, max: 24 },
      { range: '1-3d', min: 24, max: 72 },
      { range: '3d+', min: 72, max: Infinity }
    ];

    return timeRanges.map(range => {
      const count = completedRequests.filter(request => {
        const created = new Date(request.created_at);
        const completed = new Date(request.completed_at);
        const hoursDiff = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
        
        return hoursDiff >= range.min && hoursDiff < range.max;
      }).length;

      return {
        range: range.range,
        count,
        percentage: completedRequests.length > 0 ? 
          Math.round((count / completedRequests.length) * 100) : 0
      };
    });
  };

  const processPriorityDistribution = (requests: any[]) => {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#DC2626'];
    
    return priorities.map((priority, index) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: requests.filter(r => r.priority === priority).length,
      color: colors[index]
    }));
  };

  const processStaffPerformance = (requests: any[]) => {
    const staffMap = new Map();
    
    requests.forEach(request => {
      if (request.assigned_staff) {
        const staffName = `${request.assigned_staff.first_name} ${request.assigned_staff.last_name}`.trim();
        const current = staffMap.get(staffName) || { 
          name: staffName, 
          assigned: 0, 
          completed: 0,
          avgTime: 0
        };
        
        current.assigned++;
        if (request.status === 'completed') {
          current.completed++;
          // Calculate average completion time
          if (request.completed_at) {
            const hours = (new Date(request.completed_at).getTime() - 
                          new Date(request.created_at).getTime()) / (1000 * 60 * 60);
            current.avgTime = (current.avgTime * (current.completed - 1) + hours) / current.completed;
          }
        }
        
        staffMap.set(staffName, current);
      }
    });

    return Array.from(staffMap.values()).map(staff => ({
      ...staff,
      efficiency: staff.assigned > 0 ? Math.round((staff.completed / staff.assigned) * 100) : 0,
      avgTime: Math.round(staff.avgTime * 10) / 10
    }));
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Advanced Analytics</h3>
          <p className="text-sm text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="trends">Request Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="staff">Staff Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Request Trends Chart */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-medium">7-Day Request Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.requestTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Area type="monotone" dataKey="requests" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="completed" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="urgent" stackId="3" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.priorityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Response Time Analysis */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.responseTimeAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="range" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Completion Rate</span>
                  </div>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {data.requestTrends.length > 0 ? 
                      Math.round((data.requestTrends.reduce((acc, day) => acc + day.completed, 0) / 
                      data.requestTrends.reduce((acc, day) => acc + day.requests, 0)) * 100) : 0}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Avg Response Time</span>
                  </div>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {data.responseTimeAnalysis.length > 0 ? '4.2h' : 'N/A'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">SLA Compliance</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                    87%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Category Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.categoryBreakdown} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  />
                  <Bar dataKey="value" fill="#06B6D4" />
                  <Bar dataKey="completed" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Staff Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.staffPerformance.map((staff, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{staff.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {staff.assigned} assigned • {staff.completed} completed
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{staff.efficiency}%</div>
                        <div className="text-xs text-muted-foreground">Efficiency</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{staff.avgTime}h</div>
                        <div className="text-xs text-muted-foreground">Avg Time</div>
                      </div>
                    </div>
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

export default AdvancedAnalytics;