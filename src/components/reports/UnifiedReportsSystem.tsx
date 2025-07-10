import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Download, FileText, TrendingUp, Clock, CheckCircle, AlertTriangle, 
  Users, Calendar, Activity 
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface UnifiedReportData {
  summary: {
    totalRequests: number;
    completedRequests: number;
    pendingRequests: number;
    overdueRequests: number;
    activeStaff: number;
    averageResponseTime: number;
    slaCompliance: number;
  };
  charts: {
    requestsByStatus: any[];
    requestsByPriority: any[];
    dailyTrends: any[];
    categoryBreakdown: any[];
    staffPerformance: any[];
  };
  recommendations: string[];
}

interface UnifiedReportsSystemProps {
  isAdminView?: boolean;
}

const UnifiedReportsSystem: React.FC<UnifiedReportsSystemProps> = ({ isAdminView = false }) => {
  const [reportData, setReportData] = useState<UnifiedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const [reportType, setReportType] = useState('summary');
  const { toast } = useToast();
  const { user } = useAuth();

  // Real-time subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('reports-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests'
        },
        () => {
          console.log('Real-time update detected, refreshing reports...');
          fetchReportData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeRange]);

  useEffect(() => {
    fetchReportData();
  }, [timeRange, isAdminView]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const daysAgo = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), daysAgo));
      const endDate = endOfDay(new Date());

      // Build query based on user role
      let requestsQuery = supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories(name),
          profiles:reported_by(first_name, last_name),
          assignee:assigned_to(first_name, last_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // If not admin, filter to user's requests
      if (!isAdminView && user) {
        requestsQuery = requestsQuery.eq('reported_by', user.id);
      }

      const { data: requests, error: requestsError } = await requestsQuery;
      if (requestsError) throw requestsError;

      // Fetch staff data for admin view
      let staffData = [];
      if (isAdminView) {
        const { data: staff, error: staffError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['ops_supervisor', 'admin', 'field_staff']);
        
        if (staffError) throw staffError;
        staffData = staff || [];
      }

      // Calculate summary metrics
      const totalRequests = requests?.length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const overdueRequests = requests?.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < new Date() && r.status !== 'completed'
      ).length || 0;

      // Calculate average response time
      const completedWithTimes = requests?.filter(r => r.status === 'completed' && r.completed_at) || [];
      const avgResponseTime = completedWithTimes.length > 0
        ? completedWithTimes.reduce((sum, req) => {
            const start = new Date(req.created_at);
            const end = new Date(req.completed_at);
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
          }, 0) / completedWithTimes.length
        : 0;

      // Calculate SLA compliance
      const slaCompliance = completedRequests > 0
        ? Math.round(((completedRequests - overdueRequests) / completedRequests) * 100)
        : 100;

      // Prepare chart data
      const requestsByStatus = [
        { name: 'Pending', value: pendingRequests, color: '#ef4444' },
        { name: 'In Progress', value: requests?.filter(r => r.status === 'in_progress').length || 0, color: '#f59e0b' },
        { name: 'Completed', value: completedRequests, color: '#10b981' },
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
      for (let i = Math.min(daysAgo, 30); i >= 0; i--) {
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

      // Staff performance (admin only)
      const staffPerformance = isAdminView ? staffData.map(member => {
        const memberRequests = requests?.filter(r => r.assigned_to === member.id) || [];
        const completed = memberRequests.filter(r => r.status === 'completed').length;
        const pending = memberRequests.filter(r => r.status !== 'completed').length;
        
        return {
          name: `${member.first_name} ${member.last_name}`,
          completed,
          pending,
          total: completed + pending
        };
      }).sort((a, b) => b.total - a.total).slice(0, 10) : [];

      // Generate recommendations
      const recommendations = [];
      if (overdueRequests > 5) recommendations.push("High number of overdue tasks - consider staff reassignment");
      if (slaCompliance < 80) recommendations.push("SLA compliance below target - review processes");
      if (categoryBreakdown[0]?.value > 10) recommendations.push(`High volume of ${categoryBreakdown[0].name} issues - investigate root cause`);
      if (pendingRequests > totalRequests * 0.3) recommendations.push("High percentage of pending requests - check resource allocation");

      setReportData({
        summary: {
          totalRequests,
          completedRequests,
          pendingRequests,
          overdueRequests,
          activeStaff: staffData.length,
          averageResponseTime: Math.round(avgResponseTime * 10) / 10,
          slaCompliance
        },
        charts: {
          requestsByStatus,
          requestsByPriority,
          dailyTrends,
          categoryBreakdown,
          staffPerformance
        },
        recommendations
      });

    } catch (error: any) {
      toast({
        title: "Error fetching report data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    if (!reportData) return;

    const report = {
      title: isAdminView ? 'Administrative Report' : 'Staff Report',
      reportType: reportType === 'summary' ? 'Executive Summary' : 'Detailed Report',
      generatedAt: format(new Date(), 'PPpp'),
      timeRange: `${timeRange} days`,
      userRole: isAdminView ? 'Admin' : 'Staff',
      summary: reportData.summary,
      recommendations: reportData.recommendations,
      metadata: {
        generatedBy: user?.email,
        totalDataPoints: reportData.charts.dailyTrends.length
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isAdminView ? 'admin' : 'staff'}-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report generated",
      description: "Report has been downloaded successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdminView ? 'Administrative Reports' : 'Staff Reports'}
          </h1>
          <p className="text-muted-foreground">
            {isAdminView ? 'Comprehensive facility management analytics' : 'Your maintenance request analytics'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Executive Summary</SelectItem>
              <SelectItem value="detailed">Detailed Report</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={generateReport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{reportData.summary.totalRequests}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{reportData.summary.completedRequests}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{reportData.summary.pendingRequests}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-2xl font-bold">{reportData.summary.slaCompliance}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          {isAdminView && <TabsTrigger value="staff">Staff Performance</TabsTrigger>}
          {!isAdminView && <TabsTrigger value="performance">Performance</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Requests by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.charts.requestsByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {reportData.charts.requestsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requests by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.charts.requestsByPriority}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Request Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.charts.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed" />
                  <Line type="monotone" dataKey="pending" stroke="#EF4444" strokeWidth={2} name="Pending" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.charts.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdminView && (
          <TabsContent value="staff" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.charts.staffPerformance.map((staff, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-medium">{staff.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {staff.completed} completed
                        </Badge>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          {staff.pending} pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Recommendations */}
      {reportData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span className="text-orange-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedReportsSystem;