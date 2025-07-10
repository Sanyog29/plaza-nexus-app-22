import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface EmptyAnalyticsStateProps {
  onRefresh: () => void;
}

export const EmptyAnalyticsState: React.FC<EmptyAnalyticsStateProps> = ({ onRefresh }) => {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardContent className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Data Available</h3>
        <p className="text-muted-foreground mb-6">
          We couldn't load the analytics data. This might be due to insufficient data or a temporary issue.
        </p>
        <Button onClick={onRefresh} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  );
};