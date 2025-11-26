import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { useRequisitionApproval } from '@/hooks/useRequisitionApproval';
import { ApprovalDetailModal } from '@/components/requisition/ApprovalDetailModal';
import { useAuth } from '@/components/AuthProvider';

const PendingApprovalsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<string | null>(null);
  const { bulkApprove } = useRequisitionApproval();

  const { data: requisitions, isLoading } = useQuery({
    queryKey: ['pending-approvals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First, get property IDs where user is an active approver
      const { data: approverProperties, error: approverError } = await supabase
        .from('property_approvers')
        .select('property_id')
        .eq('approver_user_id', user.id)
        .eq('is_active', true);

      if (approverError) throw approverError;
      if (!approverProperties || approverProperties.length === 0) return [];

      const propertyIds = approverProperties.map(ap => ap.property_id);

      // Fetch requisitions for those properties
      const { data, error } = await supabase
        .from('requisition_lists')
        .select(`
          *,
          properties!fk_requisition_lists_property (
            name
          )
        `)
        .eq('status', 'pending_manager_approval')
        .in('property_id', propertyIds)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === requisitions?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requisitions?.map(r => r.id) || []);
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    bulkApprove.mutate(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const handleRowClick = (requisitionId: string) => {
    setSelectedRequisition(requisitionId);
    setDetailModalOpen(true);
  };

  const priorityColors = {
    low: 'secondary',
    normal: 'default',
    high: 'default',
    urgent: 'destructive',
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations Requisition Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve operational requisition requests
          </p>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={handleBulkApprove}
              disabled={bulkApprove.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Selected ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requisitions Awaiting Approval</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !requisitions?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending approvals
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === requisitions.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.map((req) => (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(req.id)}
                        onCheckedChange={() => toggleSelection(req.id)}
                      />
                    </TableCell>
                    <TableCell
                      className="font-medium"
                      onClick={() => handleRowClick(req.id)}
                    >
                      {req.order_number}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(req.id)}>
                      {req.properties?.name || 'N/A'}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(req.id)}>
                      {req.created_by_name}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(req.id)}>
                      <Badge variant={priorityColors[req.priority]}>
                        {req.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(req.id)}>
                      {req.total_items} items
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(req.id)}>
                      {format(new Date(req.created_at), 'PP')}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRowClick(req.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedRequisition && (
        <ApprovalDetailModal
          requisitionId={selectedRequisition}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
        />
      )}
    </div>
  );
};

export default PendingApprovalsPage;
