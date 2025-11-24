import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { ACTIVE_REQUEST_STATUSES } from '@/constants/requests';

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
  // CRITICAL: All hooks MUST be called unconditionally at the top
  const { user, isStaff, isAdmin } = useAuth();
  const { currentProperty, isSuperAdmin, availableProperties, isLoadingProperties } = usePropertyContext();
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
      console.log('[useDashboardMetrics] Fetching metrics:', {
        currentPropertyId: currentProperty?.id,
        currentPropertyName: currentProperty?.name,
        availablePropertiesCount: availableProperties.length,
        isSuperAdmin,
        userId: user?.id,
        isStaff,
        isAdmin
      });
      
      const today = new Date().toISOString().split('T')[0];
      
      // Build role-scoped query for maintenance requests
      let requestQuery = supabase
        .from('maintenance_requests')
        .select('status')
        .is('deleted_at', null);
      
      // CRITICAL: Apply property filtering for non-super-admins
      if (!isSuperAdmin) {
        if (currentProperty) {
          requestQuery = requestQuery.eq('property_id', currentProperty.id);
        } else if (availableProperties.length > 0) {
          const propertyIds = availableProperties.map(p => p.id);
          requestQuery = requestQuery.in('property_id', propertyIds);
        } else {
          // No property access - return zero metrics
          console.warn('User has no property access for dashboard metrics');
          setIsLoading(false);
          return;
        }
      }
      
      // Non-staff/admin users see only their own requests
      if (!isStaff && !isAdmin && user?.id) {
        requestQuery = requestQuery.eq('reported_by', user.id);
      }
      
      // Use Promise.allSettled to make queries resilient to individual failures
      const results = await Promise.allSettled([
        // Core maintenance requests (critical)
        requestQuery,
        
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

      const [requestsResult, roomsResult, bookingsResult, alertsResult, visitorsResult] = results;

      console.log('[useDashboardMetrics] Query results:', {
        requestsCount: requestsResult.status === 'fulfilled' ? requestsResult.value.data?.length : 'error',
        roomsCount: roomsResult.status === 'fulfilled' ? roomsResult.value.data?.length : 'error',
        bookingsCount: bookingsResult.status === 'fulfilled' ? bookingsResult.value.data?.length : 'error',
        alertsCount: alertsResult.status === 'fulfilled' ? alertsResult.value.data?.length : 'error',
        visitorsCount: visitorsResult.status === 'fulfilled' ? visitorsResult.value.data?.length : 'error',
      });

      // Extract request data (always available)
      const requests = requestsResult.status === 'fulfilled' ? requestsResult.value.data : [];

      // Use canonical definitions for consistency
      const activeRequests = requests?.filter(r => 
        ACTIVE_REQUEST_STATUSES.includes(r.status as any)
      ).length || 0;
      const totalRequests = requests?.length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const pendingMaintenance = requests?.filter(r => r.status === 'pending').length || 0;

      // Extract optional data with fallbacks
      const rooms = roomsResult.status === 'fulfilled' ? roomsResult.value.data : [];
      const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data : [];
      
      const bookedRoomIds = new Set(bookings?.map(b => b.room_id) || []);
      const totalRooms = rooms?.length || 0;
      const availableRooms = totalRooms - bookedRoomIds.size;

      const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value.data : [];
      const activeAlerts = alerts?.length || 0;
      const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;

      const visitors = visitorsResult.status === 'fulfilled' ? visitorsResult.value.data : [];
      const pendingVisitors = visitors?.filter(v => v.status === 'scheduled' || v.status === 'pending').length || 0;
      const totalVisitors = visitors?.length || 0;

      console.log('[useDashboardMetrics] Final metrics:', {
        activeRequests,
        totalRequests,
        completedRequests,
        totalRooms,
        availableRooms,
        activeAlerts,
        totalVisitors,
        pendingVisitors
      });

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
    // Skip fetching if PropertyContext is still loading
    if (isLoadingProperties) {
      console.log('[useDashboardMetrics] Waiting for PropertyContext to load');
      return;
    }
    
    console.log('[useDashboardMetrics] PropertyContext loaded, starting fetch');
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
  }, [currentProperty?.id, isSuperAdmin, availableProperties.length, isLoadingProperties, user?.id, isStaff, isAdmin]);

  // Return loading state while PropertyContext loads
  if (isLoadingProperties) {
    return { 
      metrics,
      isLoading: true,
      refreshMetrics: async () => {}
    };
  }

  return { metrics, isLoading, refreshMetrics: fetchMetrics };
};