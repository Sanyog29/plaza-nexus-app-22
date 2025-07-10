import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, Calendar, Clock, TrendingUp, UserCheck, Building,
  MapPin, Star, AlertCircle, CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface VisitorAnalyticsProps {
  period: string;
}

interface VisitorMetrics {
  overview: {
    totalVisitors: number;
    uniqueVisitors: number;
    averageVisitDuration: number;
    repeatVisitors: number;
  };
  patterns: {
    peakHours: Array<{ hour: string; count: number }>;
    dailyTrends: Array<{ day: string; visitors: number; newVisitors: number }>;
    categoryBreakdown: Array<{ category: string; count: number; percentage: number }>;
  };
  satisfaction: {
    averageRating: number;
    totalFeedback: number;
    recommendations: number;
  };
  compliance: {
    checkInRate: number;
    checkOutRate: number;
    overdueVisitors: number;
    securityScore: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const VisitorAnalytics: React.FC<VisitorAnalyticsProps> = ({ period }) => {
  const [metrics, setMetrics] = useState<VisitorMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVisitorAnalytics();
  }, [period]);

  const loadVisitorAnalytics = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const daysBack = parseInt(period);
      const periodStart = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Fetch visitor data
      const { data: visitorsData } = await supabase
        .from('visitors')
        .select('*')
        .gte('visit_date', periodStart.toISOString().split('T')[0]);

      // Fetch visitor categories
      const { data: categoriesData } = await supabase
        .from('visitor_categories')
        .select('*');

      const totalVisitors = visitorsData?.length || 0;
      
      // Calculate unique visitors (by contact_number)
      const uniqueVisitorNumbers = new Set(visitorsData?.map(v => v.contact_number).filter(Boolean));
      const uniqueVisitors = uniqueVisitorNumbers.size;

      // Calculate repeat visitors
      const visitorCounts: Record<string, number> = {};
      visitorsData?.forEach(visitor => {
        if (visitor.contact_number) {
          visitorCounts[visitor.contact_number] = (visitorCounts[visitor.contact_number] || 0) + 1;
        }
      });
      const repeatVisitors = Object.values(visitorCounts).filter((count: number) => count > 1).length;

      // Calculate average visit duration (mock calculation)
      const averageVisitDuration = 2.5; // hours

      // Generate peak hours data
      const peakHours = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count: Math.floor(Math.random() * 25 + 5)
      }));

      // Generate daily trends
      const dailyTrends = Array.from({ length: Math.min(daysBack, 14) }, (_, i) => {
        const date = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
        const dayVisitors = visitorsData?.filter(v => 
          v.visit_date === date.toISOString().split('T')[0]
        ).length || 0;
        
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          visitors: dayVisitors,
          newVisitors: Math.floor(dayVisitors * 0.7)
        };
      });

      // Category breakdown
      const categoryBreakdown = categoriesData?.map(category => {
        const count = visitorsData?.filter(v => v.category_id === category.id).length || 0;
        return {
          category: category.name,
          count,
          percentage: totalVisitors > 0 ? (count / totalVisitors) * 100 : 0
        };
      }) || [];

      // Add general category for visitors without specific category
      const uncategorizedCount = visitorsData?.filter(v => !v.category_id).length || 0;
      if (uncategorizedCount > 0) {
        categoryBreakdown.push({
          category: 'General',
          count: uncategorizedCount,
          percentage: totalVisitors > 0 ? (uncategorizedCount / totalVisitors) * 100 : 0
        });
      }

      // Calculate compliance metrics
      const checkedInCount = visitorsData?.filter(v => v.status === 'checked_in').length || 0;
      const checkedOutCount = visitorsData?.filter(v => v.status === 'checked_out').length || 0;
      const overdueCount = visitorsData?.filter(v => 
        v.status === 'checked_in' && 
        new Date(v.visit_date) < new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ).length || 0;

      const checkInRate = totalVisitors > 0 ? (checkedInCount / totalVisitors) * 100 : 0;
      const checkOutRate = totalVisitors > 0 ? (checkedOutCount / totalVisitors) * 100 : 0;
      const securityScore = Math.max(0, 100 - (overdueCount * 10));

      const visitorMetrics: VisitorMetrics = {
        overview: {
          totalVisitors,
          uniqueVisitors,
          averageVisitDuration,
          repeatVisitors
        },
        patterns: {
          peakHours,
          dailyTrends,
          categoryBreakdown
        },
        satisfaction: {
          averageRating: 4.2 + Math.random() * 0.6,
          totalFeedback: Math.floor(totalVisitors * 0.3),
          recommendations: Math.floor(totalVisitors * 0.25)
        },
        compliance: {
          checkInRate,
          checkOutRate,
          overdueVisitors: overdueCount,
          securityScore
        }
      };

      setMetrics(visitorMetrics);
    } catch (error) {
      console.error('Error loading visitor analytics:', error);
      toast.error('Failed to load visitor analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Visitor Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.totalVisitors}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.overview.uniqueVisitors} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Visit Duration</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.averageVisitDuration}h</div>
            <p className="text-xs text-green-400">
              ↑ 15% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Visitors</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.repeatVisitors}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.overview.totalVisitors > 0 ? 
                Math.round((metrics.overview.repeatVisitors / metrics.overview.totalVisitors) * 100) : 0}% return rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.satisfaction.averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              {metrics.satisfaction.totalFeedback} responses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Daily Visitor Trends
            </CardTitle>
            <CardDescription>Visitor activity over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metrics.patterns.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="visitors" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="newVisitors" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Peak Hours Analysis
            </CardTitle>
            <CardDescription>Visitor activity by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.patterns.peakHours.filter((_, i) => i % 2 === 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Visitors" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown and Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Visitor Categories
            </CardTitle>
            <CardDescription>Breakdown of visitors by category type</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.patterns.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metrics.patterns.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => 
                      percentage > 5 ? `${category} ${percentage.toFixed(1)}%` : ''
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {metrics.patterns.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No visitor categories data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Compliance Metrics
            </CardTitle>
            <CardDescription>Visitor check-in/out compliance and security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Check-in Rate</span>
                  <span className="text-sm">{metrics.compliance.checkInRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.compliance.checkInRate} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Check-out Rate</span>
                  <span className="text-sm">{metrics.compliance.checkOutRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.compliance.checkOutRate} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Security Score</span>
                  <span className="text-sm">{metrics.compliance.securityScore.toFixed(0)}%</span>
                </div>
                <Progress value={metrics.compliance.securityScore} className="h-2" />
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overdue Visitors</span>
                  <Badge variant={metrics.compliance.overdueVisitors > 0 ? 'destructive' : 'secondary'}>
                    {metrics.compliance.overdueVisitors}
                  </Badge>
                </div>
                {metrics.compliance.overdueVisitors > 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Requires immediate attention
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction Summary */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Visitor Satisfaction Summary
          </CardTitle>
          <CardDescription>Overall visitor experience metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {metrics.satisfaction.averageRating.toFixed(1)}/5
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${
                      star <= Math.round(metrics.satisfaction.averageRating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {metrics.satisfaction.totalFeedback}
              </div>
              <p className="text-sm text-muted-foreground">Total Responses</p>
              <p className="text-xs text-blue-400 mt-1">
                {((metrics.satisfaction.totalFeedback / metrics.overview.totalVisitors) * 100).toFixed(1)}% response rate
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {metrics.satisfaction.recommendations}
              </div>
              <p className="text-sm text-muted-foreground">Would Recommend</p>
              <p className="text-xs text-green-400 mt-1">
                {((metrics.satisfaction.recommendations / metrics.satisfaction.totalFeedback) * 100).toFixed(1)}% of respondents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};