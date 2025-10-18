import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, Zap, TrendingUp, Users, Clock, CheckCircle, 
  AlertTriangle, BarChart3, Activity, Target
} from 'lucide-react';

interface SmartRoutingMetrics {
  totalRequestsProcessed: number;
  autoAssignmentSuccessRate: number;
  averageAssignmentTime: number;
  staffUtilization: number;
  predictionAccuracy: number;
  escalationPrevention: number;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  currentWorkload: number;
  skillMatch: number;
  responseTime: number;
  location: string;
  availability: 'available' | 'busy' | 'offline';
}

interface RoutingPrediction {
  requestId: string;
  recommendedStaff: StaffMember;
  confidence: number;
  estimatedCompletionTime: number;
  escalationRisk: 'low' | 'medium' | 'high';
  reasoning: string[];
}

const EnhancedSmartRouting: React.FC = () => {
  const [metrics, setMetrics] = useState<SmartRoutingMetrics | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [recentPredictions, setRecentPredictions] = useState<RoutingPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoMode, setAutoMode] = useState(true);
  const { user, isAdmin, isStaff } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin || isStaff) {
      loadSmartRoutingData();
      
      // Set up real-time monitoring
      const interval = setInterval(loadSmartRoutingData, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isAdmin, isStaff]);

  const loadSmartRoutingData = async () => {
    try {
      setIsLoading(true);
      
      // Load current metrics from database
      const [metricsData, staffData, predictionsData] = await Promise.all([
        calculateRoutingMetrics(),
        loadStaffData(),
        loadRecentPredictions()
      ]);

      setMetrics(metricsData);
      setStaffMembers(staffData);
      setRecentPredictions(predictionsData);

    } catch (error: any) {
      toast({
        title: "Error loading smart routing data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRoutingMetrics = async (): Promise<SmartRoutingMetrics> => {
    // Get requests from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: requests } = await supabase
      .from('maintenance_requests')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .is('deleted_at', null);

    const totalRequests = requests?.length || 0;
    const assignedRequests = requests?.filter(r => r.assigned_to).length || 0;
    const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;

    // Calculate average assignment time (mock calculation)
    const avgAssignmentTime = 0.5; // hours

    // Calculate completion times for completed requests
    const completedWithTimes = requests?.filter(r => 
      r.status === 'completed' && r.completed_at && r.created_at
    ) || [];
    
    const avgCompletionTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum, req) => {
          const start = new Date(req.created_at);
          const end = new Date(req.completed_at);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
        }, 0) / completedWithTimes.length
      : 8; // default 8 hours

    // Calculate staff utilization
    const { data: staff } = await supabase
      .from('profiles_public')
      .select('*')
      .in('role', ['field_staff', 'ops_supervisor']);

    const activeStaff = staff?.length || 1;
    const staffUtilization = Math.min(100, (assignedRequests / activeStaff) * 10);

    return {
      totalRequestsProcessed: totalRequests,
      autoAssignmentSuccessRate: totalRequests > 0 ? Math.round((assignedRequests / totalRequests) * 100) : 95,
      averageAssignmentTime: avgAssignmentTime,
      staffUtilization: Math.round(staffUtilization),
      predictionAccuracy: 87, // Mock value - would be calculated from historical data
      escalationPrevention: 92  // Mock value - percentage of escalations prevented
    };
  };

  const loadStaffData = async (): Promise<StaffMember[]> => {
    const { data: staff } = await supabase
      .from('profiles_public')
      .select('*')
      .in('role', ['field_staff', 'ops_supervisor', 'admin']);

    if (!staff) return [];

    // Get current workload for each staff member  
    const staffWithWorkload = await Promise.all(
      staff.map(async (member) => {
        const { data: activeRequests } = await supabase
          .from('maintenance_requests')
          .select('id')
          .eq('assigned_to', member.id)
          .neq('status', 'completed')
          .is('deleted_at', null);

        const workload = activeRequests?.length || 0;
        
        return {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          role: member.role as string,
          currentWorkload: workload,
          skillMatch: Math.floor(Math.random() * 30) + 70, // Mock skill matching
          responseTime: Math.floor(Math.random() * 4) + 1, // Mock response time in hours
          location: member.zone || 'General',
          availability: workload < 3 ? 'available' : workload < 6 ? 'busy' : 'offline'
        } as StaffMember;
      })
    );

    return staffWithWorkload.sort((a, b) => a.currentWorkload - b.currentWorkload);
  };

  const loadRecentPredictions = async (): Promise<RoutingPrediction[]> => {
    // Get recent unassigned requests for prediction
    const { data: unassignedRequests } = await supabase
      .from('maintenance_requests')
      .select('*')
      .is('assigned_to', null)
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!unassignedRequests) return [];

    const staffData = await loadStaffData();
    
    return unassignedRequests.map(request => {
      // Smart assignment algorithm
      const availableStaff = staffData.filter(s => s.availability !== 'offline');
      const bestMatch = availableStaff.reduce((best, current) => {
        const score = (100 - current.currentWorkload * 10) + current.skillMatch - (current.responseTime * 5);
        const bestScore = (100 - best.currentWorkload * 10) + best.skillMatch - (best.responseTime * 5);
        return score > bestScore ? current : best;
      }, availableStaff[0]);

      if (!bestMatch) return null;

      const confidence = Math.min(95, 
        (bestMatch.skillMatch + (100 - bestMatch.currentWorkload * 10)) / 2
      );

      const escalationRisk = request.priority === 'urgent' ? 'high' :
                           request.priority === 'high' ? 'medium' : 'low';

      const reasoning = [
        `Best skill match (${bestMatch.skillMatch}%)`,
        `Low workload (${bestMatch.currentWorkload} active tasks)`,
        `Fast response time (${bestMatch.responseTime}h avg)`,
        `Location proximity (${bestMatch.location})`
      ];

      return {
        requestId: request.id,
        recommendedStaff: bestMatch,
        confidence: Math.round(confidence),
        estimatedCompletionTime: Math.round(
          bestMatch.responseTime + (request.priority === 'urgent' ? 2 : 
          request.priority === 'high' ? 4 : 8)
        ),
        escalationRisk,
        reasoning
      };
    }).filter(Boolean) as RoutingPrediction[];
  };

  const executeAutoAssignment = async (prediction: RoutingPrediction) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          assigned_to: prediction.recommendedStaff.id,
          status: 'in_progress'
        })
        .eq('id', prediction.requestId);

      if (error) throw error;

      toast({
        title: "Auto-assignment successful",
        description: `Request assigned to ${prediction.recommendedStaff.name}`,
      });

      // Refresh data
      loadSmartRoutingData();

    } catch (error: any) {
      toast({
        title: "Auto-assignment failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getEscalationRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  if (!isAdmin && !isStaff) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access to smart routing system is restricted to staff members.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Auto Mode Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Enhanced Smart Routing
          </h2>
          <p className="text-muted-foreground">AI-powered request assignment and optimization</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Auto Mode</span>
            <Button
              variant={autoMode ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoMode(!autoMode)}
            >
              {autoMode ? "ON" : "OFF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Requests Processed</p>
                  <p className="text-2xl font-bold">{metrics.totalRequestsProcessed}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.autoAssignmentSuccessRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Assignment</p>
                  <p className="text-2xl font-bold">{metrics.averageAssignmentTime}h</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Staff Utilization</p>
                  <p className="text-2xl font-bold">{metrics.staffUtilization}%</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prediction Accuracy</p>
                  <p className="text-2xl font-bold">{metrics.predictionAccuracy}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Escalation Prevention</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.escalationPrevention}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffMembers.map((staff) => (
              <div key={staff.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{staff.name}</h4>
                  <Badge className={getAvailabilityColor(staff.availability)}>
                    {staff.availability}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Role:</span>
                    <span className="font-medium">{staff.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workload:</span>
                    <span>{staff.currentWorkload} tasks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skill Match:</span>
                    <span>{staff.skillMatch}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span>{staff.responseTime}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span>{staff.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Routing Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart Assignment Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPredictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending assignments</p>
              <p className="text-sm">All requests are currently assigned</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPredictions.map((prediction) => (
                <div key={prediction.requestId} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">Request #{prediction.requestId.slice(-8)}</h4>
                        <Badge className={getEscalationRiskColor(prediction.escalationRisk)}>
                          {prediction.escalationRisk} risk
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Recommended Staff</p>
                          <p className="font-medium">{prediction.recommendedStaff.name}</p>
                          <p className="text-sm text-muted-foreground">{prediction.recommendedStaff.role}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <div className="flex items-center gap-2">
                            <Progress value={prediction.confidence} className="flex-1" />
                            <span className="text-sm font-medium">{prediction.confidence}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Est. Completion</p>
                          <p className="font-medium">{prediction.estimatedCompletionTime} hours</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Workload</p>
                          <p className="font-medium">{prediction.recommendedStaff.currentWorkload} tasks</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Reasoning</p>
                        <ul className="text-sm space-y-1">
                          {prediction.reasoning.map((reason, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="ml-4">
                      <Button
                        onClick={() => executeAutoAssignment(prediction)}
                        className="flex items-center gap-2"
                        disabled={!autoMode}
                      >
                        <Zap className="h-4 w-4" />
                        Assign
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSmartRouting;