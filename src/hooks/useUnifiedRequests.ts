import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

export interface UnifiedRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
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
  categories?: {
    name: string;
    icon: string;
  };
}

interface RequestFilters {
  status?: ('pending' | 'in_progress' | 'completed' | 'cancelled')[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  category?: string[];
  assigned_to?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export const useUnifiedRequests = (filters?: RequestFilters) => {
  const { user, isStaff, userRole } = useAuth();
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRequests = async (page = 1, limit = 50) => {
    if (!user) return;

    try {
      setIsLoading(true);

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
          ),
          categories(name, icon)
        `, { count: 'exact' });

      // Apply role-based filtering
      if (!isStaff) {
        // Non-staff can only see their own requests
        query = query.eq('reported_by', user.id);
      } else if (userRole === 'field_staff') {
        // Field staff can see requests assigned to them or unassigned
        query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
      }
      // Admin and ops_supervisor can see all requests (no additional filter)

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority);
      }

      if (filters?.category?.length) {
        query = query.in('category_id', filters.category);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
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
      toast.error('Failed to load requests: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
        .single();

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
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
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
        })
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
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request completed successfully');
      await fetchRequests();
      
      return true;
    } catch (error: any) {
      console.error('Error completing request:', error);
      toast.error('Failed to complete request: ' + error.message);
      return false;
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchRequests();

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
  }, [user, filters]);

  return {
    requests,
    isLoading,
    totalCount,
    fetchRequests,
    createRequest,
    updateRequest,
    assignRequest,
    completeRequest,
  };
};