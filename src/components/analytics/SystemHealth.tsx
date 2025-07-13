import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

const systemComponents = [
  {
    name: 'Database',
    status: 'healthy',
    uptime: 99.9,
    responseTime: '12ms',
    lastCheck: '2 minutes ago'
  },
  {
    name: 'Authentication Service',
    status: 'healthy',
    uptime: 99.8,
    responseTime: '45ms',
    lastCheck: '1 minute ago'
  },
  {
    name: 'File Storage',
    status: 'warning',
    uptime: 98.5,
    responseTime: '156ms',
    lastCheck: '3 minutes ago'
  },
  {
    name: 'Email Service',
    status: 'healthy',
    uptime: 99.7,
    responseTime: '89ms',
    lastCheck: '1 minute ago'
  },
  {
    name: 'Background Jobs',
    status: 'error',
    uptime: 95.2,
    responseTime: 'N/A',
    lastCheck: '15 minutes ago'
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'healthy':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Healthy</Badge>;
    case 'warning':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const SystemHealth: React.FC = () => {
  const overallHealth = systemComponents.reduce((acc, comp) => acc + comp.uptime, 0) / systemComponents.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">System Health Monitor</h3>
          <p className="text-sm text-muted-foreground">
            Real-time status of all system components
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Overall System Health
            {overallHealth > 99 ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : overallHealth > 95 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>
            Aggregate health score across all services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{overallHealth.toFixed(1)}%</span>
              <Badge variant={overallHealth > 99 ? "secondary" : overallHealth > 95 ? "outline" : "destructive"}>
                {overallHealth > 99 ? "Excellent" : overallHealth > 95 ? "Good" : "Poor"}
              </Badge>
            </div>
            <Progress value={overallHealth} className="h-2" />
            <p className="text-sm text-muted-foreground">
              System is performing {overallHealth > 99 ? "excellently" : overallHealth > 95 ? "well" : "below expectations"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {systemComponents.map((component) => (
          <Card key={component.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{component.name}</CardTitle>
                {getStatusIcon(component.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(component.status)}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">{component.uptime}%</span>
                </div>
                <Progress value={component.uptime} className="h-1" />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Time</span>
                <span className="font-medium">{component.responseTime}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Check</span>
                <span className="font-medium">{component.lastCheck}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>
            System incidents and outages in the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Slow database queries</p>
                <p className="text-xs text-muted-foreground">Jan 15, 2024 - Resolved in 23 minutes</p>
              </div>
              <Badge variant="outline">Resolved</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <XCircle className="h-4 w-4 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email service outage</p>
                <p className="text-xs text-muted-foreground">Jan 12, 2024 - Resolved in 1 hour 15 minutes</p>
              </div>
              <Badge variant="outline">Resolved</Badge>
            </div>

            <div className="text-center text-sm text-muted-foreground py-4">
              No other incidents in the past 30 days
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};