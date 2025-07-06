import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Database
} from 'lucide-react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useDatabaseOptimization } from '@/hooks/useDatabaseOptimization';

interface SystemHealthWidgetProps {
  variant?: 'compact' | 'detailed';
  showTraining?: boolean;
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({ 
  variant = 'compact',
  showTraining = false 
}) => {
  const { getPerformanceSummary, alerts, isMonitoring } = usePerformanceMonitoring();
  const { databaseHealth } = useDatabaseOptimization();
  
  const performanceSummary = getPerformanceSummary();

  if (variant === 'compact') {
    return (
      <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`${performanceSummary.systemHealth.overall === 'healthy' ? 'bg-green-500/20' : 
              performanceSummary.systemHealth.overall === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'} p-2 rounded-full`}>
              {performanceSummary.systemHealth.overall === 'healthy' ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : performanceSummary.systemHealth.overall === 'warning' ? (
                <AlertTriangle size={20} className="text-yellow-500" />
              ) : (
                <AlertTriangle size={20} className="text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">System Health</p>
              <p className={`text-xs ${
                performanceSummary.systemHealth.overall === 'healthy' ? 'text-green-500' : 
                performanceSummary.systemHealth.overall === 'warning' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {performanceSummary.systemHealth.overall === 'healthy' ? 'All systems operational' : 
                 performanceSummary.systemHealth.overall === 'warning' ? 'Minor issues detected' : 'Critical issues detected'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">System Status</p>
              <p className="text-2xl font-bold text-foreground">
                {performanceSummary.systemHealth.overall === 'healthy' ? '✓' : '⚠'}
              </p>
            </div>
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">DB Health</p>
              <p className="text-2xl font-bold text-foreground">
                {databaseHealth?.optimizationScore || 0}%
              </p>
            </div>
            <Database className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round(performanceSummary.averageResponseTime)}ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {showTraining && (
        <Card className="bg-card/50 backdrop-blur md:col-span-2 lg:col-span-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Training Available</p>
                <p className="text-xs text-muted-foreground">
                  Interactive training modules for system features
                </p>
              </div>
              <Badge variant="secondary">New</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};