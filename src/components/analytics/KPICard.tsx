import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'default' | 'success' | 'warning' | 'error';
  onClick?: () => void;
  loading?: boolean;
}

const colorVariants = {
  default: 'border-border',
  success: 'border-green-500/50 bg-green-500/5',
  warning: 'border-yellow-500/50 bg-yellow-500/5',
  error: 'border-red-500/50 bg-red-500/5',
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'default',
  onClick,
  loading = false
}) => {
  const TrendIcon = trend 
    ? trend.value > 0 
      ? TrendingUp 
      : trend.value < 0 
        ? TrendingDown 
        : Minus
    : null;

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-lg",
        colorVariants[color],
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold text-foreground">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && TrendIcon && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                <TrendIcon className="h-3 w-3" />
                <span>{Math.abs(trend.value).toFixed(1)}%</span>
                {trend.label && (
                  <span className="text-muted-foreground ml-1">{trend.label}</span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};