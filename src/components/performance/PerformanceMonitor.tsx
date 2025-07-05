import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useRealtimeRequests } from '@/hooks/useRealtimeUpdates';

interface PerformanceMetrics {
  responseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  uptime: number;
  activeSessions: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    requestsPerMinute: 0,
    errorRate: 0,
    uptime: 99.9,
    activeSessions: 0
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isConnected } = useRealtimeRequests();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Simulate performance metrics (in real app, get from actual monitoring)
    const interval = setInterval(() => {
      setMetrics(prev => ({
        responseTime: Math.floor(Math.random() * 100) + 50,
        requestsPerMinute: Math.floor(Math.random() * 50) + 10,
        errorRate: Math.random() * 2,
        uptime: prev.uptime + (Math.random() - 0.5) * 0.01,
        activeSessions: Math.floor(Math.random() * 20) + 5
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, type: 'response' | 'error' | 'uptime') => {
    switch (type) {
      case 'response':
        if (value < 100) return 'text-green-400';
        if (value < 200) return 'text-yellow-400';
        return 'text-red-400';
      case 'error':
        if (value < 1) return 'text-green-400';
        if (value < 3) return 'text-yellow-400';
        return 'text-red-400';
      case 'uptime':
        if (value > 99) return 'text-green-400';
        if (value > 95) return 'text-yellow-400';
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatUptime = (uptime: number) => {
    return `${Math.max(0, Math.min(100, uptime)).toFixed(2)}%`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">System Performance</h3>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? 'Real-time Connected' : 'Offline'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">Response Time</span>
            </div>
            {metrics.responseTime < 100 ? (
              <TrendingDown className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(metrics.responseTime, 'response')}`}>
            {metrics.responseTime}ms
          </div>
          <Progress 
            value={Math.min(100, (metrics.responseTime / 500) * 100)} 
            className="mt-2"
          />
        </Card>

        <Card className="p-4 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-400">Requests/min</span>
            </div>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            {metrics.requestsPerMinute}
          </div>
          <Progress 
            value={(metrics.requestsPerMinute / 100) * 100} 
            className="mt-2"
          />
        </Card>

        <Card className="p-4 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-400" />
              <span className="text-sm text-gray-400">Error Rate</span>
            </div>
            {metrics.errorRate < 1 ? (
              <TrendingDown className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(metrics.errorRate, 'error')}`}>
            {metrics.errorRate.toFixed(1)}%
          </div>
          <Progress 
            value={Math.min(100, (metrics.errorRate / 10) * 100)} 
            className="mt-2"
          />
        </Card>

        <Card className="p-4 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-400">Uptime</span>
            </div>
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(metrics.uptime, 'uptime')}`}>
            {formatUptime(metrics.uptime)}
          </div>
          <Progress 
            value={Math.max(0, Math.min(100, metrics.uptime))} 
            className="mt-2"
          />
        </Card>
      </div>

      <Card className="p-4 bg-gray-800 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-white">Active Sessions</h4>
          <Badge variant="outline">{metrics.activeSessions} users</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Current Load</span>
            <span className="text-white">{Math.round((metrics.activeSessions / 50) * 100)}%</span>
          </div>
          <Progress value={(metrics.activeSessions / 50) * 100} />
        </div>
      </Card>
    </div>
  );
}