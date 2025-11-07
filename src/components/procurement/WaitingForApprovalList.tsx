import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Package, AlertCircle, Eye } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';

export const WaitingForApprovalList = () => {
  const { navigate } = useNavigationTransition();

  const { data: requisitions, isLoading, isError, error } = useQuery({
    queryKey: ['waiting-for-approval'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_lists')
        .select('id, order_number, status, priority, created_at, created_by, property_id')
        .eq('status', 'pending_manager_approval')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!data || data.length === 0) return [];
      
      // Fetch related data separately
      const propertyIds = [...new Set(data.map((r: any) => r.property_id))];
      const userIds = [...new Set(data.map((r: any) => r.created_by))];
      
      const { data: properties } = await supabase
        .from('properties')
        .select('id, name')
        .in('id', propertyIds);
      
      const { data: users } = await supabase
        .from('profiles_public')
        .select('*')
        .in('id', userIds) as any;
      
      return data.map((req: any) => ({
        ...req,
        properties: properties?.find((p: any) => p.id === req.property_id),
        user_profile: users?.find((u: any) => u.id === req.created_by)
      }));
    },
    refetchInterval: 30000
  });

  // Fetch approvers for each requisition
  const { data: approversData } = useQuery({
    queryKey: ['approvers-for-requisitions', requisitions?.map(r => r.property_id)],
    queryFn: async () => {
      if (!requisitions || requisitions.length === 0) return {};

      const propertyIds = [...new Set(requisitions.map(r => r.property_id))];
      const approversMap: Record<string, any[]> = {};

      for (const propertyId of propertyIds) {
        const { data } = await supabase
          .from('property_approvers')
          .select('id, approver_user_id')
          .eq('property_id', propertyId)
          .eq('is_active', true);

        if (data && data.length > 0) {
          const userIds = data.map((a: any) => a.approver_user_id);
          const { data: profiles } = await supabase
            .from('profiles_public')
            .select('*')
            .in('id', userIds) as any;
          
          approversMap[propertyId] = data.map((approver: any) => ({
            ...approver,
            user_profile: profiles?.find((p: any) => p.id === approver.approver_user_id)
          }));
        }
      }

      return approversMap;
    },
    enabled: !!requisitions && requisitions.length > 0
  });

  const getTimeSinceCreation = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  };

  const isOverdue = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const hours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    return hours > 24;
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
              <Skeleton className="h-16 w-full" />
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
          Error loading pending requisitions: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!requisitions || requisitions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-2">No requisitions waiting for approval</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            All requisitions have been processed by managers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Requisitions Waiting for Approval</h3>
          <p className="text-sm text-muted-foreground">
            {requisitions.length} requisition{requisitions.length !== 1 ? 's' : ''} pending manager review
          </p>
        </div>
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          Read-only View
        </Badge>
      </div>

      {requisitions.map((req: any) => {
        const overdue = isOverdue(req.created_at);
        const approvers = approversData?.[req.property_id] || [];

        return (
          <Card 
            key={req.id} 
            className={`hover:shadow-md transition-shadow ${overdue ? 'border-orange-500 border-2' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <span>{req.order_number}</span>
                    <Badge variant="default">Pending</Badge>
                    {getPriorityBadge(req.priority)}
                    {overdue && (
                      <Badge variant="destructive">
                        Overdue (&gt;24h)
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {req.properties?.name || 'Unknown Property'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Created by:</p>
                    <p className="font-medium">
                      {req.user_profile?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Submitted:</p>
                    <p className="font-medium">
                      {getTimeSinceCreation(req.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(req.created_at), 'MMM dd, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>

                {approvers.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Waiting for approval from:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {approvers.map((approver: any) => (
                        <div 
                          key={approver.id}
                          className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1.5"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10">
                              {approver.user_profile?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {approver.user_profile?.full_name || 'Unknown'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/procurement/requisitions/${req.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
