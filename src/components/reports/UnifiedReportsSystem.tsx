import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Download,
  Eye,
  Filter,
  Wrench,
  Users,
  Clock,
  Star
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { extractCategoryName } from '@/utils/categoryUtils';

interface ReportData {
  totalRequests: number;
  completedRequests: number;
  avgCompletionTime: number;
  satisfactionRating: number;
  slaCompliance: number;
  categoryBreakdown: { [key: string]: number };
  priorityDistribution: { [key: string]: number };
  monthlyTrends: { month: string; requests: number; completed: number }[];
}

interface UnifiedReportsSystemProps {
  isAdminView?: boolean;
}

const UnifiedReportsSystem: React.FC<UnifiedReportsSystemProps> = ({ 
  isAdminView = false 
}) => {
  const { user, isAdmin, isStaff } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState<{from: Date | null, to: Date | null}>({
    from: null,
    to: null
  });

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, selectedPeriod]);

  const fetchReportData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Build query based on user role
      let query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          main_categories(name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // If not admin/staff, filter by user's requests
      if (!isAdmin && !isStaff) {
        query = query.eq('reported_by', user.id);
      }

      const { data: requests, error } = await query;
      
      if (error) throw error;

      if (requests) {
        // Process the data
        const completed = requests.filter(req => req.status === 'completed');
        
        // Calculate completion times
        const completionTimes = completed
          .filter(req => req.completed_at && req.created_at)
          .map(req => {
            const start = new Date(req.created_at).getTime();
            const end = new Date(req.completed_at!).getTime();
            return (end - start) / (1000 * 60 * 60); // hours
          });

        const avgCompletionTime = completionTimes.length > 0 
          ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
          : 0;

        // Category breakdown
        const categoryBreakdown: { [key: string]: number } = {};
        requests.forEach(req => {
          const categoryName = extractCategoryName(req.main_categories);
          categoryBreakdown[categoryName] = (categoryBreakdown[categoryName] || 0) + 1;
        });

        // Priority distribution
        const priorityDistribution: { [key: string]: number } = {};
        requests.forEach(req => {
          priorityDistribution[req.priority] = (priorityDistribution[req.priority] || 0) + 1;
        });

        // Monthly trends (simplified)
        const monthlyTrends = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthName = date.toLocaleString('default', { month: 'short' });
          
          const monthRequests = requests.filter(req => {
            const reqDate = new Date(req.created_at);
            return reqDate.getMonth() === date.getMonth() && reqDate.getFullYear() === date.getFullYear();
          });
          
          monthlyTrends.push({
            month: monthName,
            requests: monthRequests.length,
            completed: monthRequests.filter(req => req.status === 'completed').length
          });
        }

        // Fetch satisfaction data if available
        let satisfactionRating = 0;
        let slaCompliance = 0;

        try {
          let feedbackQuery = supabase
            .from('maintenance_request_feedback')
            .select('satisfaction_rating');

          if (!isAdmin && !isStaff) {
            feedbackQuery = feedbackQuery.eq('user_id', user.id);
          }

          const { data: feedback } = await feedbackQuery;
          
          if (feedback && feedback.length > 0) {
            const totalRating = feedback.reduce((sum, f) => sum + (f.satisfaction_rating || 0), 0);
            satisfactionRating = totalRating / feedback.length;
          }
        } catch (error) {
          console.log('No feedback data available');
        }

        // Calculate SLA compliance
        const slaMetRequests = completed.filter(req => {
          if (!req.sla_breach_at || !req.completed_at) return true;
          return new Date(req.completed_at) <= new Date(req.sla_breach_at);
        });
        slaCompliance = completed.length > 0 ? (slaMetRequests.length / completed.length) * 100 : 0;

        setReportData({
          totalRequests: requests.length,
          completedRequests: completed.length,
          avgCompletionTime,
          satisfactionRating,
          slaCompliance,
          categoryBreakdown,
          priorityDistribution,
          monthlyTrends
        });
      }
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    // Create CSV content
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Requests', reportData.totalRequests],
      ['Completed Requests', reportData.completedRequests],
      ['Average Completion Time (hours)', reportData.avgCompletionTime.toFixed(1)],
      ['Satisfaction Rating', reportData.satisfactionRating.toFixed(1)],
      ['SLA Compliance (%)', reportData.slaCompliance.toFixed(1)],
      [''],
      ['Category Breakdown', ''],
      ...Object.entries(reportData.categoryBreakdown).map(([cat, count]) => [cat, count]),
      [''],
      ['Priority Distribution', ''],
      ...Object.entries(reportData.priorityDistribution).map(([priority, count]) => [priority, count])
    ].map(row => row.join(',')).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maintenance_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report Exported! 📊",
      description: "Report has been downloaded successfully"
    });
  };

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
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">No report data found for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isAdminView ? 'System Reports' : 'My Reports'}
          </h2>
          <p className="text-muted-foreground">
            {isAdminView 
              ? 'Comprehensive system analytics and insights' 
              : 'Your maintenance request history and analytics'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.completedRequests} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.avgCompletionTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.satisfactionRating.toFixed(1)}</div>
            <div className="flex items-center mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < Math.round(reportData.satisfactionRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.slaCompliance.toFixed(1)}%</div>
            <Progress value={reportData.slaCompliance} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Category and Priority Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requests by Category</CardTitle>
            <CardDescription>Distribution across maintenance categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                  <div className="w-24">
                    <Progress 
                      value={(count / reportData.totalRequests) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Requests by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.priorityDistribution).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'default' : 'secondary'}>
                      {priority}
                    </Badge>
                    <span>{count}</span>
                  </div>
                  <div className="w-24">
                    <Progress 
                      value={(count / reportData.totalRequests) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Request volume and completion trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.monthlyTrends.map((trend) => (
              <div key={trend.month} className="flex items-center justify-between">
                <div className="font-medium">{trend.month}</div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {trend.requests} requests
                  </div>
                  <div className="text-sm text-green-600">
                    {trend.completed} completed
                  </div>
                  <div className="w-32">
                    <Progress 
                      value={trend.requests > 0 ? (trend.completed / trend.requests) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedReportsSystem;
