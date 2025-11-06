import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRequisitionReroute } from '@/hooks/useRequisitionReroute';
import { Loader2, ArrowRight } from 'lucide-react';

interface RerouteRequisitionDialogProps {
  requisitionId: string;
  currentAssigneeId: string | null;
  currentStatus: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RerouteRequisitionDialog: React.FC<RerouteRequisitionDialogProps> = ({
  requisitionId,
  currentAssigneeId,
  currentStatus,
  open,
  onOpenChange,
}) => {
  const [newAssigneeId, setNewAssigneeId] = useState<string | null>(currentAssigneeId);
  const [newStatus, setNewStatus] = useState<string>(currentStatus);
  const [remarks, setRemarks] = useState('');
  
  const { rerouteRequisition, isRerouting } = useRequisitionReroute();

  // Fetch Purchase Executives
  const { data: purchaseExecutives, isLoading: isLoadingPEs } = useQuery({
    queryKey: ['purchase-executives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', 
          (await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'purchase_executive')
          ).data?.map(r => r.user_id) || []
        );

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleReroute = async () => {
    if (!newAssigneeId && newStatus === currentStatus) {
      return;
    }

    await rerouteRequisition.mutateAsync({
      requisitionId,
      newAssigneeId: newAssigneeId !== currentAssigneeId ? newAssigneeId : undefined,
      newStatus: newStatus !== currentStatus ? newStatus : undefined,
      remarks: remarks.trim() || undefined,
    });

    onOpenChange(false);
    setRemarks('');
  };

  const statusOptions = [
    { value: 'pending_manager_approval', label: 'Pending Manager Approval' },
    { value: 'manager_approved', label: 'Manager Approved' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reroute Requisition</DialogTitle>
          <DialogDescription>
            Reassign this requisition to a different Purchase Executive or change its status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label>Change Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {newStatus !== currentStatus && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="font-medium">{currentStatus}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium">{newStatus}</span>
              </p>
            )}
          </div>

          {/* Assignee Selection */}
          <div className="space-y-2">
            <Label>Assign to Purchase Executive</Label>
            {isLoadingPEs ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading executives...</span>
              </div>
            ) : (
              <Select value={newAssigneeId || 'unassigned'} onValueChange={(value) => setNewAssigneeId(value === 'unassigned' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Purchase Executive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {purchaseExecutives?.map((pe) => (
                    <SelectItem key={pe.id} value={pe.id}>
                      {pe.first_name} {pe.last_name} ({pe.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label>Remarks (Optional)</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Reason for rerouting..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRerouting}>
            Cancel
          </Button>
          <Button 
            onClick={handleReroute} 
            disabled={isRerouting || (newAssigneeId === currentAssigneeId && newStatus === currentStatus)}
          >
            {isRerouting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Reroute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
