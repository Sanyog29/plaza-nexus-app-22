import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { toast } from 'sonner';

// Type workarounds for new tables not yet in generated types
type PermissionCategoryRow = {
  id: string;
  name: string;
  display_order: number;
  icon: string;
  description: string;
};

type PermissionDefinitionRow = {
  action: PermissionAction;
  name: string;
  description: string;
  minimum_tier: number;
  display_order: number;
  is_dangerous: boolean;
  category_id: string;
};

type UserPermissionRow = {
  id?: string;
  user_id: string;
  property_id: string;
  permission_action: PermissionAction;
  is_granted: boolean;
  granted_by?: string;
  override_reason?: string;
  created_at?: string;
  updated_at?: string;
};

type RolePermissionTemplateRow = {
  role: string;
  permission_action: PermissionAction;
  is_granted: boolean;
};

export type PermissionAction = 
  | 'view_tickets' | 'create_ticket' | 'close_ticket' | 'assign_ticket' | 'escalate_ticket' | 'approve_ticket_closure'
  | 'view_requisitions' | 'create_requisition' | 'approve_requisition' | 'reject_requisition'
  | 'view_procurement' | 'create_purchase_order' | 'approve_purchase' | 'manage_vendors'
  | 'view_maintenance_reports' | 'view_financial_reports' | 'view_executive_reports' | 'view_vendor_reports'
  | 'generate_reports' | 'schedule_reports' | 'export_reports' | 'delete_report_history'
  | 'view_basic_analytics' | 'view_advanced_analytics' | 'view_financial_analytics'
  | 'view_users' | 'create_users' | 'edit_users' | 'delete_users' | 'assign_roles'
  | 'manage_properties' | 'configure_system' | 'view_audit_logs' | 'manage_integrations';

export interface PermissionDefinition {
  action: PermissionAction;
  name: string;
  description: string;
  minimum_tier: number;
  display_order: number;
  is_dangerous: boolean;
  category_id: string;
}

export interface PermissionCategory {
  id: string;
  name: string;
  display_order: number;
  icon: string;
  description: string;
}

export interface UserPermission {
  action: PermissionAction;
  is_granted: boolean;
  source: 'user_override' | 'property_role' | 'global_role' | 'denied';
}

export const usePropertyPermissions = () => {
  const { user } = useAuth();
  const { currentProperty } = usePropertyContext();
  const queryClient = useQueryClient();
  const selectedPropertyId = currentProperty?.id;

  // Fetch all permission categories
  const { data: categories = [] } = useQuery({
    queryKey: ['permission-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_categories' as any)
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return (data || []) as unknown as PermissionCategoryRow[];
    }
  });

  // Fetch all permission definitions
  const { data: definitions = [] } = useQuery({
    queryKey: ['permission-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_definitions' as any)
        .select('*')
        .order('category_id, display_order');
      
      if (error) throw error;
      return (data || []) as unknown as PermissionDefinitionRow[];
    }
  });

  // Fetch user's permissions for current property
  const { data: userPermissions = [], isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id, selectedPropertyId],
    queryFn: async () => {
      if (!user?.id || !selectedPropertyId) return [];

      const { data, error } = await supabase.rpc('get_user_permissions_for_property' as any, {
        _user_id: user.id,
        _property_id: selectedPropertyId
      });

      if (error) throw error;
      return (data || []) as UserPermission[];
    },
    enabled: !!user?.id && !!selectedPropertyId
  });

  // Check if user has specific permission
  const hasPermission = (action: PermissionAction): boolean => {
    const permission = userPermissions.find(p => p.action === action);
    return permission?.is_granted || false;
  };

  // Get permission source (where it came from)
  const getPermissionSource = (action: PermissionAction): string => {
    const permission = userPermissions.find(p => p.action === action);
    return permission?.source || 'denied';
  };

  // Get all permissions by category
  const getPermissionsByCategory = (categoryId: string) => {
    return definitions.filter(def => def.category_id === categoryId);
  };

  return {
    categories,
    definitions,
    userPermissions,
    isLoading,
    hasPermission,
    getPermissionSource,
    getPermissionsByCategory
  };
};

// Hook for managing permissions (admin only)
export const usePermissionManagement = (targetUserId?: string) => {
  const queryClient = useQueryClient();
  const { currentProperty } = usePropertyContext();
  const selectedPropertyId = currentProperty?.id;

  // Fetch user's current permission overrides
  const { data: overrides = [], isLoading } = useQuery({
    queryKey: ['user-permission-overrides', targetUserId, selectedPropertyId],
    queryFn: async () => {
      if (!targetUserId || !selectedPropertyId) return [];

      const { data, error } = await supabase
        .from('user_permissions' as any)
        .select('*')
        .eq('user_id', targetUserId)
        .eq('property_id', selectedPropertyId);

      if (error) throw error;
      return (data || []) as unknown as UserPermissionRow[];
    },
    enabled: !!targetUserId && !!selectedPropertyId
  });

  // Fetch role templates for comparison
  const { data: roleTemplates = [] } = useQuery({
    queryKey: ['role-permission-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permission_templates' as any)
        .select('*');

      if (error) throw error;
      return (data || []) as unknown as RolePermissionTemplateRow[];
    }
  });

  // Grant or revoke permission
  const togglePermission = useMutation({
    mutationFn: async ({
      userId,
      propertyId,
      action,
      isGranted
    }: {
      userId: string;
      propertyId: string;
      action: PermissionAction;
      isGranted: boolean;
    }) => {
      const { data: existing } = await supabase
        .from('user_permissions' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .eq('permission_action', action)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_permissions' as any)
          .update({
            is_granted: isGranted,
            updated_at: new Date().toISOString()
          })
          .eq('id', (existing as any).id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_permissions' as any)
          .insert({
            user_id: userId,
            property_id: propertyId,
            permission_action: action,
            is_granted: isGranted,
            granted_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      }

      // Log audit trail
      await supabase.from('permission_audit_log' as any).insert({
        user_id: userId,
        property_id: propertyId,
        permission_action: action,
        action_type: isGranted ? 'granted' : 'revoked',
        performed_by: (await supabase.auth.getUser()).data.user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permission-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast.success('Permission updated successfully');
    },
    onError: (error) => {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  });

  // Remove permission override (revert to role default)
  const removeOverride = useMutation({
    mutationFn: async ({
      userId,
      propertyId,
      action
    }: {
      userId: string;
      propertyId: string;
      action: PermissionAction;
    }) => {
      const { error } = await supabase
        .from('user_permissions' as any)
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .eq('permission_action', action);

      if (error) throw error;

      // Log audit trail
      await supabase.from('permission_audit_log' as any).insert({
        user_id: userId,
        property_id: propertyId,
        permission_action: action,
        action_type: 'reverted_to_default',
        performed_by: (await supabase.auth.getUser()).data.user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permission-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast.success('Permission override removed');
    },
    onError: (error) => {
      console.error('Error removing override:', error);
      toast.error('Failed to remove override');
    }
  });

  return {
    overrides,
    roleTemplates,
    isLoading,
    togglePermission,
    removeOverride
  };
};
