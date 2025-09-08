import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RequestCounts {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
}

export const useRequestCounts = () => {
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
    try {
      setError(null);
      const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select('status');

      if (error) throw error;

      const totalRequests = requests?.length || 0;
      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const inProgressRequests = requests?.filter(r => r.status === 'in_progress').length || 0;
      const assignedRequests = requests?.filter(r => r.status === 'assigned').length || 0;
      const enRouteRequests = requests?.filter(r => r.status === 'en_route').length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const activeRequests = pendingRequests + inProgressRequests + assignedRequests + enRouteRequests;

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
  }, []);

  return { counts, isLoading, error, refetch: fetchCounts };
};