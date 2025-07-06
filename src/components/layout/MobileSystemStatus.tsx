import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useAuth } from '@/components/AuthProvider';

export const MobileSystemStatus: React.FC = () => {
  const { getPerformanceSummary, alerts } = usePerformanceMonitoring();
  const { isStaff, isAdmin } = useAuth();
  
  const performanceSummary = getPerformanceSummary();

  // Only show to staff/admin users
  if (!isStaff && !isAdmin) return null;

  return (
    <Card className="bg-card/50 backdrop-blur mx-4 mb-4">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${performanceSummary.systemHealth.overall === 'healthy' ? 'bg-green-500/20' : 
              performanceSummary.systemHealth.overall === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'} p-2 rounded-full`}>
              {performanceSummary.systemHealth.overall === 'healthy' ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertTriangle size={16} className="text-yellow-500" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">System Status</p>
              <p className="text-xs text-muted-foreground">
                {alerts.length} alerts • {Math.round(performanceSummary.averageResponseTime)}ms avg
              </p>
            </div>
          </div>
          <Badge variant={performanceSummary.systemHealth.overall === 'healthy' ? 'default' : 'destructive'} className="text-xs">
            {performanceSummary.systemHealth.overall}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};