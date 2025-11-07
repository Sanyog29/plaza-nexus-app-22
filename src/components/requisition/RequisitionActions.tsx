import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { Edit, Trash2, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRequisitionActions } from '@/hooks/useRequisitionActions';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

interface RequisitionActionsProps {
  requisition: any;
}

export const RequisitionActions: React.FC<RequisitionActionsProps> = ({
  requisition,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { submitRequisition, cancelSubmission, deleteRequisition } = useRequisitionActions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCreator = user?.id === requisition.created_by;
  const isDraft = requisition.status === 'draft';
  const isPending = requisition.status === 'pending_manager_approval';

  const isLoading = submitRequisition.isPending || 
                    cancelSubmission.isPending || 
                    deleteRequisition.isPending;

  if (!isCreator) {
    return null;
  }

  const handleEdit = () => {
    navigate(`/procurement/my-requisitions/edit/${requisition.id}`);
  };

  const handleSubmit = () => {
    submitRequisition.mutate(requisition.id);
  };

  const handleDelete = () => {
    deleteRequisition.mutate(requisition.id);
    setShowDeleteDialog(false);
  };

  const handleCancel = () => {
    cancelSubmission.mutate(requisition.id);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2">
            {isDraft && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {submitRequisition.isPending && (
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Approval
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}

            {isPending && (
              <Button 
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {cancelSubmission.isPending && (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                <X className="mr-2 h-4 w-4" />
                Cancel Request
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Requisition"
        description="Are you sure you want to delete this requisition? This action cannot be undone."
        itemName={requisition.order_number}
        deleteText="Delete"
        onConfirm={handleDelete}
        loading={deleteRequisition.isPending}
        destructive={true}
      />
    </>
  );
};
