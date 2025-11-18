
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { toast } from '@/components/ui/sonner';
import { toDBStatus, mapStatusArrayToDB, type UIStatus, type DBRequestStatus } from '@/utils/status';

export interface UnifiedRequest {
  id: string;
  title: string;
  description: string;
  status: UIStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category_id: string;
  location: string;
  reported_by: string;
  assigned_to?: string;
  sla_breach_at?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  reported_by_profile?: {
    first_name: string;
    last_name: string;
    office_number: string;
  };
  assigned_to_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface RequestFilters {
  status?: UIStatus[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  category?: string[];
  assigned_to?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export const useUnifiedRequests = (filters?: RequestFilters) => {
  const { user, isStaff, userRole, approvalStatus, isAdmin } = useAuth();
  const { currentProperty, isSuperAdmin: isPropertySuperAdmin } = usePropertyContext();
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Status mapping is now handled by centralized utility

  // Memoize the serialized filters to prevent unnecessary re-renders
  const serializedFilters = useMemo(() => {
    return JSON.stringify(filters || {});
  }, [filters]);

  const fetchRequests = useCallback(async (page = 1, limit = 50) => {
    if (!user) {
      setRequests([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    // Check if user is approved (admins bypass this check)
    if (!isAdmin && approvalStatus !== 'approved') {
      console.log('User not approved, skipping request fetch');
      setRequests([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Parse filters back from serialized form
      const parsedFilters = JSON.parse(serializedFilters) as RequestFilters;

      // Build the query based on user role and permissions
      let query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          reported_by_profile:profiles!maintenance_requests_reported_by_fkey(
            first_name,
            last_name,
            office_number
          ),
          assigned_to_profile:profiles!maintenance_requests_assigned_to_fkey(
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .is('deleted_at', null); // Exclude soft-deleted requests

      // Apply role-based filtering with property scope
      if (!isStaff) {
        // Non-staff can only see their own requests
        query = query.eq('reported_by', user.id);
      } else if (userRole === 'field_staff') {
        // Field staff can see requests assigned to them or unassigned
        query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
      } else {
        // Staff roles (admin, ops_supervisor, assistant_manager) - MUST filter by property
        if (!isPropertySuperAdmin || currentProperty) {
          const propertyId = currentProperty?.id;
          if (propertyId) {
            query = query.eq('property_id', propertyId);
          } else {
            // If no property assigned, show nothing
            query = query.eq('property_id', 'none');
          }
        }
        // Super admin viewing "All Properties" sees everything (no filter)
      }

      // Apply filters
      if (parsedFilters.status?.length) {
        const dbStatuses = mapStatusArrayToDB(parsedFilters.status);
        query = query.in('status', dbStatuses);
      }

      if (parsedFilters.priority?.length) {
        query = query.in('priority', parsedFilters.priority);
      }

      if (parsedFilters.category?.length) {
        query = query.in('category_id', parsedFilters.category);
      }

      if (parsedFilters.assigned_to) {
        query = query.eq('assigned_to', parsedFilters.assigned_to);
      }

      if (parsedFilters.date_range) {
        query = query
          .gte('created_at', parsedFilters.date_range.start)
          .lte('created_at', parsedFilters.date_range.end);
      }

      // Order by priority and creation date
      query = query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setRequests(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching unified requests:', error);
      // Only show error toast if it's not a permission issue
      if (!error.message?.includes('Failed to fetch') && !error.message?.includes('permission')) {
        toast.error('Failed to load requests: ' + error.message);
      }
      setRequests([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user, isStaff, userRole, isAdmin, approvalStatus, serializedFilters]);

  const createRequest = async (requestData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    location: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          title: requestData.title,
          description: requestData.description,
          priority: requestData.priority,
          category_id: requestData.category,
          location: requestData.location,
          reported_by: user.id,
          status: 'pending',
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      toast.success('Request created successfully');
      await fetchRequests(); // Refresh the list
      
      return data;
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request: ' + error.message);
      return null;
    }
  };

  const updateRequest = async (requestId: string, updates: Partial<UnifiedRequest>) => {
    if (!user) return false;

    try {
      const { status, ...rest } = updates;
      const dbUpdates: any = {
        ...rest,
        ...(status ? { status: toDBStatus(status as UnifiedRequest['status']) } : {}),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('maintenance_requests')
        .update(dbUpdates as any)
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request updated successfully');
      await fetchRequests(); // Refresh the list
      
      return true;
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request: ' + error.message);
      return false;
    }
  };

  const assignRequest = async (requestId: string, assigneeId: string) => {
    if (!isStaff) return false;

    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          assigned_to: assigneeId,
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request assigned successfully');
      await fetchRequests();
      
      return true;
    } catch (error: any) {
      console.error('Error assigning request:', error);
      toast.error('Failed to assign request: ' + error.message);
      return false;
    }
  };

  const completeRequest = async (requestId: string, completionNotes?: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('complete_request', {
        p_request_id: requestId,
        p_closure_reason: completionNotes || 'Request completed'
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success === false) {
        toast.error(result.error || 'Failed to complete request');
        return false;
      }

      toast.success('Request completed successfully');
      await fetchRequests();
      
      return true;
    } catch (error: any) {
      console.error('Error completing request:', error);
      toast.error('Failed to complete request: ' + error.message);
      return false;
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      // Fetch minimal data for permission check
      const { data: request, error: fetchError } = await supabase
        .from('maintenance_requests')
        .select('reported_by')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Non-staff users can only delete their own requests
      if (!isStaff && request.reported_by !== user.id) {
        toast.error('You can only delete your own requests');
        return false;
      }

      // Soft delete the request
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', requestId);


      if (error) throw error;

      toast.success('Request deleted successfully');
      await fetchRequests();
      
      return true;
    } catch (error: any) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request: ' + error.message);
      return false;
    }
  };

  const cancelRequest = async (requestId: string, reason?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request cancelled successfully');
      await fetchRequests();
      
      return true;
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request: ' + error.message);
      return false;
    }
  };

  // Stable effect that only runs when necessary dependencies change
  useEffect(() => {
    if (!user) return;
    
    // Only fetch if user is approved (admins bypass this check)
    if (isAdmin || approvalStatus === 'approved') {
      fetchRequests();
    }
  }, [fetchRequests]);

  // Real-time subscription with stable dependencies
  useEffect(() => {
    if (!user) return;

    // Only set up real-time subscription for approved users
    if (!isAdmin && approvalStatus !== 'approved') {
      return;
    }

    const channel = supabase
      .channel('unified-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests'
        },
        () => {
          fetchRequests(); // Refresh on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, approvalStatus, isAdmin, fetchRequests]);

  return {
    requests,
    isLoading,
    totalCount,
    fetchRequests,
    createRequest,
    updateRequest,
    assignRequest,
    completeRequest,
    deleteRequest,
    cancelRequest,
  };
};
