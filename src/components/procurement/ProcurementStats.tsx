import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export const ProcurementStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['procurement-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_lists')
        .select('status', { count: 'exact' });

      if (error) throw error;

      const statusCounts = {
        active: 0,
        pending: 0,
        approved: 0,
        total: data?.length || 0
      };

      data?.forEach(item => {
        if (item.status === 'pending_manager_approval') statusCounts.pending++;
        else if (item.status === 'manager_approved') statusCounts.approved++;
        else statusCounts.active++;
      });

      return statusCounts;
    }
  });

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

  const statCards = [
    {
      title: 'Total Requisitions',
      value: stats?.total || 0,
      description: 'All requisition lists',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Approval',
      value: stats?.pending || 0,
      description: 'Awaiting review',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Approved',
      value: stats?.approved || 0,
      description: 'Ready for purchase',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'In Progress',
      value: stats?.active || 0,
      description: 'Active requisitions',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
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
