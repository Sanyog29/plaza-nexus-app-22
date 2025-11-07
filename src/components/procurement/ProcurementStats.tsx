import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, CheckCircle, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';

export const ProcurementStats = () => {
  const { userRole } = useAuth();
  const { navigate } = useNavigationTransition();
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['procurement-stats', userRole],
    queryFn: async () => {
      let query = supabase
        .from('requisition_lists')
        .select('status', { count: 'exact' });

      // Role-based filtering - Procurement roles only see approved and later stages
      if (userRole === 'purchase_executive' || userRole === 'procurement_manager') {
        // Both procurement roles should only see approved or later stage requisitions
        query = query.in('status', [
          'manager_approved',
          'assigned_to_procurement',
          'po_raised',
          'po_created',
          'in_transit',
          'received',
          'closed'
        ]);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.debug('[ProcurementStats] Query result:', { 
        userRole, 
        dataCount: data?.length || 0,
        statuses: data?.map(d => d.status) 
      });

      // Get PO count
      const { count: poCount } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true });

      const statusCounts = {
        active: 0,
        pending: 0,
        approved: 0,
        total: data?.length || 0,
        poCreated: poCount || 0
      };

      data?.forEach(item => {
        if (item.status === 'pending_manager_approval') statusCounts.pending++;
        else if (item.status === 'manager_approved') statusCounts.approved++;
        else if (item.status === 'assigned_to_procurement' || item.status === 'po_raised' || item.status === 'po_created') statusCounts.active++;
      });

      return statusCounts;
    }
  });

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('procurement-stats-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requisition_lists',
          filter: `status=in.(manager_approved,assigned_to_procurement,po_raised,in_transit,received,closed)`
        },
        (payload) => {
          console.debug('[ProcurementStats] Realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['procurement-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading procurement statistics: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  // Show helpful message if no data for procurement roles
  if ((userRole === 'purchase_executive' || userRole === 'procurement_manager') && stats?.total === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No requisitions visible. You might not have permission to view approved requisitions. 
          Ask an admin to grant procurement read access for approved/later statuses.
        </AlertDescription>
      </Alert>
    );
  }

  const statCards = [
    {
      title: 'Total Requisitions',
      value: stats?.total || 0,
      description: 'All requisition lists',
      icon: Package,
      color: 'text-blue-600',
      onClick: undefined
    },
    {
      title: 'Pending Approval',
      value: stats?.pending || 0,
      description: 'Awaiting review',
      icon: Clock,
      color: 'text-orange-600',
      onClick: undefined
    },
    {
      title: 'Approved',
      value: stats?.approved || 0,
      description: 'Ready for purchase',
      icon: CheckCircle,
      color: 'text-green-600',
      onClick: undefined
    },
    {
      title: 'POs Created',
      value: stats?.poCreated || 0,
      description: 'Purchase orders',
      icon: ShoppingCart,
      color: 'text-indigo-600',
      onClick: () => navigate('/procurement/orders')
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title} 
            className={`hover:shadow-lg transition-shadow ${stat.onClick ? 'cursor-pointer' : ''}`}
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
