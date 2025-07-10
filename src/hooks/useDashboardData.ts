import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface DashboardMetrics {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  slaBreaches: number;
  totalVisitors: number;
  activeVisitors: number;
  upcomingBookings: number;
  systemAlerts: number;
  avgCompletionTime: number;
  slaCompliance: number;
}

export const useDashboardData = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    slaBreaches: 0,
    totalVisitors: 0,
    activeVisitors: 0,
    upcomingBookings: 0,
    systemAlerts: 0,
    avgCompletionTime: 0,
    slaCompliance: 100,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, isStaff } = useAuth();

  const fetchDashboardMetrics = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Maintenance requests metrics
      const requestsQuery = isStaff 
        ? supabase.from('maintenance_requests').select('*')
        : supabase.from('maintenance_requests').select('*').eq('reported_by', user.id);
      
      const { data: requests, error: requestsError } = await requestsQuery;
      
      if (requestsError) throw requestsError;

      // Visitors metrics (staff only)
      let visitors = [];
      if (isStaff) {
        const { data: visitorsData, error: visitorsError } = await supabase
          .from('visitors')
          .select('*')
          .gte('visit_date', new Date().toISOString().split('T')[0]);
        
        if (visitorsError) throw visitorsError;
        visitors = visitorsData || [];
      }

      // Room bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('room_bookings')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', new Date().toISOString());
      
      if (bookingsError) throw bookingsError;

      // System alerts (staff only)
      let alerts = [];
      if (isStaff) {
        const { data: alertsData, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .eq('is_active', true);
        
        if (alertsError) throw alertsError;
        alerts = alertsData || [];
      }

      // Calculate metrics
      const completedRequests = requests?.filter(r => r.status === 'completed') || [];
      const avgCompletionTime = completedRequests.length > 0
        ? completedRequests.reduce((acc, req) => {
            if (req.completed_at && req.created_at) {
              const diff = new Date(req.completed_at).getTime() - new Date(req.created_at).getTime();
              return acc + (diff / (1000 * 60 * 60)); // Convert to hours
            }
            return acc;
          }, 0) / completedRequests.length
        : 0;

      const slaBreaches = requests?.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < new Date() && r.status !== 'completed'
      ).length || 0;

      const slaCompliance = requests?.length > 0
        ? ((requests.length - slaBreaches) / requests.length) * 100
        : 100;

      setMetrics({
        totalRequests: requests?.length || 0,
        pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
        completedRequests: completedRequests.length,
        slaBreaches,
        totalVisitors: visitors.length,
        activeVisitors: visitors.filter(v => v.approval_status === 'approved' && !v.checkout_time).length,
        upcomingBookings: bookings?.length || 0,
        systemAlerts: alerts.length,
        avgCompletionTime,
        slaCompliance,
      });

    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();

    // Set up real-time subscriptions
    const requestsChannel = supabase
      .channel('dashboard-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests',
        },
        () => fetchDashboardMetrics()
      )
      .subscribe();

    const visitorsChannel = supabase
      .channel('dashboard-visitors')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitors',
        },
        () => fetchDashboardMetrics()
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel('dashboard-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_bookings',
        },
        () => fetchDashboardMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(visitorsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [user, isStaff]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchDashboardMetrics,
  };
};