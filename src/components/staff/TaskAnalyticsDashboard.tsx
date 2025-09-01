
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Target,
  Calendar,
  Users,
  AlertTriangle,
  Award
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { extractCategoryName } from '@/utils/categoryUtils';

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  averageCompletionTime: number;
  completionRate: number;
  categoryBreakdown: Array<{
    category: string;
    completed: number;
    pending: number;
    avgTime: number;
  }>;
  dailyProgress: Array<{
    date: string;
    completed: number;
    started: number;
  }>;
  performanceScore: number;
}

export const TaskAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [viewType, setViewType] = useState<'personal' | 'team'>('personal');

  useEffect(() => {
    if (user) {
      fetchTaskAnalytics();
    }
  }, [user, timeRange, viewType]);

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

      // Fetch tasks based on view type
      const query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          main_categories(name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (viewType === 'personal') {
        query.eq('assigned_to', user.id);
      }

      const { data: tasks } = await query;

      if (tasks) {
        // Calculate basic metrics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
        
        // Calculate average completion time
        const completedWithTime = tasks.filter(t => 
          t.status === 'completed' && t.completed_at && t.created_at
        );
        const averageCompletionTime = completedWithTime.length > 0
          ? completedWithTime.reduce((sum, task) => {
              const duration = new Date(task.completed_at!).getTime() - new Date(task.created_at).getTime();
              return sum + (duration / (1000 * 60 * 60)); // Convert to hours
            }, 0) / completedWithTime.length
          : 0;

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Process category breakdown
        const categoryMap = new Map<string, {
          completed: number;
          pending: number;
          totalTime: number;
          completedCount: number;
        }>();

        tasks.forEach(task => {
          const categoryName = extractCategoryName(task.main_categories);
          
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, {
              completed: 0,
              pending: 0,
              totalTime: 0,
              completedCount: 0
            });
          }

          const category = categoryMap.get(categoryName)!;
          
          if (task.status === 'completed') {
            category.completed++;
            if (task.completed_at && task.created_at) {
              const duration = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
              category.totalTime += duration / (1000 * 60 * 60); // Convert to hours
              category.completedCount++;
            }
          } else {
            category.pending++;
          }
        });

        const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
          category,
          completed: data.completed,
          pending: data.pending,
          avgTime: data.completedCount > 0 ? data.totalTime / data.completedCount : 0
        }));

        // Generate daily progress (last 7 days)
        const dailyProgress = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          
          const dayTasks = tasks.filter(t => {
            const taskDate = new Date(t.created_at);
            return taskDate >= date && taskDate < nextDay;
          });
          
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            completed: dayTasks.filter(t => t.status === 'completed').length,
            started: dayTasks.filter(t => t.status === 'in_progress').length
          };
        }).reverse();

        // Calculate performance score (simplified)
        const slaCompliance = tasks.filter(t => 
          !t.sla_breach_at || (t.completed_at && new Date(t.completed_at) <= new Date(t.sla_breach_at))
        ).length;
        const performanceScore = totalTasks > 0 
          ? Math.round(((completionRate * 0.4) + ((slaCompliance / totalTasks) * 100 * 0.6)))
          : 0;

        setMetrics({
          totalTasks,
          completedTasks,
          activeTasks,
          averageCompletionTime,
          completionRate,
          categoryBreakdown,
          dailyProgress,
          performanceScore
        });
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
          <p className="text-muted-foreground">Performance insights and task management metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">My Tasks</SelectItem>
              <SelectItem value="team">Team Tasks</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {metrics && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {timeRange} period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Award className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.completionRate.toFixed(1)}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.activeTasks}</div>
                <p className="text-xs text-muted-foreground">
                  In progress
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
                  {metrics.averageCompletionTime.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  Per task
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Target className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.performanceScore}%
                </div>
                <Progress value={metrics.performanceScore} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Progress</CardTitle>
                <CardDescription>Task completion over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.dailyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#82ca9d" />
                    <Bar dataKey="started" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Task distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.categoryBreakdown.slice(0, 5).map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category.category}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{category.completed}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {category.avgTime.toFixed(1)}h avg
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={category.completed + category.pending > 0 ? 
                          (category.completed / (category.completed + category.pending)) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key insights from your task performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Strong Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      {metrics.completionRate > 80 ? 'Excellent' : 'Good'} completion rate of {metrics.completionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Time Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Average {metrics.averageCompletionTime.toFixed(1)} hours per task completion
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Growth Area</h4>
                    <p className="text-sm text-muted-foreground">
                      Focus on {metrics.categoryBreakdown[0]?.category || 'efficiency'} for improvement
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
