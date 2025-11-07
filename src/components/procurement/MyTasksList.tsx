import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Calendar, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';

interface MyTasksListProps {
  filter?: 'draft' | 'pending_manager_approval' | 'manager_approved' | 'all';
}

export const MyTasksList = ({ filter = 'all' }: MyTasksListProps) => {
  const { userRole } = useAuth();
  const { navigate } = useNavigationTransition();
  
  const { data: requisitions, isLoading } = useQuery({
    queryKey: ['my-requisitions', filter, userRole],
    queryFn: async () => {
      let query = supabase
        .from('requisition_lists')
        .select('*')
        .order('created_at', { ascending: false });

      // Role-based filtering - Procurement roles only see approved and later stages
      if (userRole === 'purchase_executive' || userRole === 'procurement_manager') {
        // Both procurement roles should only see approved or later stage requisitions
        query = query.in('status', [
          'manager_approved',
          'assigned_to_procurement',
          'po_raised',
          'in_transit',
          'received',
          'closed'
        ]);
      }

      // Apply additional filter if specified
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      pending_manager_approval: { variant: 'default' as const, label: 'Pending' },
      manager_approved: { variant: 'default' as const, label: 'Approved' },
      manager_rejected: { variant: 'destructive' as const, label: 'Rejected' },
      closed: { variant: 'outline' as const, label: 'Closed' },
      assigned_to_procurement: { variant: 'default' as const, label: 'Assigned' },
      po_raised: { variant: 'default' as const, label: 'PO Raised' },
      in_transit: { variant: 'default' as const, label: 'In Transit' },
      received: { variant: 'default' as const, label: 'Received' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { className: 'bg-red-100 text-red-800 border-red-300', label: 'Urgent' },
      high: { className: 'bg-orange-100 text-orange-800 border-orange-300', label: 'High' },
      medium: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Medium' },
      low: { className: 'bg-green-100 text-green-800 border-green-300', label: 'Low' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!requisitions || requisitions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No requisitions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requisitions.map((req) => (
        <Card key={req.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  List #{req.id.slice(0, 8)}
                  {getStatusBadge(req.status)}
                  {getPriorityBadge(req.priority)}
                </CardTitle>
                <CardDescription className="mt-2">
                  {req.property_id || 'No property assigned'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(req.created_at), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{req.created_by_name || 'Unknown'}</span>
              </div>
              {req.expected_delivery_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Due: {format(new Date(req.expected_delivery_date), 'MMM dd')}</span>
                </div>
              )}
              <div className="flex justify-end md:col-span-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/procurement/requisitions/${req.id}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
