import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  format?: 'currency' | 'percentage' | 'number';
}

interface MetricsGridProps {
  metrics: Metric[];
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  const formatValue = (value: string | number, format?: string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    switch (format) {
      case 'currency':
        return `$${numValue.toFixed(2)}`;
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      default:
        return numValue.toString();
    }
  };

  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (change?: number) => {
    if (!change) return 'text-muted-foreground';
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatValue(metric.value, metric.format)}
            </div>
            {metric.change !== undefined && (
              <div className={`flex items-center text-xs ${getTrendColor(metric.change)}`}>
                {getTrendIcon(metric.change)}
                <span className="ml-1">
                  {Math.abs(metric.change).toFixed(1)}% from last period
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricsGrid;