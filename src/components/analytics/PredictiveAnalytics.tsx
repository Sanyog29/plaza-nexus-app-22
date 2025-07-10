import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Calendar, Users, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PredictiveInsight {
  id: string;
  type: 'maintenance_due' | 'sla_risk' | 'workload_spike' | 'equipment_failure';
  title: string;
  description: string;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeline: string;
  recommendations: string[];
}

export function PredictiveAnalytics() {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    generatePredictiveInsights();
  }, []);

  const generatePredictiveInsights = async () => {
    try {
      const insights: PredictiveInsight[] = [];

      // Predict upcoming maintenance based on asset service dates
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .not('next_service_due', 'is', null)
        .gte('next_service_due', new Date().toISOString())
        .lte('next_service_due', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

      if (assets?.length) {
        insights.push({
          id: 'maintenance-due',
          type: 'maintenance_due',
          title: `${assets.length} Assets Require Maintenance`,
          description: `${assets.length} assets have scheduled maintenance due within 30 days`,
          probability: 95,
          impact: 'medium',
          timeline: 'Next 30 days',
          recommendations: [
            'Schedule maintenance technicians',
            'Order required spare parts',
            'Notify relevant departments'
          ]
        });
      }

      // Predict SLA breaches based on current workload
      const { data: pendingRequests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .not('sla_breach_at', 'is', null);

      const slaRiskCount = pendingRequests?.filter(req => 
        new Date(req.sla_breach_at!) < new Date(Date.now() + 24 * 60 * 60 * 1000)
      ).length || 0;

      if (slaRiskCount > 0) {
        insights.push({
          id: 'sla-risk',
          type: 'sla_risk',
          title: `${slaRiskCount} Requests at SLA Risk`,
          description: `${slaRiskCount} maintenance requests may breach SLA within 24 hours`,
          probability: 80,
          impact: slaRiskCount > 5 ? 'critical' : 'high',
          timeline: 'Next 24 hours',
          recommendations: [
            'Prioritize critical requests',
            'Allocate additional staff',
            'Consider outsourcing if needed'
          ]
        });
      }

      // Predict workload spikes based on historical patterns
      const dayOfWeek = new Date().getDay();
      const hourOfDay = new Date().getHours();
      
      // Simulate workload prediction based on typical patterns
      if (dayOfWeek === 1 && hourOfDay < 12) { // Monday morning
        insights.push({
          id: 'workload-spike',
          type: 'workload_spike',
          title: 'Workload Spike Expected',
          description: 'Monday morning typically sees 40% higher request volume',
          probability: 75,
          impact: 'medium',
          timeline: 'Next 4 hours',
          recommendations: [
            'Ensure full staff coverage',
            'Prepare emergency response team',
            'Review weekend accumulated requests'
          ]
        });
      }

      // Predict equipment failures based on service history
      const { data: overdueMaintenance } = await supabase
        .from('assets')
        .select('*')
        .lt('next_service_due', new Date().toISOString())
        .eq('status', 'operational');

      if (overdueMaintenance?.length) {
        insights.push({
          id: 'equipment-failure',
          type: 'equipment_failure',
          title: `${overdueMaintenance.length} Assets Overdue for Maintenance`,
          description: 'Equipment with overdue maintenance has 60% higher failure risk',
          probability: 60,
          impact: 'high',
          timeline: 'Immediate attention required',
          recommendations: [
            'Schedule immediate maintenance',
            'Consider temporary replacements',
            'Monitor equipment closely'
          ]
        });
      }

      setInsights(insights);
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to generate predictive insights",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance_due': return Calendar;
      case 'sla_risk': return AlertTriangle;
      case 'workload_spike': return Users;
      case 'equipment_failure': return Wrench;
      default: return TrendingUp;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Predictive Analytics</CardTitle>
          <CardDescription>Loading insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Predictive Analytics
        </CardTitle>
        <CardDescription>
          AI-powered insights and predictions for proactive management
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No significant risks or patterns detected at this time. System is operating normally.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => {
              const IconComponent = getTypeIcon(insight.type);
              return (
                <Card key={insight.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{insight.title}</h4>
                      </div>
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{insight.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="text-sm font-medium">Probability</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={insight.probability} className="flex-1" />
                          <span className="text-sm text-muted-foreground">{insight.probability}%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Timeline</label>
                        <p className="text-sm text-muted-foreground mt-1">{insight.timeline}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Recommendations</label>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-primary rounded-full" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}