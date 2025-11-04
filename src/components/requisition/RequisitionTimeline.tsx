import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Circle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface RequisitionTimelineProps {
  requisitionId: string;
}

export const RequisitionTimeline: React.FC<RequisitionTimelineProps> = ({
  requisitionId,
}) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['requisition-history', requisitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_status_history')
        .select('*')
        .eq('requisition_list_id', requisitionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No status history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <Circle
                  className={`h-3 w-3 ${
                    index === 0 ? 'fill-primary text-primary' : 'fill-muted text-muted'
                  }`}
                />
                {index < history.length - 1 && (
                  <div className="w-0.5 h-full bg-muted my-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">
                  {entry.new_status.replace(/_/g, ' ').toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(entry.created_at), 'PPP p')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  By: {entry.changed_by_role}
                </p>
                {entry.remarks && (
                  <p className="text-sm mt-2 p-2 bg-muted rounded">
                    {entry.remarks}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
