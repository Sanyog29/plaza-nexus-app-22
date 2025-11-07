import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { CheckCircle, XCircle, MessageCircle, ArrowRightLeft } from 'lucide-react';
import { useRequisitionApproval } from '@/hooks/useRequisitionApproval';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RerouteRequisitionDialog } from './RerouteRequisitionDialog';
import { useAuth } from '@/components/AuthProvider';

interface ApprovalDetailModalProps {
  requisitionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ApprovalDetailModal: React.FC<ApprovalDetailModalProps> = ({
  requisitionId,
  open,
  onOpenChange,
}) => {
  const [action, setAction] = useState<'approve' | 'reject' | 'clarify' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [showRerouteDialog, setShowRerouteDialog] = useState(false);
  const { approveRequisition, rejectRequisition, requestClarification } =
    useRequisitionApproval();
  const { userRole } = useAuth();

  const { data: requisition } = useQuery({
    queryKey: ['requisition-detail', requisitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_lists')
        .select('*')
        .eq('id', requisitionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!requisitionId,
  });

  const { data: items } = useQuery({
    queryKey: ['requisition-items', requisitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_list_items')
        .select('*')
        .eq('requisition_list_id', requisitionId);

      if (error) throw error;
      return data;
    },
    enabled: open && !!requisitionId,
  });

  const { data: property } = useQuery({
    queryKey: ['property', requisition?.property_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('name')
        .eq('id', requisition?.property_id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!requisition?.property_id,
  });

  const handleAction = async () => {
    if (!action) return;

    const mutations = {
      approve: () => approveRequisition.mutateAsync({ requisitionId, remarks }),
      reject: () => rejectRequisition.mutateAsync({ requisitionId, reason: remarks }),
      clarify: () => requestClarification.mutateAsync({ requisitionId, message: remarks }),
    };

    try {
      await mutations[action]();
      setAction(null);
      setRemarks('');
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const priorityColors = {
    low: 'secondary',
    normal: 'default',
    high: 'default',
    urgent: 'destructive',
  } as const;

  const isOpsSupervisor = userRole === 'ops_supervisor';
  const canReroute = isOpsSupervisor && requisition?.status === 'manager_approved';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Review Requisition</DialogTitle>
          </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-medium">{requisition?.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requested By</p>
                <p className="font-medium">{requisition?.created_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property</p>
                <p className="font-medium">{property?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge variant={priorityColors[requisition?.priority || 'normal']}>
                  {requisition?.priority.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date Requested</p>
                <p className="font-medium">
                  {requisition?.created_at && format(new Date(requisition.created_at), 'PPP')}
                </p>
              </div>
              {requisition?.expected_delivery_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium">
                    {format(new Date(requisition.expected_delivery_date), 'PPP')}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {requisition?.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm mt-1">{requisition.notes}</p>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h3 className="font-semibold mb-2">Items ({items?.length})</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category_name}</Badge>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Action Form */}
            {action && (
              <div className="space-y-4 border-t pt-4">
                <Label>
                  {action === 'approve' && 'Approval Remarks (Optional)'}
                  {action === 'reject' && 'Rejection Reason (Required)'}
                  {action === 'clarify' && 'Clarification Message (Required)'}
                </Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    action === 'approve'
                      ? 'Add any remarks...'
                      : action === 'reject'
                      ? 'Why is this being rejected?'
                      : 'What clarification is needed?'
                  }
                  rows={3}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2">
          {!action ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {canReroute && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    setShowRerouteDialog(true);
                  }}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Reroute
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setAction('clarify')}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Request Clarification
              </Button>
              <Button
                variant="destructive"
                onClick={() => setAction('reject')}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={() => setAction('approve')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => {
                setAction(null);
                setRemarks('');
              }}>
                Back
              </Button>
              <Button
                onClick={handleAction}
                disabled={
                  (action !== 'approve' && !remarks.trim()) ||
                  approveRequisition.isPending ||
                  rejectRequisition.isPending ||
                  requestClarification.isPending
                }
                variant={action === 'reject' ? 'destructive' : 'default'}
              >
                Confirm {action === 'approve' ? 'Approval' : action === 'reject' ? 'Rejection' : 'Request'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Reroute Dialog */}
    {canReroute && requisition && (
      <RerouteRequisitionDialog
        requisitionId={requisitionId}
        currentAssigneeId={requisition.assigned_to}
        currentStatus={requisition.status}
        open={showRerouteDialog}
        onOpenChange={setShowRerouteDialog}
      />
    )}
    </>
  );
};
