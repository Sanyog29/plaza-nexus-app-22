import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Calendar, Users, Clock, AlertTriangle } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface ReportData {
  totalRequests: number;
  overdueTasks: number;
  activeStaff: number;
  averageResponseTime: number;
  topIssues: { category: string; count: number }[];
  staffPerformance: { name: string; completed: number; pending: number }[];
  slaCompliance: number;
}

const AdminReportsPage = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [reportType, setReportType] = useState('summary');
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const daysAgo = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), daysAgo));
      const endDate = endOfDay(new Date());

      // Fetch requests
      const { data: requests, error: requestsError } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories(name),
          profiles:assigned_to(first_name, last_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (requestsError) throw requestsError;

      // Fetch staff
      const { data: staff, error: staffError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['ops_supervisor', 'admin']);

      if (staffError) throw staffError;

      // Calculate metrics
      const totalRequests = requests?.length || 0;
      const overdueTasks = requests?.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < new Date() && r.status !== 'completed'
      ).length || 0;

      const activeStaff = staff?.length || 0;

      // Calculate average response time (mock data for now)
      const averageResponseTime = 4.5; // hours

      // Top issues by category
      const categoryCount = requests?.reduce((acc, req) => {
        const category = req.maintenance_categories?.name || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }) || {};

      const topIssues = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Staff performance
      const staffPerformance = staff?.map(member => {
        const memberRequests = requests?.filter(r => r.assigned_to === member.id) || [];
        const completed = memberRequests.filter(r => r.status === 'completed').length;
        const pending = memberRequests.filter(r => r.status !== 'completed').length;
        
        return {
          name: `${member.first_name} ${member.last_name}`,
          completed,
          pending
        };
      }) || [];

      // SLA compliance
      const completedRequests = requests?.filter(r => r.status === 'completed') || [];
      const onTimeCompleted = completedRequests.filter(r => 
        !r.sla_breach_at || new Date(r.completed_at) <= new Date(r.sla_breach_at)
      ).length;
      const slaCompliance = completedRequests.length > 0 
        ? Math.round((onTimeCompleted / completedRequests.length) * 100)
        : 100;

      setReportData({
        totalRequests,
        overdueTasks,
        activeStaff,
        averageResponseTime,
        topIssues,
        staffPerformance,
        slaCompliance
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
      reportType: reportType === 'summary' ? 'Executive Summary' : 'Detailed Report',
      generatedAt: format(new Date(), 'PPpp'),
      timeRange: `${timeRange} days`,
      data: reportData,
      recommendations: [
        reportData.overdueTasks > 5 ? "High number of overdue tasks - consider staff reassignment" : null,
        reportData.slaCompliance < 80 ? "SLA compliance below target - review processes" : null,
        reportData.topIssues[0]?.count > 10 ? `High volume of ${reportData.topIssues[0].category} issues - investigate root cause` : null
      ].filter(Boolean)
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Documentation</h1>
          <p className="text-gray-400">Generate comprehensive facility management reports</p>
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
          
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48 bg-card border-gray-700">
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

      {/* Report Summary */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5" />
            Report Summary ({timeRange} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{reportData.totalRequests}</div>
              <div className="text-sm text-gray-400">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{reportData.overdueTasks}</div>
              <div className="text-sm text-gray-400">Overdue Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{reportData.activeStaff}</div>
              <div className="text-sm text-gray-400">Active Staff</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{reportData.averageResponseTime}h</div>
              <div className="text-sm text-gray-400">Avg Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Issues */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5" />
              Top Issues by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-red-500' :
                      index === 1 ? 'bg-orange-500' :
                      index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-gray-300">{issue.category}</span>
                  </div>
                  <Badge variant="outline" className="text-white">
                    {issue.count} issues
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              Staff Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.staffPerformance.slice(0, 5).map((staff, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">{staff.name}</span>
                    <div className="flex gap-2">
                      <Badge className="bg-green-900 text-green-300">
                        {staff.completed} completed
                      </Badge>
                      <Badge className="bg-yellow-900 text-yellow-300">
                        {staff.pending} pending
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${staff.completed + staff.pending > 0 
                          ? (staff.completed / (staff.completed + staff.pending)) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Compliance */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            SLA Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-300">Overall Compliance Rate</span>
            <Badge className={`${
              reportData.slaCompliance >= 90 ? 'bg-green-900 text-green-300' :
              reportData.slaCompliance >= 80 ? 'bg-yellow-900 text-yellow-300' :
              'bg-red-900 text-red-300'
            }`}>
              {reportData.slaCompliance}%
            </Badge>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${
                reportData.slaCompliance >= 90 ? 'bg-green-500' :
                reportData.slaCompliance >= 80 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${reportData.slaCompliance}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            {reportData.slaCompliance >= 90 ? 'Excellent performance' :
             reportData.slaCompliance >= 80 ? 'Good performance, room for improvement' :
             'Performance needs attention'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReportsPage;