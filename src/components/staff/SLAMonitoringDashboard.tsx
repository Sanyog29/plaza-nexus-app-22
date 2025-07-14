import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingDown,
  TrendingUp,
  Target,
  Calendar,
  Filter
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface SLABreach {
  id: string;
  title: string;
  priority: string;
  createdAt: string;
  slaBreachAt: string;
  completedAt?: string;
  breachDuration: number; // in hours
  status: string;
  category?: string;
}

interface SLAMetrics {
  totalRequests: number;
  onTimeRequests: number;
  breachedRequests: number;
  activeBreaches: number;
  avgResolutionTime: number;
  complianceRate: number;
  breachByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  breachTrend: 'improving' | 'declining' | 'stable';
}

export const SLAMonitoringDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
  const [recentBreaches, setRecentBreaches] = useState<SLABreach[]>([]);
  const [activeBreaches, setActiveBreaches] = useState<SLABreach[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    if (user) {
      fetchSLAData();
      // Set up real-time monitoring
      const interval = setInterval(fetchSLAData, 5 * 60 * 1000); // Refresh every 5 minutes
      return () => clearInterval(interval);
    }
  }, [user, timeRange]);

  const fetchSLAData = async () => {
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

      // Fetch maintenance requests with SLA data
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories(name)
        `)
        .eq('assigned_to', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (requests) {
        // Calculate metrics
        const totalRequests = requests.length;
        const completedRequests = requests.filter(r => r.status === 'completed');
        
        // On-time requests (completed before SLA breach or no SLA set)
        const onTimeRequests = completedRequests.filter(r => 
          !r.sla_breach_at || new Date(r.completed_at!) <= new Date(r.sla_breach_at)
        );
        
        // Breached requests (completed after SLA or still open past SLA)
        const breachedRequests = requests.filter(r => 
          r.sla_breach_at && (
            (r.completed_at && new Date(r.completed_at) > new Date(r.sla_breach_at)) ||
            (!r.completed_at && new Date() > new Date(r.sla_breach_at))
          )
        );

        // Active breaches (not yet completed and past SLA)
        const currentActiveBreaches = requests.filter(r => 
          r.sla_breach_at && 
          !r.completed_at && 
          new Date() > new Date(r.sla_breach_at)
        );

        // Calculate average resolution time
        const avgResolutionTime = completedRequests.length > 0
          ? completedRequests.reduce((sum, req) => {
              if (req.completed_at && req.created_at) {
                const time = new Date(req.completed_at).getTime() - new Date(req.created_at).getTime();
                return sum + (time / (1000 * 60 * 60)); // Convert to hours
              }
              return sum;
            }, 0) / completedRequests.length
          : 0;

        // Calculate breach by priority
        const breachByPriority = breachedRequests.reduce((acc, req) => {
          acc[req.priority as keyof typeof acc] = (acc[req.priority as keyof typeof acc] || 0) + 1;
          return acc;
        }, { urgent: 0, high: 0, medium: 0, low: 0 });

        // Calculate compliance rate
        const complianceRate = totalRequests > 0 ? (onTimeRequests.length / totalRequests) * 100 : 100;

        // Determine trend (simplified - would use historical data in real implementation)
        const breachTrend: 'improving' | 'declining' | 'stable' = 
          breachedRequests.length < totalRequests * 0.1 ? 'improving' :
          breachedRequests.length > totalRequests * 0.2 ? 'declining' : 'stable';

        setMetrics({
          totalRequests,
          onTimeRequests: onTimeRequests.length,
          breachedRequests: breachedRequests.length,
          activeBreaches: currentActiveBreaches.length,
          avgResolutionTime,
          complianceRate,
          breachByPriority,
          breachTrend
        });

        // Process recent breaches for display
        const processedBreaches: SLABreach[] = breachedRequests
          .slice(0, 10) // Show latest 10 breaches
          .map(req => ({
            id: req.id,
            title: req.title,
            priority: req.priority,
            createdAt: req.created_at,
            slaBreachAt: req.sla_breach_at!,
            completedAt: req.completed_at || undefined,
            breachDuration: req.sla_breach_at 
              ? (new Date(req.completed_at || new Date()).getTime() - new Date(req.sla_breach_at).getTime()) / (1000 * 60 * 60)
              : 0,
            status: req.status,
            category: req.maintenance_categories?.name
          }))
          .sort((a, b) => new Date(b.slaBreachAt).getTime() - new Date(a.slaBreachAt).getTime());

        setRecentBreaches(processedBreaches);

        // Process active breaches
        const processedActiveBreaches: SLABreach[] = currentActiveBreaches
          .map(req => ({
            id: req.id,
            title: req.title,
            priority: req.priority,
            createdAt: req.created_at,
            slaBreachAt: req.sla_breach_at!,
            breachDuration: (new Date().getTime() - new Date(req.sla_breach_at!).getTime()) / (1000 * 60 * 60),
            status: req.status,
            category: req.maintenance_categories?.name
          }))
          .sort((a, b) => b.breachDuration - a.breachDuration);

        setActiveBreaches(processedActiveBreaches);
      }

    } catch (error) {
      console.error('Error fetching SLA data:', error);
      toast({
        title: "Error",
        description: "Failed to load SLA monitoring data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (priority: string, isActive: boolean = false) => {
    const baseColors = {
      urgent: isActive ? 'bg-red-100 border-red-500 text-red-700' : 'text-red-600',
      high: isActive ? 'bg-orange-100 border-orange-500 text-orange-700' : 'text-orange-600',
      medium: isActive ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'text-yellow-600',
      low: isActive ? 'bg-green-100 border-green-500 text-green-700' : 'text-green-600'
    };
    return baseColors[priority as keyof typeof baseColors] || 'text-gray-600';
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
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
          <h1 className="text-3xl font-bold text-foreground">SLA Monitoring</h1>
          <p className="text-muted-foreground">Track service level agreement compliance and breaches</p>
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
        </div>
      </div>

      {/* Active Breaches Alert */}
      {metrics && metrics.activeBreaches > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>{metrics.activeBreaches}</strong> active SLA breach{metrics.activeBreaches > 1 ? 'es' : ''} requiring immediate attention!
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.complianceRate ? `${metrics.complianceRate.toFixed(1)}%` : '0%'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {metrics?.breachTrend === 'improving' ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : metrics?.breachTrend === 'declining' ? (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              ) : (
                <Calendar className="h-3 w-3 mr-1" />
              )}
              {metrics?.breachTrend === 'improving' ? 'Improving' : 
               metrics?.breachTrend === 'declining' ? 'Declining' : 'Stable'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Breaches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.activeBreaches || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 mr-1" />
              Requires immediate attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Breaches</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics?.breachedRequests || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>of {metrics?.totalRequests || 0} total requests</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.avgResolutionTime ? `${metrics.avgResolutionTime.toFixed(1)}h` : '0h'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Average completion time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Compliance Overview</CardTitle>
          <CardDescription>Performance against service level agreements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Compliance Rate</span>
                <span className="text-lg font-bold">
                  {metrics?.complianceRate ? `${metrics.complianceRate.toFixed(1)}%` : '0%'}
                </span>
              </div>
              <Progress value={metrics?.complianceRate || 0} className="h-3" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-3">Breach Distribution by Priority</h4>
                <div className="space-y-3">
                  {metrics && Object.entries(metrics.breachByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          priority === 'urgent' ? 'bg-red-500' :
                          priority === 'high' ? 'bg-orange-500' :
                          priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="capitalize">{priority}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Performance Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">On-time Completions</span>
                    <span className="font-semibold text-green-600">{metrics?.onTimeRequests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">SLA Breaches</span>
                    <span className="font-semibold text-red-600">{metrics?.breachedRequests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Breaches</span>
                    <span className="font-semibold text-orange-600">{metrics?.activeBreaches || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Breaches */}
      {activeBreaches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Active SLA Breaches
            </CardTitle>
            <CardDescription>Requests currently exceeding SLA deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeBreaches.map((breach) => (
                <div key={breach.id} className={`p-4 border rounded-lg ${getSeverityColor(breach.priority, true)}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{breach.title}</h4>
                      <p className="text-sm opacity-80">{breach.category}</p>
                    </div>
                    <Badge variant="destructive">{breach.priority.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Breach Duration: <strong>{formatDuration(breach.breachDuration)}</strong></span>
                    <span>Status: <strong>{breach.status.replace('_', ' ').toUpperCase()}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Breaches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent SLA Breaches</CardTitle>
          <CardDescription>Historical view of SLA violations and their impact</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBreaches.length > 0 ? (
            <div className="space-y-4">
              {recentBreaches.map((breach) => (
                <div key={breach.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{breach.title}</h4>
                      <p className="text-sm text-muted-foreground">{breach.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={getSeverityColor(breach.priority)}>
                        {breach.priority.toUpperCase()}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(breach.slaBreachAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Breach Duration:</span>
                      <span className="ml-2 font-semibold">{formatDuration(breach.breachDuration)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 font-semibold">{breach.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-semibold">Excellent SLA Performance!</p>
              <p>No SLA breaches in the selected time period.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};