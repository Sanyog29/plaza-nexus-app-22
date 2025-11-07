import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export const usePropertyApprovers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user is an approver for any property
  const { data: isApprover = false } = useQuery({
    queryKey: ['is-approver', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data } = await supabase
        .from('property_approvers')
        .select('id')
        .eq('approver_user_id', user.id)
        .eq('is_active', true)
        .limit(1);
      
      return data && data.length > 0;
    },
    enabled: !!user?.id
  });

  // Check if current user is approver for specific property
  const isApproverForProperty = (propertyId: string) => {
    return useQuery({
      queryKey: ['is-approver-for-property', user?.id, propertyId],
      queryFn: async () => {
        if (!user?.id || !propertyId) return false;
        
        const { data } = await supabase
          .from('property_approvers')
          .select('id')
          .eq('property_id', propertyId)
          .eq('approver_user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        return !!data;
      },
      enabled: !!user?.id && !!propertyId
    });
  };

  // Get all properties user is approver for
  const { data: approverProperties = [] } = useQuery({
    queryKey: ['approver-properties', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data } = await supabase
        .from('property_approvers')
        .select(`
          *,
          property:properties!property_id (
            id,
            name,
            code
          )
        `)
        .eq('approver_user_id', user.id)
        .eq('is_active', true);
      
      return data || [];
    },
    enabled: !!user?.id
  });

  // Get approver for specific property
  const getPropertyApprover = (propertyId: string) => {
    return useQuery({
      queryKey: ['property-approver', propertyId],
      queryFn: async () => {
        if (!propertyId) return null;
        
        const { data: approverData } = await supabase
          .from('property_approvers')
          .select('*')
          .eq('property_id', propertyId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (!approverData) return null;

        // Fetch approver profile separately
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', approverData.approver_user_id)
          .single();

        return {
          ...approverData,
          approver: profileData
        };
      },
      enabled: !!propertyId
    });
  };

  // Assign approver (super admin only)
  const assignApprover = useMutation({
    mutationFn: async ({
      propertyId,
      userId,
      roleTitle,
      notes
    }: {
      propertyId: string;
      userId: string;
      roleTitle: string;
      notes?: string;
    }) => {
      // Deactivate existing approver if any
      await supabase
        .from('property_approvers')
        .update({ is_active: false })
        .eq('property_id', propertyId)
        .eq('is_active', true);

      // Insert new approver
      const { data, error } = await supabase
        .from('property_approvers')
        .insert({
          property_id: propertyId,
          approver_user_id: userId,
          approver_role_title: roleTitle,
          assigned_by: user?.id,
          notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-approvers'] });
      queryClient.invalidateQueries({ queryKey: ['is-approver'] });
      queryClient.invalidateQueries({ queryKey: ['approver-properties'] });
      toast.success('Approver assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign approver');
    }
  });

  // Remove approver (super admin only)
  const removeApprover = useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase
        .from('property_approvers')
        .update({ is_active: false })
        .eq('property_id', propertyId)
        .eq('is_active', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-approvers'] });
      queryClient.invalidateQueries({ queryKey: ['is-approver'] });
      queryClient.invalidateQueries({ queryKey: ['approver-properties'] });
      toast.success('Approver removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove approver');
    }
  });

  return {
    isApprover,
    isApproverForProperty,
    approverProperties,
    getPropertyApprover,
    assignApprover,
    removeApprover
  };
};
