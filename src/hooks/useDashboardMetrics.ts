import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface DashboardMetrics {
  activeRequests: number;
  totalRequests: number;
  availableRooms: number;
  totalRooms: number;
  activeAlerts: number;
  criticalAlerts: number;
  pendingVisitors: number;
  totalVisitors: number;
  pendingMaintenance: number;
  operationalSystems: boolean;
  currentTemperature: number;
  occupancyRate: number;
  totalOccupants: number;
}

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeRequests: 0,
    totalRequests: 0,
    availableRooms: 0,
    totalRooms: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    pendingVisitors: 0,
    totalVisitors: 0,
    pendingMaintenance: 0,
    operationalSystems: true,
    currentTemperature: 0,
    occupancyRate: 0,
    totalOccupants: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch maintenance requests
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('status');

      const activeRequests = requests?.filter(r => r.status === 'pending' || r.status === 'in_progress').length || 0;
      const totalRequests = requests?.length || 0;

      // Fetch room availability (rooms not booked today)
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id');

      const { data: bookings } = await supabase
        .from('room_bookings')
        .select('room_id')
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`);

      const bookedRoomIds = new Set(bookings?.map(b => b.room_id) || []);
      const totalRooms = rooms?.length || 0;
      const availableRooms = totalRooms - bookedRoomIds.size;

      // Fetch alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select('severity, is_active')
        .eq('is_active', true);

      const activeAlerts = alerts?.length || 0;
      const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;

      // Fetch visitors
      const { data: visitors } = await supabase
        .from('visitors')
        .select('status')
        .eq('visit_date', today);

      const pendingVisitors = visitors?.filter(v => v.status === 'scheduled' || v.status === 'pending').length || 0;
      const totalVisitors = visitors?.length || 0;

      // Calculate maintenance status
      const pendingMaintenance = requests?.filter(r => r.status === 'pending').length || 0;
      const operationalSystems = activeAlerts === 0 && pendingMaintenance === 0;

      // Empty system - no occupancy or temperature data
      const occupancyRate = 0;
      const totalOccupants = 0;

      // Empty system - no temperature data
      const currentTemperature = 0;

      setMetrics({
        activeRequests,
        totalRequests,
        availableRooms,
        totalRooms,
        activeAlerts,
        criticalAlerts,
        pendingVisitors,
        totalVisitors,
        pendingMaintenance,
        operationalSystems,
        currentTemperature,
        occupancyRate,
        totalOccupants,
      });

    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
      toast({
        title: "Error loading dashboard data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Set up real-time updates
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors' },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_bookings' },
        () => fetchMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { metrics, isLoading, refreshMetrics: fetchMetrics };
};