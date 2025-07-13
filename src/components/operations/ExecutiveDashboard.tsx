import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Download,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  Brain
} from 'lucide-react';

interface ExecutiveReport {
  id: string;
  report_type: string;
  report_period: string;
  generated_at: string;
  report_data: any;
  ai_insights: any;
  file_url?: string;
  generated_by?: string;
  is_automated: boolean;
}

interface KPISummary {
  category: string;
  current: number;
  target: number;
  change: number;
  status: 'good' | 'warning' | 'critical';
}

export const ExecutiveDashboard: React.FC = () => {
  const [reports, setReports] = useState<ExecutiveReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  // Mock KPI data - in real implementation, this would come from database
  const kpiSummary: KPISummary[] = [
    { category: 'Operational Efficiency', current: 87.2, target: 90, change: 2.3, status: 'good' },
    { category: 'Cost Management', current: 92.5, target: 85, change: -4.1, status: 'good' },
    { category: 'Asset Utilization', current: 78.9, target: 80, change: -1.2, status: 'warning' },
    { category: 'Compliance Score', current: 96.1, target: 95, change: 1.5, status: 'good' },
    { category: 'Staff Productivity', current: 83.4, target: 85, change: -2.1, status: 'warning' },
    { category: 'Emergency Response', current: 94.7, target: 95, change: 0.8, status: 'good' }
  ];

  const aiInsights = [
    {
      type: 'cost_optimization',
      title: 'Energy Cost Reduction Opportunity',
      description: 'HVAC optimization could reduce energy costs by 15% ($18.5K annually)',
      priority: 'high',
      confidence: 91
    },
    {
      type: 'predictive_maintenance',
      title: 'Equipment Failure Prevention',
      description: '3 critical assets require immediate attention to prevent failures',
      priority: 'critical',
      confidence: 87
    },
    {
      type: 'resource_optimization',
      title: 'Staff Allocation Efficiency',
      description: 'Redistribution of cleaning staff could improve efficiency by 12%',
      priority: 'medium',
      confidence: 76
    },
    {
      type: 'compliance',
      title: 'Upcoming Compliance Deadline',
      description: 'Fire safety inspection due in 14 days - preparation recommended',
      priority: 'medium',
      confidence: 95
    }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('executive_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching executive reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch executive reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string, period: string) => {
    setGenerating(true);
    try {
      // In a real implementation, this would trigger report generation
      const reportData = {
        summary: {
          total_requests: 1247,
          completed_requests: 1189,
          avg_resolution_time: 2.3,
          cost_savings: 24500,
          efficiency_improvement: 12.5
        },
        kpis: kpiSummary,
        trends: {
          costs: { trend: 'down', percentage: 8.2 },
          efficiency: { trend: 'up', percentage: 4.7 },
          satisfaction: { trend: 'stable', percentage: 0.3 }
        }
      };

      const { data, error } = await supabase
        .from('executive_reports')
        .insert({
          report_type: reportType,
          report_period: period,
          report_data: reportData as any,
          ai_insights: aiInsights as any,
          is_automated: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${reportType} report generated successfully`,
      });

      fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-500/10';
      case 'warning':
        return 'text-yellow-600 bg-yellow-500/10';
      case 'critical':
        return 'text-red-600 bg-red-500/10';
      default:
        return 'text-gray-600 bg-gray-500/10';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">$124.5K</p>
                <p className="text-xs text-green-600">+8.2% this month</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency Score</p>
                <p className="text-2xl font-bold text-blue-600">87.2%</p>
                <p className="text-xs text-blue-600">+2.3% improvement</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Staff Utilization</p>
                <p className="text-2xl font-bold text-purple-600">94.1%</p>
                <p className="text-xs text-purple-600">Optimal range</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-2xl font-bold text-orange-600">96.1%</p>
                <p className="text-xs text-orange-600">+1.5% this period</p>
              </div>
              <Award className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Executive Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPI Dashboard</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">1,247</p>
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">95.3%</p>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Operational Efficiency</span>
                      <span className="text-sm font-medium">87.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '87.2%'}}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cost Management</span>
                      <span className="text-sm font-medium">92.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '92.5%'}}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Resource Utilization</span>
                      <span className="text-sm font-medium">78.9%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{width: '78.9%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Resource Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: 'Maintenance', percentage: 35, color: 'bg-blue-500' },
                    { category: 'Cleaning', percentage: 28, color: 'bg-green-500' },
                    { category: 'Security', percentage: 20, color: 'bg-purple-500' },
                    { category: 'Utilities', percentage: 12, color: 'bg-orange-500' },
                    { category: 'Other', percentage: 5, color: 'bg-gray-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiSummary.map((kpi, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-sm">{kpi.category}</h3>
                      <Badge className={getKPIStatusColor(kpi.status)}>
                        {kpi.status}
                      </Badge>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold">{kpi.current}%</p>
                        <p className="text-xs text-muted-foreground">Target: {kpi.target}%</p>
                      </div>
                      <div className={`text-sm font-medium ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(insight.priority)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{insight.title}</h3>
                          <Badge variant="outline">
                            {insight.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <Badge variant={insight.priority === 'critical' ? 'destructive' : 'secondary'}>
                            {insight.priority} priority
                          </Badge>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Executive Reports</h2>
            <div className="flex gap-2">
              <Button 
                onClick={() => generateReport('monthly', 'monthly')}
                disabled={generating}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Generate Monthly
              </Button>
              <Button 
                variant="outline"
                onClick={() => generateReport('quarterly', 'quarterly')}
                disabled={generating}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Quarterly
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">
                          {report.report_type} Report
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.generated_at).toLocaleDateString()} • {report.report_period}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No reports generated yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Operational Performance', description: 'KPIs, efficiency metrics, trends' },
                    { name: 'Financial Summary', description: 'Cost analysis, savings, ROI' },
                    { name: 'Compliance Report', description: 'SLA adherence, audit results' },
                    { name: 'Strategic Overview', description: 'High-level insights, recommendations' }
                  ].map((template, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Use Template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};