import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { ACTIVE_REQUEST_STATUSES } from '@/constants/requests';

interface RequestCounts {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
}

export const useRequestCounts = (propertyId?: string | null) => {
  const { user, isStaff, isAdmin } = useAuth();
  const { currentProperty, isSuperAdmin, availableProperties, isLoadingProperties } = usePropertyContext();
  const [counts, setCounts] = useState<RequestCounts>({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCounts = async () => {
    // Don't fetch if properties are still loading
    if (isLoadingProperties) {
      return;
    }
    
    try {
      setError(null);
      
      // Build query with role-based scoping and exclude soft-deleted
      let query = supabase
        .from('maintenance_requests')
        .select('status')
        .is('deleted_at', null);
      
      // CRITICAL: Apply property filtering for non-super-admins
      // Use passed propertyId if available, otherwise use PropertyContext
      if (!isSuperAdmin) {
        const filterPropertyId = propertyId || currentProperty?.id;
        
        if (filterPropertyId) {
          query = query.eq('property_id', filterPropertyId);
        } else if (availableProperties.length > 0) {
          const propertyIds = availableProperties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        } else {
          // No property access - return zero counts
          console.warn('User has no property access for request counts');
          setCounts({
            totalRequests: 0,
            activeRequests: 0,
            completedRequests: 0,
            pendingRequests: 0,
            inProgressRequests: 0,
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Non-staff/admin users see only their own requests
      if (!isStaff && !isAdmin && user?.id) {
        query = query.eq('reported_by', user.id);
      }

      const { data: requests, error } = await query;

      if (error) throw error;

      const totalRequests = requests?.length || 0;
      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const inProgressRequests = requests?.filter(r => r.status === 'in_progress').length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      
      // Active requests using canonical definition
      const activeRequests = requests?.filter(r => 
        ACTIVE_REQUEST_STATUSES.includes(r.status as any)
      ).length || 0;

      setCounts({
        totalRequests,
        activeRequests,
        completedRequests,
        pendingRequests,
        inProgressRequests,
      });

    } catch (error: any) {
      console.error('Error fetching request counts:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    
    // Set up real-time updates
    const channel = supabase
      .channel('request-counts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId, currentProperty, isSuperAdmin, availableProperties, isLoadingProperties]);

  return { counts, isLoading, error, refetch: fetchCounts };
};