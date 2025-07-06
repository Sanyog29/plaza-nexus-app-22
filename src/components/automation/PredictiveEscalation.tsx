import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, Clock, TrendingUp, Zap, 
  Brain, Shield, Target, Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface EscalationPrediction {
  requestId: string;
  requestTitle: string;
  priority: string;
  assignedTo: string;
  assignedName: string;
  slaBreachAt: string;
  breachProbability: number;
  timeToEscalation: number; // minutes
  riskFactors: string[];
  suggestedActions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface EscalationMetrics {
  totalPredictions: number;
  accuracyRate: number;
  breachesAvoided: number;
  avgPreventionTime: number;
}

export const PredictiveEscalation: React.FC = () => {
  const [predictions, setPredictions] = useState<EscalationPrediction[]>([]);
  const [metrics, setMetrics] = useState<EscalationMetrics>({
    totalPredictions: 0,
    accuracyRate: 0,
    breachesAvoided: 0,
    avgPreventionTime: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadEscalationPredictions();
    loadEscalationMetrics();
    
    // Set up real-time monitoring
    const interval = setInterval(() => {
      loadEscalationPredictions();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadEscalationPredictions = async () => {
    setIsAnalyzing(true);
    try {
      // Get active requests with SLA tracking
      const { data: activeRequests } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          profiles!maintenance_requests_assigned_to_fkey(first_name, last_name),
          profiles!maintenance_requests_reported_by_fkey(first_name, last_name)
        `)
        .in('status', ['pending', 'in_progress'])
        .not('sla_breach_at', 'is', null);

      if (activeRequests) {
        const predictions: EscalationPrediction[] = [];

        for (const request of activeRequests) {
          const prediction = await analyzeSLABreach(request);
          if (prediction.breachProbability > 30) { // Only show predictions above 30%
            predictions.push(prediction);
          }
        }

        // Sort by breach probability (highest first)
        predictions.sort((a, b) => b.breachProbability - a.breachProbability);
        setPredictions(predictions);
      }
    } catch (error) {
      console.error('Error loading escalation predictions:', error);
      toast.error('Failed to load escalation predictions');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeSLABreach = async (request: any): Promise<EscalationPrediction> => {
    const now = new Date();
    const slaBreachTime = new Date(request.sla_breach_at);
    const timeToBreachMs = slaBreachTime.getTime() - now.getTime();
    const timeToBreachMinutes = Math.max(0, Math.floor(timeToBreachMs / (1000 * 60)));

    // Calculate breach probability based on various factors
    let breachProbability = 0;
    const riskFactors: string[] = [];
    const suggestedActions: string[] = [];

    // Time factor (closer to breach = higher probability)
    if (timeToBreachMinutes <= 30) {
      breachProbability += 60;
      riskFactors.push('Critical time remaining (< 30 min)');
      suggestedActions.push('Immediate escalation required');
    } else if (timeToBreachMinutes <= 60) {
      breachProbability += 40;
      riskFactors.push('Limited time remaining (< 1 hour)');
      suggestedActions.push('Notify supervisor');
    } else if (timeToBreachMinutes <= 120) {
      breachProbability += 25;
      riskFactors.push('Time constraint (< 2 hours)');
      suggestedActions.push('Monitor closely');
    }

    // Priority factor
    if (request.priority === 'urgent') {
      breachProbability += 20;
      riskFactors.push('Urgent priority request');
      suggestedActions.push('Prioritize assignment');
    } else if (request.priority === 'high') {
      breachProbability += 15;
      riskFactors.push('High priority request');
    }

    // Assignment factor
    if (!request.assigned_to) {
      breachProbability += 30;
      riskFactors.push('No staff assigned');
      suggestedActions.push('Auto-assign immediately');
    }

    // Historical performance factor (mock data)
    const staffPerformance = await getStaffPerformance(request.assigned_to);
    if (staffPerformance < 0.8) {
      breachProbability += 15;
      riskFactors.push('Staff with lower completion rate');
      suggestedActions.push('Consider reassignment');
    }

    // Complexity factor (based on description length as proxy)
    if (request.description.length > 200) {
      breachProbability += 10;
      riskFactors.push('Complex request (detailed description)');
      suggestedActions.push('Allocate additional resources');
    }

    // Cap at 99%
    breachProbability = Math.min(99, breachProbability);

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (breachProbability >= 80) severity = 'critical';
    else if (breachProbability >= 60) severity = 'high';
    else if (breachProbability >= 40) severity = 'medium';
    else severity = 'low';

    return {
      requestId: request.id,
      requestTitle: request.title,
      priority: request.priority,
      assignedTo: request.assigned_to || '',
      assignedName: request.profiles?.first_name && request.profiles?.last_name 
        ? `${request.profiles.first_name} ${request.profiles.last_name}`
        : 'Unassigned',
      slaBreachAt: request.sla_breach_at,
      breachProbability: Math.round(breachProbability),
      timeToEscalation: timeToBreachMinutes,
      riskFactors,
      suggestedActions,
      severity
    };
  };

  const getStaffPerformance = async (staffId: string | null): Promise<number> => {
    if (!staffId) return 0;
    
    try {
      const { data: completedRequests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('assigned_to', staffId)
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: breachedRequests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('assigned_to', staffId)
        .eq('status', 'completed')
        .lt('sla_breach_at', new Date().toISOString())
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const totalCompleted = completedRequests?.length || 0;
      const totalBreached = breachedRequests?.length || 0;

      return totalCompleted > 0 ? (totalCompleted - totalBreached) / totalCompleted : 0.8;
    } catch (error) {
      console.error('Error calculating staff performance:', error);
      return 0.8; // Default performance score
    }
  };

  const loadEscalationMetrics = async () => {
    // Mock metrics - in real implementation, these would come from historical data
    setMetrics({
      totalPredictions: 247,
      accuracyRate: 87.5,
      breachesAvoided: 156,
      avgPreventionTime: 45
    });
  };

  const handleEscalateNow = async (prediction: EscalationPrediction) => {
    try {
      // Create notification for supervisor
      const { data: supervisor } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'ops_supervisor')
        .single();

      if (supervisor) {
        await supabase.rpc('create_notification', {
          target_user_id: supervisor.id,
          notification_title: 'SLA Breach Alert - Immediate Action Required',
          notification_message: `Request "${prediction.requestTitle}" has ${prediction.breachProbability}% breach probability. Time remaining: ${prediction.timeToEscalation} minutes.`,
          notification_type: 'critical'
        });
      }

      toast.success('Escalation notification sent to supervisor');
    } catch (error) {
      console.error('Error escalating request:', error);
      toast.error('Failed to escalate request');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-400';
      case 'high': return 'text-orange-400 border-orange-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      default: return 'text-blue-400 border-blue-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Shield className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Predictive Escalation System
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered SLA breach prevention and early warning system
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAnalyzing && (
            <Badge className="bg-primary/20 text-primary animate-pulse">
              Analyzing...
            </Badge>
          )}
          <Badge className={`${predictions.length > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
            {predictions.length} Active Predictions
          </Badge>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold text-white">{metrics.totalPredictions}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                <p className="text-2xl font-bold text-white">{metrics.accuracyRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Breaches Avoided</p>
                <p className="text-2xl font-bold text-white">{metrics.breachesAvoided}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Prevention Time</p>
                <p className="text-2xl font-bold text-white">{metrics.avgPreventionTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Predictions */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active SLA Breach Predictions ({predictions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {predictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No high-risk SLA breaches predicted</p>
              <p className="text-sm">All requests are on track for timely completion</p>
            </div>
          ) : (
            predictions.map((prediction) => (
              <Alert key={prediction.requestId} className="border-l-4 border-l-primary">
                <AlertDescription>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getSeverityColor(prediction.severity)}>
                          {getSeverityIcon(prediction.severity)}
                          {prediction.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {prediction.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {prediction.assignedName}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-white mb-1">{prediction.requestTitle}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>Time to SLA: {prediction.timeToEscalation}m</span>
                        <span>Breach Probability: {prediction.breachProbability}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-400 mb-1">
                        {prediction.breachProbability}%
                      </div>
                      <Progress 
                        value={prediction.breachProbability} 
                        className="w-20 h-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <h5 className="text-sm font-medium text-white mb-1">Risk Factors:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {prediction.riskFactors.map((factor, idx) => (
                          <li key={idx}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-white mb-1">Suggested Actions:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {prediction.suggestedActions.map((action, idx) => (
                          <li key={idx}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleEscalateNow(prediction)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Escalate Now
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};