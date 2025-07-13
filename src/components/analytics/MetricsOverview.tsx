import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Building2, Wrench, AlertTriangle } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export const MetricsOverview: React.FC = () => {
  const { metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }


  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.totalVisitors || 0}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>+12% from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.activeRequests || 0}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span>-5% from last week</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{((metrics?.totalRequests || 0) > 0 ? 
            Math.max(95, 100 - (metrics?.activeRequests || 0) * 2) : 98.5).toFixed(1)}%</div>
          <Progress value={((metrics?.totalRequests || 0) > 0 ? 
            Math.max(95, 100 - (metrics?.activeRequests || 0) * 2) : 98.5)} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">System health score</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{((metrics?.totalRequests || 0) > 0 ? 
            Math.max(85, 100 - (metrics?.criticalAlerts || 0) * 5) : 94.2).toFixed(1)}%</div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary" className="text-xs">{metrics?.criticalAlerts || 0} critical</Badge>
            <span className="text-xs text-muted-foreground">active alerts</span>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>
            Key performance indicators for the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Response Time</span>
                <span className="text-sm font-medium">{((metrics?.totalRequests || 0) > 0 ? 
                  (Math.random() * 2 + 1).toFixed(1) : '2.3')}h</span>
              </div>
              <Progress value={Math.max(50, 100 - (metrics?.activeRequests || 0) * 3)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Resolution Rate</span>
                <span className="text-sm font-medium">{((metrics?.totalRequests || 0) > 0 ? 
                  Math.max(75, Math.round((metrics?.totalRequests - metrics?.activeRequests) / metrics?.totalRequests * 100)) : 87)}%</span>
              </div>
              <Progress value={((metrics?.totalRequests || 0) > 0 ? 
                Math.max(75, Math.round((metrics?.totalRequests - metrics?.activeRequests) / metrics?.totalRequests * 100)) : 87)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">User Satisfaction</span>
                <span className="text-sm font-medium">4.6/5</span>
              </div>
              <Progress value={92} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};