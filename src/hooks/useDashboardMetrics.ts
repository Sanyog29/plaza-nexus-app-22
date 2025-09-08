import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface DashboardMetrics {
  activeRequests: number;
  totalRequests: number;
  completedRequests: number;
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
    completedRequests: 0,
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
      
      // Use Promise.allSettled to make queries resilient to individual failures
      const results = await Promise.allSettled([
        // Core maintenance requests (critical)
        supabase
          .from('maintenance_requests')
          .select('status'),
        
        // Optional room data
        supabase
          .from('rooms')
          .select('id'),
        
        // Optional booking data
        supabase
          .from('room_bookings')
          .select('room_id')
          .gte('start_time', `${today}T00:00:00`)
          .lt('start_time', `${today}T23:59:59`),
        
        // Optional alerts data
        supabase
          .from('alerts')
          .select('severity, is_active')
          .eq('is_active', true),
        
        // Optional visitors data
        supabase
          .from('visitors')
          .select('status')
          .eq('visit_date', today)
      ]);

      // Extract request data (always available)
      const requestsResult = results[0];
      const requests = requestsResult.status === 'fulfilled' ? requestsResult.value.data : [];

      const activeRequests = requests?.filter(r => r.status === 'pending' || r.status === 'in_progress').length || 0;
      const totalRequests = requests?.length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const pendingMaintenance = requests?.filter(r => r.status === 'pending').length || 0;

      // Extract optional data with fallbacks
      const roomsResult = results[1];
      const rooms = roomsResult.status === 'fulfilled' ? roomsResult.value.data : [];
      
      const bookingsResult = results[2];
      const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data : [];
      
      const bookedRoomIds = new Set(bookings?.map(b => b.room_id) || []);
      const totalRooms = rooms?.length || 0;
      const availableRooms = totalRooms - bookedRoomIds.size;

      const alertsResult = results[3];
      const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value.data : [];
      
      const activeAlerts = alerts?.length || 0;
      const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;

      const visitorsResult = results[4];
      const visitors = visitorsResult.status === 'fulfilled' ? visitorsResult.value.data : [];
      
      const pendingVisitors = visitors?.filter(v => v.status === 'scheduled' || v.status === 'pending').length || 0;
      const totalVisitors = visitors?.length || 0;

      // Calculate derived metrics
      const operationalSystems = activeAlerts === 0 && pendingMaintenance === 0;

      // Default values for missing systems
      const occupancyRate = 0;
      const totalOccupants = 0;
      const currentTemperature = 0;

      setMetrics({
        activeRequests,
        totalRequests,
        completedRequests,
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