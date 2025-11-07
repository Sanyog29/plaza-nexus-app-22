import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ApprovalStatusCardProps {
  requisitionId: string;
  propertyId: string;
  status: string;
  createdAt: string;
}

export const ApprovalStatusCard = ({ 
  requisitionId, 
  propertyId, 
  status, 
  createdAt 
}: ApprovalStatusCardProps) => {
  
  const { data: approvers, isLoading } = useQuery({
    queryKey: ['approvers', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_approvers')
        .select('id, is_active, approver_user_id')
        .eq('property_id', propertyId)
        .eq('is_active', true);
      
      if (error) throw error;
      if (!data || data.length === 0) return [];
      
      // Fetch user profiles separately
      const userIds = data.map((a: any) => a.approver_user_id);
      const { data: profiles } = await supabase
        .from('profiles_public')
        .select('*')
        .in('id', userIds) as any;
      
      return data.map((approver: any) => ({
        ...approver,
        user_profile: profiles?.find((p: any) => p.id === approver.approver_user_id)
      }));
    },
    enabled: !!propertyId
  });

  const { data: approvalHistory } = useQuery({
    queryKey: ['approval-history', requisitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_status_history')
        .select('*')
        .eq('requisition_list_id', requisitionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!requisitionId
  });

  const getStatusIcon = () => {
    switch (status) {
      case 'pending_manager_approval':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'manager_approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'manager_rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTimeSinceCreation = () => {
    const created = new Date(createdAt);
    const now = new Date();
    const hours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return 'Less than 1 hour ago';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const isOverdue = () => {
    const created = new Date(createdAt);
    const now = new Date();
    const hours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    return hours > 24 && status === 'pending_manager_approval';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isOverdue() ? 'border-orange-500 border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          Approval Status
          {isOverdue() && (
            <Badge variant="destructive" className="ml-auto">
              Overdue
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Time in current status:</span>
          <span className="font-medium">{getTimeSinceCreation()}</span>
        </div>

        {status === 'pending_manager_approval' && approvers && approvers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Waiting for approval from:
            </p>
            <div className="flex flex-wrap gap-2">
              {approvers.map((approver: any) => (
                <div 
                  key={approver.id}
                  className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {approver.user_profile?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {approver.user_profile?.full_name || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'manager_approved' && approvalHistory && approvalHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-green-600 font-medium">
              ✓ Approved and ready for procurement
            </p>
            {approvalHistory[0]?.remarks && (
              <p className="text-sm text-muted-foreground italic">
                "{approvalHistory[0].remarks}"
              </p>
            )}
          </div>
        )}

        {status === 'manager_rejected' && approvalHistory && approvalHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-red-600 font-medium">
              ✗ Rejected by manager
            </p>
            {approvalHistory[0]?.remarks && (
              <p className="text-sm text-muted-foreground italic">
                Reason: "{approvalHistory[0].remarks}"
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
