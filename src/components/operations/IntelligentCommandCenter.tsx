import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Command,
  Activity,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Shield,
  Zap,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  Globe
} from 'lucide-react';

interface KPIMetric {
  id: string;
  metric_name: string;
  metric_category: string;
  current_value: number;
  target_value?: number;
  threshold_min?: number;
  threshold_max?: number;
  unit?: string;
  is_critical: boolean;
  last_updated: string;
}

interface OptimizationRecommendation {
  id: string;
  recommendation_type: string;
  priority: string;
  title: string;
  description: string;
  potential_savings?: number;
  implementation_effort: string;
  confidence_score?: number;
  status: string;
  created_at: string;
}

export const IntelligentCommandCenter: React.FC = () => {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [crisisMode, setCrisisMode] = useState(false);
  const [systemHealth, setSystemHealth] = useState(98.5);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch KPI metrics
      const { data: kpiData, error: kpiError } = await supabase
        .from('kpi_metrics')
        .select('*')
        .order('is_critical', { ascending: false });

      if (kpiError) throw kpiError;
      setKpiMetrics(kpiData || []);

      // Fetch optimization recommendations
      const { data: recData, error: recError } = await supabase
        .from('optimization_recommendations')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .limit(10);

      if (recError) throw recError;
      setRecommendations(recData || []);

      // Check for crisis conditions
      const criticalIssues = kpiData?.filter(metric => 
        metric.is_critical && (
          (metric.threshold_min && metric.current_value < metric.threshold_min) ||
          (metric.threshold_max && metric.current_value > metric.threshold_max)
        )
      );
      setCrisisMode((criticalIssues?.length || 0) > 2);

    } catch (error) {
      console.error('Error fetching command center data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch command center data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMetricStatus = (metric: KPIMetric) => {
    if (metric.threshold_min && metric.current_value < metric.threshold_min) return 'critical';
    if (metric.threshold_max && metric.current_value > metric.threshold_max) return 'critical';
    if (metric.target_value) {
      const variance = Math.abs(metric.current_value - metric.target_value) / metric.target_value;
      if (variance > 0.2) return 'warning';
      if (variance > 0.1) return 'attention';
    }
    return 'good';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'attention':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const implementRecommendation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('optimization_recommendations')
        .update({ 
          status: 'implemented',
          implemented_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recommendation marked as implemented",
      });

      fetchData();
    } catch (error) {
      console.error('Error implementing recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to implement recommendation",
        variant: "destructive",
      });
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
      {/* Crisis Mode Alert */}
      {crisisMode && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-600">
            <strong>Crisis Mode Activated:</strong> Multiple critical thresholds exceeded. Emergency protocols engaged.
          </AlertDescription>
        </Alert>
      )}

      {/* Command Center Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold text-purple-600">{systemHealth}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Decisions</p>
                <p className="text-2xl font-bold text-blue-600">127</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold text-green-600">$24.5K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency Gain</p>
                <p className="text-2xl font-bold text-orange-600">+32%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Real-Time Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPI Dashboard</TabsTrigger>
          <TabsTrigger value="ai-decisions">AI Decisions</TabsTrigger>
          <TabsTrigger value="integrations">System Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Command className="h-5 w-5" />
                  Operational Command
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-16 flex-col">
                      <Shield className="h-6 w-6 mb-1" />
                      Emergency Mode
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <Users className="h-6 w-6 mb-1" />
                      Staff Orchestration
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <Cpu className="h-6 w-6 mb-1" />
                      Auto Resources
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <Zap className="h-6 w-6 mb-1" />
                      Quick Actions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Smart Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.slice(0, 4).map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPriorityColor(rec.priority)} variant="outline">
                            {rec.priority}
                          </Badge>
                          {rec.potential_savings && (
                            <Badge variant="outline" className="text-xs">
                              ${rec.potential_savings}K savings
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => implementRecommendation(rec.id)}
                        className="ml-2"
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiMetrics.map((metric) => {
              const status = getMetricStatus(metric);
              const progress = metric.target_value ? 
                Math.min((metric.current_value / metric.target_value) * 100, 100) : 
                metric.threshold_max ? 
                  Math.min((metric.current_value / metric.threshold_max) * 100, 100) : 
                  75;

              return (
                <Card key={metric.id} className={metric.is_critical ? 'border-red-500/30' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{metric.metric_name}</p>
                      {getStatusIcon(status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-2xl font-bold">
                          {metric.current_value.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {metric.unit}
                        </span>
                      </div>
                      {metric.target_value && (
                        <>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Target: {metric.target_value} {metric.unit}
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="ai-decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Decision Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: '14:23', decision: 'Auto-escalated critical maintenance request', impact: 'High', confidence: 94 },
                  { time: '14:15', decision: 'Optimized cleaning staff allocation for Zone B', impact: 'Medium', confidence: 87 },
                  { time: '14:08', decision: 'Predicted equipment failure - scheduled preventive maintenance', impact: 'High', confidence: 91 },
                  { time: '13:55', decision: 'Adjusted HVAC schedule based on occupancy patterns', impact: 'Low', confidence: 83 },
                  { time: '13:42', decision: 'Rerouted supply delivery to avoid congestion', impact: 'Medium', confidence: 76 }
                ].map((decision, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-l-4 border-blue-500 bg-blue-500/5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">{decision.time}</span>
                        <Badge variant="outline" className="text-xs">
                          {decision.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{decision.decision}</p>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {decision.confidence}% confidence
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  External Systems
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'IoT Sensors Network', status: 'connected', data: '247 devices' },
                    { name: 'Weather API', status: 'connected', data: 'Real-time data' },
                    { name: 'CMMS Integration', status: 'connected', data: '1,234 assets' },
                    { name: 'Supplier Portal', status: 'warning', data: 'API rate limit' },
                    { name: 'Energy Management', status: 'connected', data: '45 meters' }
                  ].map((system, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{system.name}</p>
                        <p className="text-sm text-muted-foreground">{system.data}</p>
                      </div>
                      <Badge className={
                        system.status === 'connected' ? 'bg-green-500/10 text-green-600' :
                        system.status === 'warning' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }>
                        {system.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Data Flow Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">1.2K</p>
                      <p className="text-sm text-muted-foreground">Events/hour</p>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">99.8%</p>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Data Processing</span>
                      <span>94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>API Response</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>ML Processing</span>
                      <span>91%</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};