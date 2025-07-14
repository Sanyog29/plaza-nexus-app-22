import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Calendar,
  Award,
  Activity
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface PerformanceMetrics {
  tasksCompleted: number;
  avgResponseTime: number;
  qualityScore: number;
  slaCompliance: number;
  productivityScore: number;
  efficiency: number;
  weeklyTrend: number;
  monthlyTrend: number;
}

interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  tasksByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  tasksByCategory: Record<string, number>;
}

interface SLAMetrics {
  totalRequests: number;
  onTimeCompletion: number;
  breachedSLA: number;
  avgResolutionTime: number;
  criticalBreaches: number;
}

export const StaffPerformanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user, timeRange]);

  const fetchPerformanceData = async () => {
    if (!user) return;
    
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
      }

      // Fetch task analytics first
      const { data: maintenanceRequests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('assigned_to', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch task assignments
      const { data: taskAssignments } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('assigned_to', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Calculate basic metrics from data
      const totalTasks = maintenanceRequests?.length || 0;
      const completedTasks = maintenanceRequests?.filter(r => r.status === 'completed').length || 0;
      const avgResponseTime = completedTasks > 0 
        ? maintenanceRequests?.filter(r => r.status === 'completed' && r.completed_at && r.created_at)
            .reduce((avg, task) => {
              const responseTime = new Date(task.completed_at!).getTime() - new Date(task.created_at).getTime();
              return avg + (responseTime / (1000 * 60 * 60)); // Convert to hours
            }, 0) / completedTasks || 0
        : 0;

      // Calculate SLA compliance
      const onTimeRequests = maintenanceRequests?.filter(r => 
        r.completed_at && r.sla_breach_at && 
        new Date(r.completed_at) <= new Date(r.sla_breach_at)
      ) || [];
      const slaCompliance = totalTasks > 0 ? (onTimeRequests.length / totalTasks) * 100 : 100;

      // Set calculated metrics
      setMetrics({
        tasksCompleted: totalTasks,
        avgResponseTime,
        qualityScore: Math.min(95, 80 + (slaCompliance > 90 ? 15 : slaCompliance > 80 ? 10 : 5)), // Calculated quality score
        slaCompliance,
        productivityScore: Math.min(100, (totalTasks * 10) + (slaCompliance > 90 ? 20 : 0)), // Calculated productivity
        efficiency: Math.min(100, slaCompliance + (avgResponseTime < 4 ? 15 : avgResponseTime < 8 ? 10 : 0)), // Calculated efficiency
        weeklyTrend: 12, // Would be calculated from historical data
        monthlyTrend: 8
      });

      // Process task analytics
      if (maintenanceRequests) {
        const completedTasks = maintenanceRequests.filter(r => r.status === 'completed');
        const overdueTasks = maintenanceRequests.filter(r => 
          r.sla_breach_at && new Date(r.sla_breach_at) < new Date() && r.status !== 'completed'
        );

        const tasksByPriority = maintenanceRequests.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {} as any);

        setTaskAnalytics({
          totalTasks: maintenanceRequests.length,
          completedTasks: completedTasks.length,
          overdueTasks: overdueTasks.length,
          averageCompletionTime: completedTasks.length > 0 
            ? completedTasks.reduce((avg, task) => {
                if (task.completed_at && task.created_at) {
                  const completionTime = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
                  return avg + (completionTime / (1000 * 60 * 60)); // Convert to hours
                }
                return avg;
              }, 0) / completedTasks.length
            : 0,
          tasksByPriority: {
            urgent: tasksByPriority.urgent || 0,
            high: tasksByPriority.high || 0,
            medium: tasksByPriority.medium || 0,
            low: tasksByPriority.low || 0
          },
          tasksByCategory: {}
        });
      }

      // Process SLA metrics
      const slaOnTimeRequests = maintenanceRequests?.filter(r => 
        r.completed_at && r.sla_breach_at && 
        new Date(r.completed_at) <= new Date(r.sla_breach_at)
      ) || [];

      const breachedRequests = maintenanceRequests?.filter(r => 
        r.sla_breach_at && (
          (r.completed_at && new Date(r.completed_at) > new Date(r.sla_breach_at)) ||
          (!r.completed_at && new Date() > new Date(r.sla_breach_at))
        )
      ) || [];

      setSlaMetrics({
        totalRequests: maintenanceRequests?.length || 0,
        onTimeCompletion: slaOnTimeRequests.length,
        breachedSLA: breachedRequests.length,
        avgResolutionTime: avgResponseTime,
        criticalBreaches: breachedRequests.filter(r => r.priority === 'urgent').length
      });

    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceRating = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-600' };
    if (score >= 80) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' };
    if (score >= 70) return { label: 'Average', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (score >= 60) return { label: 'Below Average', color: 'bg-orange-500', textColor: 'text-orange-600' };
    return { label: 'Needs Improvement', color: 'bg-red-500', textColor: 'text-red-600' };
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
          <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
          <p className="text-muted-foreground">Track your productivity and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.tasksCompleted || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{metrics?.weeklyTrend || 0}% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.avgResponseTime ? `${metrics.avgResponseTime.toFixed(1)}h` : '0h'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              -{Math.abs(metrics?.monthlyTrend || 0)}% improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.qualityScore ? `${metrics.qualityScore.toFixed(0)}%` : '0%'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Target className="h-3 w-3 mr-1" />
              {(metrics?.qualityScore || 0) >= 85 ? 'Above target' : 'Below target'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics?.slaCompliance ? `${metrics.slaCompliance.toFixed(0)}%` : '0%'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {(metrics?.slaCompliance || 0) >= 95 ? (
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
              )}
              {(metrics?.slaCompliance || 0) >= 95 ? 'Excellent' : 'Needs attention'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
          <TabsTrigger value="sla">SLA Monitoring</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Your overall performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics && Object.entries({
                  'Efficiency': metrics.efficiency,
                  'Quality': metrics.qualityScore,
                  'Productivity': metrics.productivityScore,
                  'SLA Compliance': metrics.slaCompliance
                }).map(([label, value]) => {
                  const rating = getPerformanceRating(value);
                  return (
                    <div key={label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{value.toFixed(0)}%</span>
                          <Badge variant="secondary" className={rating.textColor}>
                            {rating.label}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {taskAnalytics?.completedTasks || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {taskAnalytics?.overdueTasks || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Overdue Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {slaMetrics?.onTimeCompletion || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">On-time Delivery</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {slaMetrics?.criticalBreaches || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Critical Breaches</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Analysis</CardTitle>
                <CardDescription>Breakdown of your task performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Tasks</span>
                    <span className="font-semibold">{taskAnalytics?.totalTasks || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Completed</span>
                    <span className="font-semibold text-green-600">
                      {taskAnalytics?.completedTasks || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Completion Rate</span>
                    <span className="font-semibold">
                      {taskAnalytics?.totalTasks 
                        ? `${((taskAnalytics.completedTasks / taskAnalytics.totalTasks) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Completion Time</span>
                    <span className="font-semibold">
                      {taskAnalytics?.averageCompletionTime 
                        ? `${taskAnalytics.averageCompletionTime.toFixed(1)}h`
                        : '0h'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
                <CardDescription>Distribution of task priorities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {taskAnalytics && Object.entries(taskAnalytics.tasksByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          priority === 'urgent' ? 'bg-red-500' :
                          priority === 'high' ? 'bg-orange-500' :
                          priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="capitalize">{priority}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SLA Performance Monitoring</CardTitle>
              <CardDescription>Track your service level agreement compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {slaMetrics?.onTimeCompletion || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">On-time Completions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {slaMetrics?.breachedSLA || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">SLA Breaches</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {slaMetrics?.avgResolutionTime ? `${slaMetrics.avgResolutionTime.toFixed(1)}h` : '0h'}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Resolution Time</div>
                </div>
              </div>
              
              {slaMetrics && slaMetrics.totalRequests > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">SLA Compliance Rate</span>
                    <span className="text-sm">
                      {((slaMetrics.onTimeCompletion / slaMetrics.totalRequests) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={(slaMetrics.onTimeCompletion / slaMetrics.totalRequests) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Insights</CardTitle>
              <CardDescription>Personal productivity analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Performance Trends</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Weekly Trend</span>
                        <Badge variant={metrics && metrics.weeklyTrend > 0 ? 'default' : 'destructive'}>
                          {metrics && metrics.weeklyTrend > 0 ? '+' : ''}{metrics?.weeklyTrend || 0}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metrics && metrics.weeklyTrend > 0 
                          ? 'Performance improving compared to last week'
                          : 'Consider reviewing your workflow efficiency'
                        }
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Monthly Trend</span>
                        <Badge variant={metrics && metrics.monthlyTrend > 0 ? 'default' : 'destructive'}>
                          {metrics && metrics.monthlyTrend > 0 ? '+' : ''}{metrics?.monthlyTrend || 0}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metrics && metrics.monthlyTrend > 0 
                          ? 'Consistent improvement over the month'
                          : 'Focus on task prioritization and time management'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {metrics && metrics.slaCompliance < 95 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium">Improve SLA Compliance</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Focus on meeting deadlines to improve your SLA compliance rate
                        </p>
                      </div>
                    )}
                    
                    {metrics && metrics.efficiency < 80 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Enhance Efficiency</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Consider using task automation and better time management techniques
                        </p>
                      </div>
                    )}

                    {metrics && metrics.qualityScore >= 90 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Excellent Quality</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Great job maintaining high quality standards!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};