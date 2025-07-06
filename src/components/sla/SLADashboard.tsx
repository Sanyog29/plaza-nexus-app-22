import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { useSLAMonitoring } from '@/hooks/useSLAMonitoring';
import { useAuth } from '@/components/AuthProvider';

export const SLADashboard: React.FC = () => {
  const { metrics, recentBreaches, isLoading, runSLAChecker, formatTimeRemaining } = useSLAMonitoring();
  const { isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SLA Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.complianceRate.toFixed(1)}%
            </div>
            <Progress value={metrics.complianceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.totalRequests - metrics.breachedRequests} of {metrics.totalRequests} requests on time
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">SLA Breaches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {metrics.breachedRequests}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Warning Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {metrics.warningRequests}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Approaching SLA deadline
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Penalties</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              ${metrics.totalPenalties.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 30 days cost impact
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">SLA Monitoring</h3>
          <p className="text-sm text-muted-foreground">
            Real-time service level agreement tracking
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={runSLAChecker} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Run SLA Check
          </Button>
        )}
      </div>

      {/* Recent SLA Breaches */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Recent SLA Breaches</CardTitle>
          <CardDescription>Latest service level violations and penalties</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBreaches.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-white font-medium">No SLA Breaches!</p>
              <p className="text-sm text-muted-foreground">All requests are meeting service level targets</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBreaches.slice(0, 10).map((breach) => (
                <div key={breach.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive" className="text-xs">
                        {breach.escalation_type.toUpperCase()}
                      </Badge>
                      <span className="font-medium text-white">
                        {breach.request_title}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {breach.escalation_reason}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Priority: {breach.request_priority}</span>
                      <span>Status: {breach.request_status}</span>
                      <span>{new Date(breach.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-400">
                      ${breach.penalty_amount.toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Penalty</p>
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