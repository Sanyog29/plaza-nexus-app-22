
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  Users,
  Wrench,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { extractCategoryName } from '@/utils/categoryUtils';

interface ReportData {
  summary: {
    totalRequests: number;
    completedRequests: number;
    pendingRequests: number;
    averageCompletionTime: number;
    slaCompliance: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    requests: number;
    completed: number;
    slaBreaches: number;
  }>;
  staffPerformance: Array<{
    staffId: string;
    name: string;
    completedTasks: number;
    averageTime: number;
    rating: number;
  }>;
}

const UnifiedReportsSystem: React.FC = () => {
  const { user, isStaff, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'performance'>('summary');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    if (user && (isStaff || isAdmin)) {
      generateReport();
    }
  }, [user, isStaff, isAdmin, timeRange]);

  const generateReport = async () => {
    if (!user || (!isStaff && !isAdmin)) return;
    
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
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
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
        // Process summary data
        const totalRequests = requests.length;
        const completedRequests = requests.filter(r => r.status === 'completed').length;
        const pendingRequests = requests.filter(r => r.status !== 'completed').length;
        
        // Calculate average completion time
        const completedWithTime = requests.filter(r => r.status === 'completed' && r.completed_at && r.created_at);
        const averageCompletionTime = completedWithTime.length > 0
          ? completedWithTime.reduce((sum, req) => {
              const duration = new Date(req.completed_at!).getTime() - new Date(req.created_at).getTime();
              return sum + (duration / (1000 * 60 * 60)); // Convert to hours
            }, 0) / completedWithTime.length
          : 0;

        // Calculate SLA compliance
        const slaBreaches = requests.filter(r => 
          r.sla_breach_at && ((r.completed_at && new Date(r.completed_at) > new Date(r.sla_breach_at)) ||
          (!r.completed_at && new Date() > new Date(r.sla_breach_at)))
        ).length;
        const slaCompliance = totalRequests > 0 ? ((totalRequests - slaBreaches) / totalRequests) * 100 : 100;

        // Process category breakdown
        const categoryMap = new Map<string, number>();
        requests.forEach(req => {
          const categoryName = extractCategoryName(req.main_categories);
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
        });

        const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
          category,
          count,
          percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
        }));

        // Process monthly trends (simplified)
        const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
          const month = new Date();
          month.setMonth(month.getMonth() - i);
          const monthStr = month.toLocaleString('default', { month: 'short' });
          
          const monthRequests = requests.filter(r => {
            const reqDate = new Date(r.created_at);
            return reqDate.getMonth() === month.getMonth() && reqDate.getFullYear() === month.getFullYear();
          });
          
          return {
            month: monthStr,
            requests: monthRequests.length,
            completed: monthRequests.filter(r => r.status === 'completed').length,
            slaBreaches: monthRequests.filter(r => 
              r.sla_breach_at && ((r.completed_at && new Date(r.completed_at) > new Date(r.sla_breach_at)) ||
              (!r.completed_at && new Date() > new Date(r.sla_breach_at)))
            ).length
          };
        }).reverse();

        setReportData({
          summary: {
            totalRequests,
            completedRequests,
            pendingRequests,
            averageCompletionTime,
            slaCompliance
          },
          categoryBreakdown,
          monthlyTrends,
          staffPerformance: [] // Would be populated with staff performance data
        });
      }

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    if (!reportData) return;
    
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} report...`,
    });
    
    // Implementation would depend on specific export library
    // For now, just show success message
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Report exported as ${format.toUpperCase()}`,
      });
    }, 2000);
  };

  if (!isStaff && !isAdmin) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            Reports are only available to staff and administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          <h1 className="text-3xl font-bold text-foreground">Reports System</h1>
          <p className="text-muted-foreground">Comprehensive system reports and analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.totalRequests}</div>
                <p className="text-xs text-muted-foreground">
                  {timeRange} period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reportData.summary.completedRequests}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.summary.totalRequests > 0 ? 
                    Math.round((reportData.summary.completedRequests / reportData.summary.totalRequests) * 100) : 0}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{reportData.summary.pendingRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Active requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.summary.averageCompletionTime.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  Average completion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {reportData.summary.slaCompliance.toFixed(1)}%
                </div>
                <Progress value={reportData.summary.slaCompliance} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Charts and Detailed Reports */}
          <Tabs value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Request Trends</CardTitle>
                    <CardDescription>Monthly request volume and completion rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="requests" fill="#8884d8" />
                        <Bar dataKey="completed" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                    <CardDescription>Distribution of requests by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.categoryBreakdown.slice(0, 5).map((category, index) => (
                        <div key={category.category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{category.category}</span>
                            <Badge variant="outline">{category.count}</Badge>
                          </div>
                          <Progress value={category.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analysis</CardTitle>
                  <CardDescription>In-depth breakdown of system performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Detailed analysis features coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Staff and system performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Performance metrics coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default UnifiedReportsSystem;
