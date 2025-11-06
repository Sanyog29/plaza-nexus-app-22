import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { handleSupabaseError } from '@/lib/errorHandler';

interface RerouteRequisitionParams {
  requisitionId: string;
  newAssigneeId: string | null;
  newStatus?: string;
  remarks?: string;
}

export const useRequisitionReroute = () => {
  const queryClient = useQueryClient();

  const rerouteRequisition = useMutation({
    mutationFn: async ({ requisitionId, newAssigneeId, newStatus, remarks }: RerouteRequisitionParams) => {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Update assignee if provided
      if (newAssigneeId !== undefined) {
        updateData.assigned_to = newAssigneeId;
        updateData.assigned_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.assigned_at = new Date().toISOString();
      }

      // Update status if provided
      if (newStatus) {
        updateData.status = newStatus;
      }

      // Add remarks if provided
      if (remarks) {
        updateData.manager_remarks = remarks;
      }

      // Perform the update with explicit error handling
      const { data, error } = await supabase
        .from('requisition_lists')
        .update(updateData)
        .eq('id', requisitionId)
        .select()
        .single();

      if (error) {
        console.error('Reroute error:', error);
        throw error;
      }

      // Status history is automatically logged via the log_requisition_status_change() trigger

      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Success',
        description: 'Requisition has been rerouted successfully',
      });

      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['requisition', variables.requisitionId] });
      queryClient.invalidateQueries({ queryKey: ['requisition-detail', variables.requisitionId] });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
    onError: (error: any) => {
      handleSupabaseError(error, {
        context: 'reroute_requisition',
        requisitionId: error?.requisitionId,
      });
    },
  });

  return {
    rerouteRequisition,
    isRerouting: rerouteRequisition.isPending,
  };
};
