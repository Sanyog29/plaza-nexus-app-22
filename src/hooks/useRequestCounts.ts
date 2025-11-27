import { useState, useEffect, useRef, useCallback } from 'react';
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
  const { user, isStaff, isAdmin, userRole, isLoading: isAuthLoading } = useAuth();
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
  const isMountedRef = useRef(true);
  const fetchCountsRef = useRef<() => Promise<void>>();

  const fetchCounts = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    // CRITICAL: Wait for auth to finish loading before determining filters
    if (isAuthLoading) {
      console.log('[useRequestCounts] Waiting for auth to load...');
      return;
    }

    // CRITICAL: Ensure userRole is determined before fetching
    if (!userRole) {
      console.log('[useRequestCounts] Waiting for userRole to be determined...');
      return;
    }
    
    try {
      console.log('[useRequestCounts] Fetching counts:', {
        isAuthLoading,
        userRole,
        propertyId,
        currentPropertyId: currentProperty?.id,
        currentPropertyName: currentProperty?.name,
        availablePropertiesCount: availableProperties.length,
        isSuperAdmin,
        userId: user?.id,
        isStaff,
        isAdmin
      });
      
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
        
        console.log('[useRequestCounts] Applying property filter:', {
          filterPropertyId,
          availablePropertiesCount: availableProperties.length
        });

        if (filterPropertyId) {
          query = query.eq('property_id', filterPropertyId);
        } else if (availableProperties.length > 0) {
          const propertyIds = availableProperties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        } else {
          // No property access - return zero counts
          console.warn('User has no property access for request counts');
          if (isMountedRef.current) {
            setCounts({
              totalRequests: 0,
              activeRequests: 0,
              completedRequests: 0,
              pendingRequests: 0,
              inProgressRequests: 0,
            });
            setIsLoading(false);
          }
          return;
        }
      }
      
      // Non-staff/admin users see only their own requests
      if (!isStaff && !isAdmin && user?.id) {
        console.log('[useRequestCounts] Applying user-specific filter for:', user.id);
        query = query.eq('reported_by', user.id);
      }

      const { data: requests, error } = await query;

      if (error) throw error;

      console.log('[useRequestCounts] Query results:', {
        requestsCount: requests?.length || 0,
        requests: requests?.map(r => ({ id: r.status }))
      });

      const totalRequests = requests?.length || 0;
      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const inProgressRequests = requests?.filter(r => r.status === 'in_progress').length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      
      // Active requests using canonical definition
      const activeRequests = requests?.filter(r => 
        ACTIVE_REQUEST_STATUSES.includes(r.status as any)
      ).length || 0;

      console.log('[useRequestCounts] Final counts:', {
        totalRequests,
        activeRequests,
        completedRequests,
        pendingRequests,
        inProgressRequests,
      });

      if (!isMountedRef.current) return;

      setCounts({
        totalRequests,
        activeRequests,
        completedRequests,
        pendingRequests,
        inProgressRequests,
      });

    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('Error fetching request counts:', error);
      setError(error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    propertyId, 
    currentProperty?.id, 
    isSuperAdmin, 
    availableProperties.map(p => p.id).join(','), // Stable property IDs
    user?.id, 
    isStaff, 
    isAdmin,
    isAuthLoading,
    userRole
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchCountsRef.current = fetchCounts;
  }, [fetchCounts]);

  useEffect(() => {
    // CRITICAL: Wait for both auth and property context to load
    if (isAuthLoading) {
      console.log('[useRequestCounts] Waiting for auth to load');
      return;
    }

    if (!userRole) {
      console.log('[useRequestCounts] Waiting for userRole to be determined');
      return;
    }

    if (isLoadingProperties) {
      console.log('[useRequestCounts] Waiting for PropertyContext to load');
      return;
    }
    
    console.log('[useRequestCounts] Auth and PropertyContext loaded, starting fetch');
    fetchCounts();
    
    // Set up real-time updates with ref to avoid stale closures
    const channel = supabase
      .channel('request-counts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        () => {
          console.log('[useRequestCounts] Real-time update triggered');
          fetchCountsRef.current?.();
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [isAuthLoading, isLoadingProperties, userRole, fetchCounts]);

  return { counts, isLoading, error, refetch: fetchCounts };
};