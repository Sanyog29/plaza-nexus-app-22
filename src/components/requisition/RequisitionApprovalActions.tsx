import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { useRequisitionApproval } from '@/hooks/useRequisitionApproval';
import { useApproverPermissions } from '@/hooks/useApproverPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RequisitionApprovalActionsProps {
  requisition: any;
}

export const RequisitionApprovalActions: React.FC<RequisitionApprovalActionsProps> = ({
  requisition,
}) => {
  const [action, setAction] = useState<'approve' | 'reject' | 'clarify' | null>(null);
  const [remarks, setRemarks] = useState('');
  const { approveRequisition, rejectRequisition, requestClarification } = useRequisitionApproval();
  const { canApprove, isLoading: isCheckingPermissions } = useApproverPermissions(requisition.id);

  const isPending = requisition.status === 'pending_manager_approval';

  // Don't show if not pending or if checking permissions
  if (!isPending || isCheckingPermissions) {
    return null;
  }

  // Don't show if user cannot approve
  if (!canApprove) {
    return null;
  }

  const handleConfirmAction = async () => {
    if (!action) return;

    const mutations = {
      approve: () => approveRequisition.mutateAsync({ requisitionId: requisition.id, remarks }),
      reject: () => rejectRequisition.mutateAsync({ requisitionId: requisition.id, reason: remarks }),
      clarify: () => requestClarification.mutateAsync({ requisitionId: requisition.id, message: remarks }),
    };

    try {
      await mutations[action]();
      setAction(null);
      setRemarks('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = approveRequisition.isPending || 
                    rejectRequisition.isPending || 
                    requestClarification.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Approval Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are authorized to approve this requisition as a property approver.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAction('clarify')}
              disabled={isLoading}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Request Clarification
            </Button>
            <Button
              variant="destructive"
              onClick={() => setAction('reject')}
              disabled={isLoading}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button 
              onClick={() => setAction('approve')}
              disabled={isLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={action ? "block" : "hidden"}>
        <CardHeader>
          <CardTitle>
            {action === 'approve' && 'Approve Requisition'}
            {action === 'reject' && 'Reject Requisition'}
            {action === 'clarify' && 'Request Clarification'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {action === 'approve' && 'Are you sure you want to approve this requisition?'}
            {action === 'reject' && 'Please provide a reason for rejecting this requisition.'}
            {action === 'clarify' && 'Please describe what clarification is needed.'}
          </p>
          
          <div className="space-y-2">
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

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setAction(null);
                setRemarks('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                (action !== 'approve' && !remarks.trim()) || isLoading
              }
              variant={action === 'reject' ? 'destructive' : 'default'}
            >
              {isLoading && (
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {action === 'approve' ? 'Approve' :
               action === 'reject' ? 'Reject' :
               'Send Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
