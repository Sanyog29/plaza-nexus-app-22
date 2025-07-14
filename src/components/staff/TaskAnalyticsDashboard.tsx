import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Filter,
  Download
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  avgCompletionTime: number;
  completionRate: number;
  onTimeCompletionRate: number;
}

interface TaskTrend {
  date: string;
  completed: number;
  created: number;
  overdue: number;
}

interface CategoryMetrics {
  category: string;
  total: number;
  completed: number;
  avgTime: number;
  completionRate: number;
}

export const TaskAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null);
  const [trends, setTrends] = useState<TaskTrend[]>([]);
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryMetrics[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    if (user) {
      fetchTaskAnalytics();
    }
  }, [user, timeRange]);

  const fetchTaskAnalytics = async () => {
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

      // Fetch maintenance requests
      const { data: maintenanceRequests } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories(name)
        `)
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

      if (maintenanceRequests) {
        // Calculate metrics
        const totalTasks = maintenanceRequests.length;
        const completedTasks = maintenanceRequests.filter(t => t.status === 'completed').length;
        const pendingTasks = maintenanceRequests.filter(t => t.status === 'in_progress' || t.status === 'pending').length;
        const overdueTasks = maintenanceRequests.filter(t => 
          t.sla_breach_at && new Date(t.sla_breach_at) < new Date() && t.status !== 'completed'
        ).length;

        // Calculate average completion time
        const completedWithTimes = maintenanceRequests.filter(t => 
          t.status === 'completed' && t.completed_at && t.created_at
        );
        
        const avgCompletionTime = completedWithTimes.length > 0
          ? completedWithTimes.reduce((sum, task) => {
              const completionTime = new Date(task.completed_at!).getTime() - new Date(task.created_at).getTime();
              return sum + (completionTime / (1000 * 60 * 60)); // Convert to hours
            }, 0) / completedWithTimes.length
          : 0;

        // Calculate on-time completion rate
        const onTimeCompletions = completedWithTimes.filter(t => 
          !t.sla_breach_at || new Date(t.completed_at!) <= new Date(t.sla_breach_at)
        ).length;

        setMetrics({
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          avgCompletionTime,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          onTimeCompletionRate: completedTasks > 0 ? (onTimeCompletions / completedTasks) * 100 : 0
        });

        // Calculate trends (daily data for the selected period)
        const trendData: TaskTrend[] = [];
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        for (let i = 0; i < Math.min(daysDiff, 30); i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayTasks = maintenanceRequests.filter(t => 
            t.created_at.split('T')[0] === dateStr
          );
          
          const dayCompleted = maintenanceRequests.filter(t => 
            t.completed_at && t.completed_at.split('T')[0] === dateStr
          );
          
          const dayOverdue = maintenanceRequests.filter(t => 
            t.sla_breach_at && t.sla_breach_at.split('T')[0] === dateStr &&
            (!t.completed_at || new Date(t.completed_at) > new Date(t.sla_breach_at))
          );

          trendData.push({
            date: dateStr,
            created: dayTasks.length,
            completed: dayCompleted.length,
            overdue: dayOverdue.length
          });
        }
        setTrends(trendData);

        // Calculate category metrics
        const categoryMap = new Map<string, any[]>();
        maintenanceRequests.forEach(task => {
          const category = task.maintenance_categories?.name || 'Uncategorized';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
          }
          categoryMap.get(category)!.push(task);
        });

        const categoryStats: CategoryMetrics[] = Array.from(categoryMap.entries()).map(([category, tasks]) => {
          const completed = tasks.filter(t => t.status === 'completed');
          const avgTime = completed.length > 0
            ? completed.reduce((sum, task) => {
                if (task.completed_at && task.created_at) {
                  const time = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
                  return sum + (time / (1000 * 60 * 60));
                }
                return sum;
              }, 0) / completed.length
            : 0;

          return {
            category,
            total: tasks.length,
            completed: completed.length,
            avgTime,
            completionRate: (completed.length / tasks.length) * 100
          };
        });

        setCategoryMetrics(categoryStats.sort((a, b) => b.total - a.total));
      }

    } catch (error) {
      console.error('Error fetching task analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load task analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!metrics || !trends.length) return;
    
    const data = {
      metrics,
      trends,
      categoryMetrics,
      exportedAt: new Date().toISOString(),
      timeRange
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Task analytics exported successfully"
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
          <h1 className="text-3xl font-bold text-foreground">Task Analytics</h1>
          <p className="text-muted-foreground">Detailed analysis of your task performance</p>
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
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.pendingTasks || 0} pending, {metrics?.completedTasks || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.completionRate ? `${metrics.completionRate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.completedTasks || 0} of {metrics?.totalTasks || 0} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.avgCompletionTime ? `${metrics.avgCompletionTime.toFixed(1)}h` : '0h'}
            </div>
            <p className="text-xs text-muted-foreground">
              Time from assignment to completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.overdueTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks past their SLA deadline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>On-Time Performance</CardTitle>
            <CardDescription>Tasks completed within SLA timeframes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">On-Time Completion Rate</span>
                <span className="text-lg font-bold">
                  {metrics?.onTimeCompletionRate ? `${metrics.onTimeCompletionRate.toFixed(1)}%` : '0%'}
                </span>
              </div>
              <Progress 
                value={metrics?.onTimeCompletionRate || 0} 
                className="h-3"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-green-600 font-semibold">
                    {metrics && metrics.completedTasks ? 
                      Math.round((metrics.onTimeCompletionRate / 100) * metrics.completedTasks) : 0
                    }
                  </div>
                  <div className="text-muted-foreground">On-time</div>
                </div>
                <div>
                  <div className="text-red-600 font-semibold">
                    {metrics && metrics.completedTasks ? 
                      metrics.completedTasks - Math.round((metrics.onTimeCompletionRate / 100) * metrics.completedTasks) : 0
                    }
                  </div>
                  <div className="text-muted-foreground">Late</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Current task status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="font-semibold">{metrics?.completedTasks || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="font-semibold">{metrics?.pendingTasks || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Overdue</span>
                  </div>
                  <span className="font-semibold">{metrics?.overdueTasks || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
          <CardDescription>Task completion metrics across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryMetrics.length > 0 ? (
              categoryMetrics.map((category, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{category.category}</h4>
                    <Badge variant="outline">
                      {category.completionRate.toFixed(1)}% completion
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">{category.total}</div>
                      <div className="text-muted-foreground">Total tasks</div>
                    </div>
                    <div>
                      <div className="font-semibold text-green-600">{category.completed}</div>
                      <div className="text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="font-semibold text-blue-600">
                        {category.avgTime.toFixed(1)}h
                      </div>
                      <div className="text-muted-foreground">Avg time</div>
                    </div>
                  </div>
                  <Progress value={category.completionRate} className="h-2 mt-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No category data available for the selected time period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trends */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Task Trends</CardTitle>
            <CardDescription>Daily task activity over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {trends.reduce((sum, day) => sum + day.created, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Tasks Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {trends.reduce((sum, day) => sum + day.completed, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Tasks Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {trends.reduce((sum, day) => sum + day.overdue, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Tasks Overdue</div>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Daily average: {(trends.reduce((sum, day) => sum + day.completed, 0) / trends.length).toFixed(1)} tasks completed
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};