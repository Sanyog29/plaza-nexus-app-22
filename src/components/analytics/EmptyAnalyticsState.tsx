import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BarChart3, TrendingUp } from 'lucide-react';

interface EmptyAnalyticsStateProps {
  title?: string;
  description?: string;
  type?: 'visitor' | 'security' | 'maintenance';
}

export const EmptyAnalyticsState: React.FC<EmptyAnalyticsStateProps> = ({
  title = "No Data Available",
  description = "No data found for the selected time period.",
  type = 'visitor'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'visitor': return Users;
      case 'security': return BarChart3;
      case 'maintenance': return TrendingUp;
      default: return BarChart3;
    }
  };

  const Icon = getIcon();

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-md">{description}</p>
      </CardContent>
    </Card>
  );
};