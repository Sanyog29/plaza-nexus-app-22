import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EfficiencyGaugeProps {
  score: number;
  label?: string;
  loading?: boolean;
}

export const EfficiencyGauge: React.FC<EfficiencyGaugeProps> = ({ 
  score, 
  label = "Overall Efficiency Score",
  loading 
}) => {
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="hsl(var(--border))"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={score >= 80 ? 'hsl(var(--success))' : score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold", getScoreColor(score))}>
                {score.toFixed(0)}
              </span>
              <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className={cn("text-lg font-semibold", getScoreColor(score))}>
            {getScoreLabel(score)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on completion rate, SLA compliance, and response time
          </p>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Excellent</span>
            <span className="text-green-600">80-100</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Good</span>
            <span className="text-yellow-600">60-79</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Fair</span>
            <span className="text-orange-600">40-59</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Needs Improvement</span>
            <span className="text-red-600">0-39</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};