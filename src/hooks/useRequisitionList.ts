import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';
import { usePropertyContext } from '@/contexts/PropertyContext';

export interface RequisitionList {
  id: string;
  order_number: string;
  status: 'draft' | 'pending_manager_approval' | 'manager_approved' | 'manager_rejected' | 
          'assigned_to_procurement' | 'po_raised' | 'in_transit' | 'received' | 'closed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  property_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  total_items?: number;
  property?: {
    name: string;
  };
  created_by_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface RequisitionFilters {
  status?: string[];
  search?: string;
}

export const useRequisitionList = (filters?: RequisitionFilters) => {
  const { user, userRole, isAdmin, isSuperAdmin, isL2, isL3 } = useAuth();
  const { currentProperty } = usePropertyContext();
  const [requisitions, setRequisitions] = useState<RequisitionList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isManager = isL2 || isL3 || userRole === 'assistant_manager' || userRole === 'assistant_floor_manager';
  const isProcurement = userRole === 'purchase_executive' || userRole === 'procurement_manager';

  const fetchRequisitions = useCallback(async () => {
    if (!user) {
      setRequisitions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      let query = supabase
        .from('requisition_lists')
        .select(`
          *,
          property:properties(name),
          created_by_profile:profiles!requisition_lists_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      // Role-based filtering with property scoping
      if (!isAdmin && !isSuperAdmin && !isManager && !isProcurement) {
        // FE users see only their own requisitions from their current property
        query = query.eq('created_by', user.id);
        if (currentProperty) {
          query = query.eq('property_id', currentProperty.id);
        }
      } else if (isManager && !isAdmin && !isSuperAdmin) {
        // Managers see all requisitions from their current property
        if (currentProperty) {
          query = query.eq('property_id', currentProperty.id);
        }
      } else if ((isAdmin || isSuperAdmin) && currentProperty) {
        // Admins/Super admins with property selected: filter by that property
        query = query.eq('property_id', currentProperty.id);
      }
      // Procurement staff and admins without property filter see all approved+ requisitions

      // Apply status filter
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status as any);
      }

      // Apply search filter
      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequisitions((data || []) as any);
    } catch (error: any) {
      console.error('Error fetching requisitions:', error);
      toast.error('Failed to load requisitions: ' + error.message);
      setRequisitions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, userRole, isAdmin, isSuperAdmin, isManager, isProcurement, currentProperty, filters?.status, filters?.search]);

  const deleteRequisition = async (requisitionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('requisition_lists')
        .delete()
        .eq('id', requisitionId);

      if (error) throw error;

      toast.success('Requisition deleted successfully');
      await fetchRequisitions();
      return true;
    } catch (error: any) {
      console.error('Error deleting requisition:', error);
      toast.error('Failed to delete requisition: ' + error.message);
      return false;
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('requisition-lists')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requisition_lists'
        },
        () => {
          fetchRequisitions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchRequisitions]);

  return {
    requisitions,
    isLoading,
    fetchRequisitions,
    deleteRequisition,
  };
};
