import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useRequisitionActions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const submitRequisition = useMutation({
    mutationFn: async (requisitionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get requisition and validate
      const { data: requisition, error: fetchError } = await supabase
        .from('requisition_lists')
        .select('id, status, created_by')
        .eq('id', requisitionId)
        .single();

      if (fetchError) throw fetchError;
      if (!requisition) throw new Error('Requisition not found');
      if (requisition.created_by !== user.id) {
        throw new Error('You can only submit your own requisitions');
      }
      if (requisition.status !== 'draft') {
        throw new Error('Only draft requisitions can be submitted');
      }

      // Update status
      const { error: updateError } = await supabase
        .from('requisition_lists')
        .update({ status: 'pending_manager_approval' })
        .eq('id', requisitionId);

      if (updateError) throw updateError;

      // Add status history
      const { error: historyError } = await supabase
        .from('requisition_status_history')
        .insert({
          requisition_list_id: requisitionId,
          old_status: 'draft',
          new_status: 'pending_manager_approval',
          changed_by: user.id,
          remarks: 'Submitted for approval'
        });

      if (historyError) throw historyError;

      return requisitionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisition-lists'] });
      queryClient.invalidateQueries({ queryKey: ['requisition-detail'] });
      toast({
        title: 'Success',
        description: 'Requisition submitted for approval',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit requisition',
        variant: 'destructive',
      });
    }
  });

  const cancelSubmission = useMutation({
    mutationFn: async (requisitionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get requisition and validate
      const { data: requisition, error: fetchError } = await supabase
        .from('requisition_lists')
        .select('id, status, created_by')
        .eq('id', requisitionId)
        .single();

      if (fetchError) throw fetchError;
      if (!requisition) throw new Error('Requisition not found');
      if (requisition.created_by !== user.id) {
        throw new Error('You can only cancel your own requisitions');
      }
      if (requisition.status !== 'pending_manager_approval') {
        throw new Error('Only pending requisitions can be cancelled');
      }

      // Update status back to draft
      const { error: updateError } = await supabase
        .from('requisition_lists')
        .update({ status: 'draft' })
        .eq('id', requisitionId);

      if (updateError) throw updateError;

      // Add status history
      const { error: historyError } = await supabase
        .from('requisition_status_history')
        .insert({
          requisition_list_id: requisitionId,
          old_status: 'pending_manager_approval',
          new_status: 'draft',
          changed_by: user.id,
          remarks: 'Submission cancelled'
        });

      if (historyError) throw historyError;

      return requisitionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisition-lists'] });
      queryClient.invalidateQueries({ queryKey: ['requisition-detail'] });
      toast({
        title: 'Success',
        description: 'Requisition submission cancelled',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel submission',
        variant: 'destructive',
      });
    }
  });

  const deleteRequisition = useMutation({
    mutationFn: async (requisitionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get requisition and validate
      const { data: requisition, error: fetchError } = await supabase
        .from('requisition_lists')
        .select('id, status, created_by')
        .eq('id', requisitionId)
        .single();

      if (fetchError) throw fetchError;
      if (!requisition) throw new Error('Requisition not found');
      if (requisition.created_by !== user.id) {
        throw new Error('You can only delete your own requisitions');
      }
      if (requisition.status !== 'draft') {
        throw new Error('Only draft requisitions can be deleted');
      }

      // Delete requisition (items will cascade)
      const { error: deleteError } = await supabase
        .from('requisition_lists')
        .delete()
        .eq('id', requisitionId);

      if (deleteError) throw deleteError;

      return requisitionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisition-lists'] });
      toast({
        title: 'Success',
        description: 'Requisition deleted successfully',
      });
      navigate('/procurement/my-requisitions');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete requisition',
        variant: 'destructive',
      });
    }
  });

  return {
    submitRequisition,
    cancelSubmission,
    deleteRequisition,
  };
};
