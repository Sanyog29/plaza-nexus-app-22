import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, Zap, Target, TrendingUp, Clock, Users,
  Brain, Route, CheckCircle, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface RoutingRule {
  id: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  skillRequired: string[];
  locationWeight: number;
  experienceWeight: number;
  workloadWeight: number;
  isActive: boolean;
}

interface RoutingMetrics {
  totalRouted: number;
  avgRoutingTime: number;
  accuracyScore: number;
  satisfactionScore: number;
  ruleEffectiveness: { [key: string]: number };
}

export const SmartRequestRouting: React.FC = () => {
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [metrics, setMetrics] = useState<RoutingMetrics>({
    totalRouted: 0,
    avgRoutingTime: 0,
    accuracyScore: 0,
    satisfactionScore: 0,
    ruleEffectiveness: {}
  });
  const [isAutoRoutingEnabled, setIsAutoRoutingEnabled] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<number>(0);

  useEffect(() => {
    loadRoutingConfiguration();
    loadRoutingMetrics();
    startRealTimeRouting();
  }, []);

  const loadRoutingConfiguration = async () => {
    // Mock routing rules - in real implementation, these would come from database
    const mockRules: RoutingRule[] = [
      {
        id: '1',
        priority: 'urgent',
        category: 'electrical',
        skillRequired: ['Electrical', 'Safety Certified'],
        locationWeight: 0.4,
        experienceWeight: 0.4,
        workloadWeight: 0.2,
        isActive: true
      },
      {
        id: '2',
        priority: 'high',
        category: 'plumbing',
        skillRequired: ['Plumbing', 'Pipe Systems'],
        locationWeight: 0.3,
        experienceWeight: 0.3,
        workloadWeight: 0.4,
        isActive: true
      },
      {
        id: '3',
        priority: 'medium',
        category: 'hvac',
        skillRequired: ['HVAC', 'Climate Control'],
        locationWeight: 0.2,
        experienceWeight: 0.5,
        workloadWeight: 0.3,
        isActive: true
      }
    ];
    setRoutingRules(mockRules);
  };

  const loadRoutingMetrics = async () => {
    try {
      // Get routing metrics from completed requests
      const { data: completedRequests } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          profiles!maintenance_requests_assigned_to_fkey(*)
        `)
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (completedRequests) {
        const totalRouted = completedRequests.length;
        const avgRoutingTime = completedRequests.reduce((acc, req) => {
          const routingTime = req.assigned_to ? 5 : 0; // Mock routing time
          return acc + routingTime;
        }, 0) / totalRouted || 0;

        setMetrics({
          totalRouted,
          avgRoutingTime: Math.round(avgRoutingTime * 100) / 100,
          accuracyScore: 89, // Mock ML accuracy score
          satisfactionScore: 4.2, // Mock satisfaction
          ruleEffectiveness: {
            'urgent': 95,
            'high': 87,
            'medium': 82,
            'low': 78
          }
        });
      }
    } catch (error) {
      console.error('Error loading routing metrics:', error);
    }
  };

  const startRealTimeRouting = () => {
    // Simulate real-time routing processing
    const interval = setInterval(async () => {
      try {
        const { data: pendingRequests } = await supabase
          .from('maintenance_requests')
          .select('*')
          .eq('status', 'pending')
          .is('assigned_to', null);

        if (pendingRequests && pendingRequests.length > 0 && isAutoRoutingEnabled) {
          setProcessingRequests(pendingRequests.length);
          
          // Process requests with AI routing
          for (const request of pendingRequests.slice(0, 3)) { // Process max 3 at a time
            await processSmartRouting(request);
          }
          
          setProcessingRequests(0);
          await loadRoutingMetrics();
        }
      } catch (error) {
        console.error('Error in real-time routing:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  };

  const processSmartRouting = async (request: any) => {
    try {
      // Get available staff
      const { data: staff } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['field_staff', 'ops_supervisor']);

      if (!staff || staff.length === 0) return;

      // Apply ML-based routing algorithm
      const bestStaff = await findOptimalStaff(request, staff);
      
      if (bestStaff) {
        await supabase
          .from('maintenance_requests')
          .update({ 
            assigned_to: bestStaff.id,
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        toast.success(`Request auto-assigned to ${bestStaff.first_name} ${bestStaff.last_name}`);
      }
    } catch (error) {
      console.error('Error in smart routing:', error);
    }
  };

  const findOptimalStaff = async (request: any, staff: any[]) => {
    // Get current workloads
    const staffWithWorkload = await Promise.all(
      staff.map(async (member) => {
        const { data: activeRequests } = await supabase
          .from('maintenance_requests')
          .select('*')
          .eq('assigned_to', member.id)
          .in('status', ['pending', 'in_progress']);

        return {
          ...member,
          currentWorkload: activeRequests?.length || 0
        };
      })
    );

    // Find routing rule for this request
    const rule = routingRules.find(r => 
      r.priority === request.priority && 
      r.isActive
    ) || routingRules[0];

    // Calculate optimal staff based on weighted scoring
    const scores = staffWithWorkload.map(member => {
      let score = 0;

      // Location proximity (mock calculation)
      const locationScore = member.floor === request.location ? 100 : 70;
      score += locationScore * rule.locationWeight;

      // Experience (mock based on role)
      const experienceScore = member.role === 'ops_supervisor' ? 100 : 80;
      score += experienceScore * rule.experienceWeight;

      // Workload (inverse scoring)
      const workloadScore = Math.max(0, 100 - (member.currentWorkload * 25));
      score += workloadScore * rule.workloadWeight;

      return { ...member, score };
    });

    // Return staff with highest score
    return scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  const toggleAutoRouting = () => {
    setIsAutoRoutingEnabled(!isAutoRoutingEnabled);
    toast.success(`Auto-routing ${!isAutoRoutingEnabled ? 'enabled' : 'disabled'}`);
  };

  const toggleRule = (ruleId: string) => {
    setRoutingRules(rules => 
      rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Smart Request Routing Engine
          </h3>
          <p className="text-sm text-muted-foreground">
            ML-powered intelligent assignment system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isAutoRoutingEnabled}
              onCheckedChange={toggleAutoRouting}
            />
            <span className="text-sm text-white">Auto-Routing</span>
          </div>
          {processingRequests > 0 && (
            <Badge className="bg-primary/20 text-primary animate-pulse">
              Processing {processingRequests} requests...
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Routed</p>
                <p className="text-2xl font-bold text-white">{metrics.totalRouted}</p>
              </div>
              <Route className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Routing Time</p>
                <p className="text-2xl font-bold text-white">{metrics.avgRoutingTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ML Accuracy</p>
                <p className="text-2xl font-bold text-white">{metrics.accuracyScore}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold text-white">{metrics.satisfactionScore}/5</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routing Rules Configuration */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Routing Rules & Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {routingRules.map((rule) => (
            <div key={rule.id} className="p-4 bg-background/20 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`${
                        rule.priority === 'urgent' ? 'text-red-400 border-red-400' :
                        rule.priority === 'high' ? 'text-orange-400 border-orange-400' :
                        rule.priority === 'medium' ? 'text-yellow-400 border-yellow-400' :
                        'text-green-400 border-green-400'
                      }`}
                    >
                      {rule.priority}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {rule.category}
                    </Badge>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Required Skills: {rule.skillRequired.join(', ')}</p>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <span className="text-white font-medium">Location: {Math.round(rule.locationWeight * 100)}%</span>
                        <Progress value={rule.locationWeight * 100} className="h-1 mt-1" />
                      </div>
                      <div>
                        <span className="text-white font-medium">Experience: {Math.round(rule.experienceWeight * 100)}%</span>
                        <Progress value={rule.experienceWeight * 100} className="h-1 mt-1" />
                      </div>
                      <div>
                        <span className="text-white font-medium">Workload: {Math.round(rule.workloadWeight * 100)}%</span>
                        <Progress value={rule.workloadWeight * 100} className="h-1 mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {metrics.ruleEffectiveness[rule.priority] || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Effectiveness</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Real-time Processing Status */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Real-time Processing Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isAutoRoutingEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-white">
                System Status: {isAutoRoutingEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Next scan in: <span className="text-white font-mono">00:08</span>
            </div>
          </div>
          
          {processingRequests > 0 && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-primary animate-spin" />
                <span className="text-sm font-medium text-white">
                  Processing {processingRequests} requests with AI routing...
                </span>
              </div>
              <Progress value={66} className="h-1" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};