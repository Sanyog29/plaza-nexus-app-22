import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RoutingMetrics {
  totalRouted: number;
  successRate: number;
  avgResponseTime: number;
  staffRating: number;
}

export const SmartRequestRouting = () => {
  const [metrics, setMetrics] = useState<RoutingMetrics>({
    totalRouted: 0,
    successRate: 0,
    avgResponseTime: 0,
    staffRating: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchRoutingMetrics = async () => {
    try {
      setLoading(true);

      // Fetch maintenance requests for routing metrics
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('*,tenant_feedback(rating)')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (requests) {
        const totalRouted = requests.length;
        const completedRequests = requests.filter(r => r.status === 'completed');
        const successRate = totalRouted > 0 ? (completedRequests.length / totalRouted) * 100 : 0;
        
        // Calculate average response time in hours
        const avgResponseTime = completedRequests.length > 0
          ? completedRequests.reduce((sum, req) => {
              const created = new Date(req.created_at);
              const completed = new Date(req.completed_at || req.updated_at);
              return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
            }, 0) / completedRequests.length
          : 0;

        // Calculate staff rating from feedback
        const ratingsData = requests.flatMap(r => r.tenant_feedback || []);
        const staffRating = ratingsData.length > 0
          ? ratingsData.reduce((sum, f) => sum + f.rating, 0) / ratingsData.length
          : 4.5;

        setMetrics({
          totalRouted,
          successRate: Math.round(successRate * 10) / 10,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          staffRating: Math.round(staffRating * 10) / 10
        });
      }
    } catch (error) {
      console.error('Error fetching routing metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutingMetrics();
    
    // Set up real-time subscription for new requests
    const subscription = supabase
      .channel('routing_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        () => fetchRoutingMetrics()
      )
      .subscribe();

    // Refresh every 5 minutes
    const interval = setInterval(fetchRoutingMetrics, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
        <Bot className="h-5 w-5" />
        Smart Routing Engine
        {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
      </h4>
      <Card className="bg-card/30 border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">{metrics.totalRouted}</div>
              <div className="text-xs text-muted-foreground">Requests Routed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">{metrics.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">{metrics.avgResponseTime}h</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">{metrics.staffRating}/5</div>
              <div className="text-xs text-muted-foreground">Staff Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};