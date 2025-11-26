import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarIcon, User, Building } from 'lucide-react';

interface RequisitionHeaderProps {
  requisition: any;
}

export const RequisitionHeader: React.FC<RequisitionHeaderProps> = ({
  requisition,
}) => {
  const statusColors: Record<string, string> = {
    draft: 'secondary',
    pending_manager_approval: 'default',
    manager_approved: 'default',
    manager_rejected: 'destructive',
    assigned_to_procurement: 'default',
    po_raised: 'default',
    in_transit: 'default',
    received: 'default',
    closed: 'secondary',
    cancelled: 'destructive',
  };

  const priorityColors = {
    low: 'secondary',
    normal: 'default',
    high: 'default',
    urgent: 'destructive',
  } as const;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building className="h-4 w-4" />
              Property
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-sm py-1 px-3">
              {requisition.property?.name || 'No property assigned'}
            </Badge>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              Created By
            </div>
            <p className="font-semibold">{requisition.created_by_name}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CalendarIcon className="h-4 w-4" />
              Created Date
            </div>
            <p className="font-semibold">
              {format(new Date(requisition.created_at), 'PPP')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t">
          <div>
            <span className="text-sm text-muted-foreground">Status: </span>
            <Badge variant={statusColors[requisition.status] as any}>
              {requisition.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Priority: </span>
            <Badge variant={priorityColors[requisition.priority as keyof typeof priorityColors]}>
              {requisition.priority.toUpperCase()}
            </Badge>
          </div>
          {requisition.expected_delivery_date && (
            <div>
              <span className="text-sm text-muted-foreground">Expected Delivery: </span>
              <span className="font-medium">
                {format(new Date(requisition.expected_delivery_date), 'PPP')}
              </span>
            </div>
          )}
        </div>

        {requisition.notes && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Notes:</p>
            <p className="text-sm text-muted-foreground">{requisition.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
