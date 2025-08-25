import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp,
  Target,
  RefreshCw
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { useAuth } from '@/components/AuthProvider';

const EnhancedDashboardStats = () => {
  const { metrics, isLoading, error, refetch } = useDashboardData();
  const { isStaff } = useAuth();

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const getSLAStatus = (compliance: number) => {
    if (compliance >= 95) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent' };
    if (compliance >= 85) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Good' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Needs Attention' };
  };

  const stats = [
    {
      title: 'Total Requests',
      value: metrics.totalRequests,
      description: 'All maintenance requests',
      icon: ClipboardList,
      trend: metrics.totalRequests > 0 ? '+12%' : '0%',
      trendDirection: 'up' as const,
    },
    {
      title: 'Pending',
      value: metrics.pendingRequests,
      description: 'Awaiting assignment',
      icon: Clock,
      trend: metrics.pendingRequests > 5 ? 'High' : 'Normal',
      trendDirection: metrics.pendingRequests > 5 ? 'up' : 'down' as const,
    },
    {
      title: 'Completed',
      value: metrics.completedRequests,
      description: 'Successfully resolved',
      icon: CheckCircle,
      trend: '+8%',
      trendDirection: 'up' as const,
    },
    {
      title: 'SLA Breaches',
      value: metrics.slaBreaches,
      description: 'Overdue requests',
      icon: AlertTriangle,
      trend: metrics.slaBreaches === 0 ? 'None' : `${metrics.slaBreaches}`,
      trendDirection: metrics.slaBreaches === 0 ? 'down' : 'up' as const,
    },
  ];

  const staffStats = isStaff ? [
    {
      title: 'Active Visitors',
      value: metrics.activeVisitors,
      description: 'Currently in building',
      icon: Users,
      trend: `${metrics.totalVisitors} today`,
      trendDirection: 'neutral' as const,
    },
    {
      title: 'Upcoming Bookings',
      value: metrics.upcomingBookings,
      description: 'Room reservations',
      icon: Calendar,
      trend: 'Next 24h',
      trendDirection: 'neutral' as const,
    },
  ] : [
    {
      title: 'Your Bookings',
      value: metrics.upcomingBookings,
      description: 'Upcoming reservations',
      icon: Calendar,
      trend: 'Next 7 days',
      trendDirection: 'neutral' as const,
    },
  ];

  const performanceStats = [
    {
      title: 'Avg. Completion Time',
      value: formatTime(metrics.avgCompletionTime),
      description: 'Response efficiency',
      icon: TrendingUp,
      progress: Math.min((24 - metrics.avgCompletionTime) / 24 * 100, 100),
    },
    {
      title: 'SLA Compliance',
      value: `${Math.round(metrics.slaCompliance)}%`,
      description: getSLAStatus(metrics.slaCompliance).label,
      icon: Target,
      progress: metrics.slaCompliance,
      status: getSLAStatus(metrics.slaCompliance),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load dashboard data: {error.message}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="ml-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <LoadingWrapper loading={isLoading} error={null}>
        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index} className="glass-card hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                    <Badge 
                      variant={stat.trendDirection === 'up' ? 'destructive' : 'secondary'} 
                      className="text-xs"
                    >
                      {stat.trend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staffStats.map((stat, index) => (
              <Card key={index} className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  <p className="text-xs text-primary mt-1">{stat.trend}</p>
                </CardContent>
              </Card>
            ))}

            {/* Performance Stats with Progress */}
            {performanceStats.map((stat, index) => (
              <Card key={index} className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  <div className="mt-3">
                    <Progress 
                      value={stat.progress} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  {stat.status && (
                    <Badge 
                      className={`mt-2 ${stat.status.bg} ${stat.status.color}`}
                      variant="secondary"
                    >
                      {stat.status.label}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </LoadingWrapper>
    </div>
  );
};

export default EnhancedDashboardStats;