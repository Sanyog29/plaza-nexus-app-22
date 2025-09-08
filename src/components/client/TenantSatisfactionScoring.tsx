import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { extractCategoryName } from '@/utils/categoryUtils';

interface SatisfactionMetric {
  id: string;
  request_id: string;
  rating: number;
  feedback: string;
  category: string;
  completion_time_hours: number;
  sla_met: boolean;
  created_at: string;
}

const TenantSatisfactionScoring: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [satisfactionMetrics, setSatisfactionMetrics] = useState<SatisfactionMetric[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{[key: string]: {rating: number, count: number}}>({});

  useEffect(() => {
    if (user) {
      fetchSatisfactionData();
    }
  }, [user]);

  const fetchSatisfactionData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First fetch feedback data from the maintenance_request_feedback table
      const { data: feedbackData } = await supabase
        .from('maintenance_request_feedback')
        .select(`
          *,
          maintenance_requests!inner(
            id,
            title,
            created_at,
            completed_at,
            sla_breach_at,
            main_categories!maintenance_requests_category_id_fkey(name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (feedbackData) {
        const metrics: SatisfactionMetric[] = feedbackData.map(feedback => {
          const request = feedback.maintenance_requests;
          const completionTime = request.completed_at && request.created_at
            ? (new Date(request.completed_at).getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60)
            : 0;
          
          const slaBreached = request.sla_breach_at && request.completed_at
            ? new Date(request.completed_at) > new Date(request.sla_breach_at)
            : false;

          return {
            id: feedback.id,
            request_id: request.id,
            rating: feedback.satisfaction_rating || 0,
            feedback: feedback.feedback_text || '',
            category: extractCategoryName(request.main_categories),
            completion_time_hours: completionTime,
            sla_met: !slaBreached,
            created_at: feedback.created_at
          };
        });

        setSatisfactionMetrics(metrics);

        // Calculate average rating
        const totalRating = metrics.reduce((sum, metric) => sum + metric.rating, 0);
        setAverageRating(metrics.length > 0 ? totalRating / metrics.length : 0);

        // Calculate category breakdown
        const categoryMap: {[key: string]: {total: number, count: number}} = {};
        metrics.forEach(metric => {
          if (!categoryMap[metric.category]) {
            categoryMap[metric.category] = { total: 0, count: 0 };
          }
          categoryMap[metric.category].total += metric.rating;
          categoryMap[metric.category].count += 1;
        });

        const breakdown: {[key: string]: {rating: number, count: number}} = {};
        Object.entries(categoryMap).forEach(([category, data]) => {
          breakdown[category] = {
            rating: data.count > 0 ? data.total / data.count : 0,
            count: data.count
          };
        });
        setCategoryBreakdown(breakdown);
      }

    } catch (error) {
      console.error('Error fetching satisfaction data:', error);
      toast({
        title: "Error",
        description: "Failed to load satisfaction data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Satisfaction Scoring</h1>
        <p className="text-muted-foreground">Track your service experience and feedback</p>
      </div>

      {/* Overall Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex items-center mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < Math.round(averageRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{satisfactionMetrics.length}</div>
            <p className="text-xs text-muted-foreground">Completed requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {satisfactionMetrics.length > 0 
                ? Math.round((satisfactionMetrics.filter(m => m.sla_met).length / satisfactionMetrics.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">On-time completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {satisfactionMetrics.length > 0
                ? (satisfactionMetrics.reduce((sum, m) => sum + m.completion_time_hours, 0) / satisfactionMetrics.length).toFixed(1)
                : 0}h
            </div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Satisfaction by Category</CardTitle>
          <CardDescription>Service quality across different request types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown).map(([category, data]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category}</span>
                    <Badge variant="outline">{data.count} requests</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.rating.toFixed(1)}</span>
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  </div>
                </div>
                <Progress value={(data.rating / 5) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>Your latest service experiences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {satisfactionMetrics.slice(0, 10).map((metric) => (
              <div key={metric.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{metric.category}</Badge>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < metric.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    {metric.feedback && (
                      <p className="text-sm text-muted-foreground mt-1">{metric.feedback}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {metric.sla_met ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(metric.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Completed in {metric.completion_time_hours.toFixed(1)} hours
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantSatisfactionScoring;
