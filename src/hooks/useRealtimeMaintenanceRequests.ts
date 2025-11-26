import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface MaintenanceRequest {
  id: string;
  status: string;
  created_at: string;
  title: string;
  priority: string;
  assigned_to?: string;
  completed_at?: string;
  sla_breach_at?: string;
}

interface RequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export const useRealtimeMaintenanceRequests = () => {
  const { currentProperty, isSuperAdmin, availableProperties, isLoadingProperties } = usePropertyContext();
  const { user, userRole } = useAuth();
  const [requestStats, setRequestStats] = useState<RequestStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [recentRequests, setRecentRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // CRITICAL: Wait for PropertyContext to load before fetching data
  if (isLoadingProperties) {
    return {
      requestStats: {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0
      },
      recentRequests: [],
      isLoading: true,
      refetch: async () => {}
    };
  }

  const calculateStats = (requests: MaintenanceRequest[]): RequestStats => {
    const now = new Date();
    return requests.reduce(
      (acc, req) => {
        acc.total++;
        if (req.status === 'pending') acc.pending++;
        else if (req.status === 'in_progress') acc.inProgress++;
        else if (req.status === 'completed') acc.completed++;
        
        // Calculate overdue: not completed/cancelled AND past SLA
        if (!['completed', 'cancelled'].includes(req.status) && req.sla_breach_at) {
          if (new Date(req.sla_breach_at) < now) {
            acc.overdue++;
          }
        }
        
        return acc;
      },
      { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 }
    );
  };

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('maintenance_requests')
        .select('id, status, created_at, title, priority, assigned_to, completed_at, sla_breach_at')
        .is('deleted_at', null);

      // CRITICAL: Apply property filtering for non-super-admins
      // RLS policies enforce this at DB level, but frontend filtering improves UX
      if (!isSuperAdmin) {
        if (currentProperty) {
          query = query.eq('property_id', currentProperty.id);
        } else if (availableProperties.length > 0) {
          const propertyIds = availableProperties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        } else {
          // No property access - return empty
          console.warn('User has no property access');
          setRequestStats({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 });
          setRecentRequests([]);
          setIsLoading(false);
          return;
        }
      }

      // CRITICAL: FE users should only see their own reported requests
      if (userRole === 'fe' && user) {
        query = query.eq('reported_by', user.id);
      }

      query = query.order('created_at', { ascending: false }).limit(50);

      const { data: requests, error } = await query;

      if (error) throw error;

      if (requests) {
        setRequestStats(calculateStats(requests));
        setRecentRequests(requests.slice(0, 10));
      }
    } catch (error: any) {
      toast({
        title: "Error loading requests",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('maintenance-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'maintenance_requests'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          // Show toast notification for completed tasks
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'completed') {
            toast({
              title: "Task Completed! ✅",
              description: `"${payload.new.title}" has been marked as completed`,
              variant: "default"
            });
          }
          
          // Show toast for new requests
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Request Added",
              description: `"${payload.new?.title}" has been submitted`,
              variant: "default"
            });
          }

          // Refetch data to ensure UI is up to date
          fetchRequests();
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProperty, isSuperAdmin, availableProperties, userRole, user]);

  return {
    requestStats,
    recentRequests,
    isLoading,
    refetch: fetchRequests
  };
};
