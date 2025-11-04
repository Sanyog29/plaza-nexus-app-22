import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { Edit, Trash2, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RequisitionActionsProps {
  requisition: any;
}

export const RequisitionActions: React.FC<RequisitionActionsProps> = ({
  requisition,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isCreator = user?.id === requisition.created_by;
  const isDraft = requisition.status === 'draft';
  const isPending = requisition.status === 'pending_manager_approval';

  if (!isCreator) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-2">
          {isDraft && (
            <>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}

          {isPending && (
            <Button variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancel Request
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
