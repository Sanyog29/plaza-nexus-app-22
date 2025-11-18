import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export const useApproverPermissions = (requisitionId?: string) => {
  const { user } = useAuth();

  // Check if user can approve this specific requisition
  const { data: canApprove = false, isLoading } = useQuery({
    queryKey: ['can-approve-requisition', requisitionId, user?.id],
    queryFn: async () => {
      if (!requisitionId || !user?.id) return false;

      // Get user's profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Check if user has an approver-eligible role
      const approverRoles = ['ops_supervisor', 'assistant_manager', 'admin', 'super_admin'];
      if (!profile || !approverRoles.includes(profile.role)) return false;

      // Get requisition's property_id
      const { data: requisition } = await supabase
        .from('requisition_lists')
        .select('property_id')
        .eq('id', requisitionId)
        .single();

      if (!requisition) return false;

      // Check if user is approver for that property
      const { data: approver } = await supabase
        .from('property_approvers')
        .select('id')
        .eq('property_id', requisition.property_id)
        .eq('approver_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      return !!approver;
    },
    enabled: !!requisitionId && !!user?.id
  });

  return { canApprove, isLoading };
};
