import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MaintenanceRequest {
  id: string;
  status: string;
  created_at: string;
  title: string;
  priority: string;
  assigned_to?: string;
  completed_at?: string;
}

interface RequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export const useRealtimeMaintenanceRequests = () => {
  const [requestStats, setRequestStats] = useState<RequestStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [recentRequests, setRecentRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateStats = (requests: MaintenanceRequest[]): RequestStats => {
    return requests.reduce(
      (acc, req) => {
        acc.total++;
        if (req.status === 'pending') acc.pending++;
        else if (req.status === 'in_progress') acc.inProgress++;
        else if (req.status === 'completed') acc.completed++;
        return acc;
      },
      { total: 0, pending: 0, inProgress: 0, completed: 0 }
    );
  };

  const fetchRequests = async () => {
    try {
      const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select('id, status, created_at, title, priority, assigned_to, completed_at')
        .order('created_at', { ascending: false })
        .limit(50); // Increased limit for better stats

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
  }, []);

  return {
    requestStats,
    recentRequests,
    isLoading,
    refetch: fetchRequests
  };
};