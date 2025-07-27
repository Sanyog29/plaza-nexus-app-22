import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Star, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Users
} from 'lucide-react';

interface VendorPerformanceTrackerProps {
  vendorId: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export default function VendorPerformanceTracker({ vendorId }: VendorPerformanceTrackerProps) {
  // Mock performance data
  const { data: performanceMetrics = [] } = useQuery({
    queryKey: ['vendor-performance', vendorId],
    queryFn: async () => {
      // Mock performance data
      const metrics: PerformanceMetric[] = [
        {
          name: 'Order Fulfillment Rate',
          value: 96.5,
          target: 95,
          trend: 'up',
          unit: '%',
          status: 'good'
        },
        {
          name: 'Average Preparation Time',
          value: 12.8,
          target: 15,
          trend: 'down',
          unit: 'min',
          status: 'good'
        },
        {
          name: 'Customer Rating',
          value: 4.7,
          target: 4.5,
          trend: 'up',
          unit: '/5',
          status: 'good'
        },
        {
          name: 'Order Accuracy',
          value: 89.2,
          target: 95,
          trend: 'down',
          unit: '%',
          status: 'warning'
        },
        {
          name: 'Revenue Growth',
          value: 15.6,
          target: 10,
          trend: 'up',
          unit: '%',
          status: 'good'
        },
        {
          name: 'Customer Complaints',
          value: 2.1,
          target: 5,
          trend: 'stable',
          unit: '%',
          status: 'good'
        }
      ];
      
      return metrics;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Dashboard
          </CardTitle>
          <CardDescription>
            Track key performance indicators and service quality metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics.map((metric, index) => (
              <Card key={index} className="bg-card/30 backdrop-blur">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{metric.name}</h4>
                      {getStatusIcon(metric.status)}
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold">
                          {metric.value}{metric.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Target: {metric.target}{metric.unit}
                        </p>
                      </div>
                      {getTrendIcon(metric.trend)}
                    </div>
                    
                    <Progress 
                      value={(metric.value / metric.target) * 100} 
                      className="h-2"
                    />
                    
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Orders Processed</span>
              <span className="font-medium">47</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Time</span>
              <span className="font-medium">11.2 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Customer Rating</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-medium">4.8</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Revenue</span>
              <span className="font-medium">₹3,240</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Repeat Customers</span>
              <span className="font-medium">68%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Peak Hours</span>
              <span className="font-medium">12-2 PM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Most Popular Item</span>
              <span className="font-medium">Coffee</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Feedback Score</span>
              <span className="font-medium">9.2/10</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}