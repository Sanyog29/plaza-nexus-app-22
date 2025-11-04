import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

export const useRequisitionApproval = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const approveRequisition = useMutation({
    mutationFn: async ({
      requisitionId,
      remarks,
    }: {
      requisitionId: string;
      remarks?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('requisition_lists')
        .update({
          status: 'manager_approved',
          manager_approved_at: new Date().toISOString(),
          manager_id: user.id,
          manager_remarks: remarks,
        })
        .eq('id', requisitionId);

      if (error) throw error;

      // Add to status history
      await supabase.from('requisition_status_history').insert({
        requisition_list_id: requisitionId,
        old_status: 'pending_manager_approval',
        new_status: 'manager_approved',
        changed_by: user.id,
        remarks: remarks || 'Approved by manager',
      });

      return requisitionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast.success('Requisition approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve requisition');
    },
  });

  const rejectRequisition = useMutation({
    mutationFn: async ({
      requisitionId,
      reason,
    }: {
      requisitionId: string;
      reason: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      if (!reason.trim()) throw new Error('Rejection reason is required');

      const { error } = await supabase
        .from('requisition_lists')
        .update({
          status: 'manager_rejected',
          rejection_reason: reason,
          manager_id: user.id,
        })
        .eq('id', requisitionId);

      if (error) throw error;

      // Add to status history
      await supabase.from('requisition_status_history').insert({
        requisition_list_id: requisitionId,
        old_status: 'pending_manager_approval',
        new_status: 'manager_rejected',
        changed_by: user.id,
        remarks: reason,
      });

      return requisitionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast.success('Requisition rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject requisition');
    },
  });

  const requestClarification = useMutation({
    mutationFn: async ({
      requisitionId,
      message,
    }: {
      requisitionId: string;
      message: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      if (!message.trim()) throw new Error('Clarification message is required');

      const { error } = await supabase
        .from('requisition_lists')
        .update({
          status: 'draft',
          manager_remarks: message,
          manager_id: user.id,
        })
        .eq('id', requisitionId);

      if (error) throw error;

      // Add to status history
      await supabase.from('requisition_status_history').insert({
        requisition_list_id: requisitionId,
        old_status: 'pending_manager_approval',
        new_status: 'draft',
        changed_by: user.id,
        remarks: message,
      });

      return requisitionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast.success('Clarification request sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request clarification');
    },
  });

  const bulkApprove = useMutation({
    mutationFn: async (requisitionIds: string[]) => {
      if (!user) throw new Error('User not authenticated');

      const updates = requisitionIds.map((id) =>
        supabase
          .from('requisition_lists')
          .update({
            status: 'manager_approved',
            manager_approved_at: new Date().toISOString(),
            manager_id: user.id,
          })
          .eq('id', id)
      );

      await Promise.all(updates);

      // Add to status history
      const historyEntries = requisitionIds.map((id) => ({
        requisition_list_id: id,
        old_status: 'pending_manager_approval' as const,
        new_status: 'manager_approved' as const,
        changed_by: user.id,
        remarks: 'Bulk approved by manager',
      }));

      await supabase.from('requisition_status_history').insert(historyEntries);

      return requisitionIds;
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast.success(`${ids.length} requisitions approved successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve requisitions');
    },
  });

  return {
    approveRequisition,
    rejectRequisition,
    requestClarification,
    bulkApprove,
  };
};
