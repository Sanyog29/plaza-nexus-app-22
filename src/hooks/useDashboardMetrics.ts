import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { ACTIVE_REQUEST_STATUSES } from '@/constants/requests';

interface DashboardMetrics {
  activeRequests: number;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  availableRooms: number;
  totalRooms: number;
  activeAlerts: number;
  criticalAlerts: number;
  pendingVisitors: number;
  totalVisitors: number;
  activeVisitors: number;
  pendingMaintenance: number;
  upcomingBookings: number;
  systemAlerts: number;
  slaBreaches: number;
  avgCompletionTime: number;
  slaCompliance: number;
  operationalSystems: boolean;
  currentTemperature: number;
  occupancyRate: number;
  totalOccupants: number;
}

export const useDashboardMetrics = () => {
  // CRITICAL: All hooks MUST be called unconditionally at the top
  const { user, isStaff, isAdmin, userRole, isLoading: isAuthLoading } = useAuth();
  const { currentProperty, isSuperAdmin, availableProperties, isLoadingProperties } = usePropertyContext();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeRequests: 0,
    totalRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    availableRooms: 0,
    totalRooms: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    pendingVisitors: 0,
    totalVisitors: 0,
    activeVisitors: 0,
    pendingMaintenance: 0,
    upcomingBookings: 0,
    systemAlerts: 0,
    slaBreaches: 0,
    avgCompletionTime: 0,
    slaCompliance: 100,
    operationalSystems: true,
    currentTemperature: 0,
    occupancyRate: 0,
    totalOccupants: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const fetchMetricsRef = useRef<() => Promise<void>>();

  const fetchMetrics = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    // CRITICAL: Wait for auth to finish loading before determining filters
    if (isAuthLoading) {
      console.log('[useDashboardMetrics] Waiting for auth to load...');
      return;
    }

    // CRITICAL: Ensure userRole is determined before fetching
    if (!userRole) {
      console.log('[useDashboardMetrics] Waiting for userRole to be determined...');
      return;
    }

    // CRITICAL: Validate isStaff matches userRole to prevent race conditions
    // Note: super_tenant is excluded - they are enhanced tenants, not staff
    const expectedIsStaff = ['admin', 'mst', 'fe', 'hk', 'se', 'bms_operator', 
      'assistant_manager', 'assistant_floor_manager',
      'assistant_general_manager', 'assistant_vice_president'].includes(userRole);

    if (isStaff !== expectedIsStaff) {
      console.warn('[useDashboardMetrics] isStaff mismatch detected! Waiting for sync...', {
        isStaff,
        expectedIsStaff,
        userRole
      });
      return;
    }
    
    try {
      console.log('[useDashboardMetrics] Fetching metrics:', {
        isAuthLoading,
        userRole,
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
        console.log('[useDashboardMetrics] Applying property filter:', {
          currentPropertyId: currentProperty?.id,
          availablePropertiesCount: availableProperties.length
        });
        
        if (currentProperty) {
          requestQuery = requestQuery.eq('property_id', currentProperty.id);
        } else if (availableProperties.length > 0) {
          const propertyIds = availableProperties.map(p => p.id);
          requestQuery = requestQuery.in('property_id', propertyIds);
        } else {
          // No property access - return zero metrics
          console.warn('User has no property access for dashboard metrics');
          if (isMountedRef.current) {
            setIsLoading(false);
          }
          return;
        }
      }
      
      // Non-staff/admin users see only their own requests
      if (!isStaff && !isAdmin && user?.id) {
        console.log('[useDashboardMetrics] Applying user-specific filter for:', user.id);
        requestQuery = requestQuery.eq('reported_by', user.id);
      }

      console.log('[useDashboardMetrics] 🔍 FILTER DIAGNOSTIC:', {
        propertyFilter: currentProperty?.id ? `property_id = ${currentProperty.id}` : availableProperties.length > 0 ? `property_id IN (${availableProperties.length} properties)` : 'NO PROPERTY FILTER',
        userFilter: (!isStaff && !isAdmin && user?.id) ? `reported_by = ${user.id}` : 'NONE (staff/admin access)',
        isStaff,
        isAdmin,
        userRole,
        expectedIsStaff,
        userId: user?.id
      });
      
      // Build additional queries with property filtering
      let bookingsQuery = supabase
        .from('room_bookings')
        .select('*')
        .gte('start_time', new Date().toISOString());

      if (!isStaff && !isAdmin && user?.id) {
        bookingsQuery = bookingsQuery.eq('user_id', user.id);
      }

      let visitorsQuery = supabase
        .from('visitors')
        .select('*')
        .gte('visit_date', today);

      // Build maintenance requests query with property filtering
      let fullRequestQuery = supabase
        .from('maintenance_requests')
        .select('status, created_at, completed_at, sla_breach_at')
        .is('deleted_at', null);

      // Apply property filtering
      if (!isSuperAdmin) {
        if (currentProperty) {
          fullRequestQuery = fullRequestQuery.eq('property_id', currentProperty.id);
        } else if (availableProperties.length > 0) {
          const propertyIds = availableProperties.map(p => p.id);
          fullRequestQuery = fullRequestQuery.in('property_id', propertyIds);
        } else {
          // No property access - skip query
          console.warn('User has no property access for dashboard metrics');
          if (isMountedRef.current) {
            setIsLoading(false);
          }
          return;
        }
      }

      // Apply user filtering for non-staff
      if (!isStaff && !isAdmin && user?.id) {
        fullRequestQuery = fullRequestQuery.eq('reported_by', user.id);
      }

      console.log('[useDashboardMetrics] 🔍 FULL REQUEST QUERY DIAGNOSTIC:', {
        propertyFilter: currentProperty?.id ? `property_id = ${currentProperty.id}` : availableProperties.length > 0 ? `property_id IN (${availableProperties.length} properties)` : 'NO PROPERTY FILTER',
        userFilter: (!isStaff && !isAdmin && user?.id) ? `reported_by = ${user.id}` : 'NONE (staff/admin access)',
        isStaff,
        isAdmin,
        userRole,
        userId: user?.id
      });

      // Use Promise.allSettled to make queries resilient to individual failures
      const results = await Promise.allSettled([
        // Core maintenance requests (critical) - get full data for calculations
        fullRequestQuery,
        
        // Optional room data
        supabase
          .from('rooms')
          .select('id'),
        
        // Optional booking data - today's bookings for room availability
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
        visitorsQuery,

        // User's upcoming bookings
        bookingsQuery
      ]);

      const [requestsResult, roomsResult, todayBookingsResult, alertsResult, visitorsResult, upcomingBookingsResult] = results;

      console.log('[useDashboardMetrics] Query results:', {
        requestsCount: requestsResult.status === 'fulfilled' ? requestsResult.value.data?.length : 'error',
        roomsCount: roomsResult.status === 'fulfilled' ? roomsResult.value.data?.length : 'error',
        todayBookingsCount: todayBookingsResult.status === 'fulfilled' ? todayBookingsResult.value.data?.length : 'error',
        alertsCount: alertsResult.status === 'fulfilled' ? alertsResult.value.data?.length : 'error',
        visitorsCount: visitorsResult.status === 'fulfilled' ? visitorsResult.value.data?.length : 'error',
        upcomingBookingsCount: upcomingBookingsResult.status === 'fulfilled' ? upcomingBookingsResult.value.data?.length : 'error',
      });

      // Extract request data (always available)
      const requests = requestsResult.status === 'fulfilled' ? requestsResult.value.data : [];

      // Use canonical definitions for consistency
      const activeRequests = requests?.filter(r => 
        ACTIVE_REQUEST_STATUSES.includes(r.status as any)
      ).length || 0;
      const totalRequests = requests?.length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const pendingMaintenance = pendingRequests;

      // Calculate SLA metrics
      const slaBreaches = requests?.filter(r => 
        r.sla_breach_at && new Date(r.sla_breach_at) < new Date() && r.status !== 'completed'
      ).length || 0;

      const avgCompletionTime = completedRequests > 0
        ? requests
            ?.filter(r => r.status === 'completed' && r.completed_at && r.created_at)
            .reduce((acc, req) => {
              const diff = new Date(req.completed_at!).getTime() - new Date(req.created_at).getTime();
              return acc + (diff / (1000 * 60 * 60)); // Convert to hours
            }, 0) / completedRequests
        : 0;

      const slaCompliance = totalRequests > 0
        ? ((totalRequests - slaBreaches) / totalRequests) * 100
        : 100;

      // Extract optional data with fallbacks
      const rooms = roomsResult.status === 'fulfilled' ? roomsResult.value.data : [];
      const todayBookings = todayBookingsResult.status === 'fulfilled' ? todayBookingsResult.value.data : [];
      
      const bookedRoomIds = new Set(todayBookings?.map(b => b.room_id) || []);
      const totalRooms = rooms?.length || 0;
      const availableRooms = totalRooms - bookedRoomIds.size;

      const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value.data : [];
      const activeAlerts = alerts?.length || 0;
      const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;

      const visitors = visitorsResult.status === 'fulfilled' ? visitorsResult.value.data : [];
      const pendingVisitors = visitors?.filter(v => v.status === 'scheduled' || v.status === 'pending').length || 0;
      const totalVisitors = visitors?.length || 0;
      const activeVisitors = visitors?.filter(v => v.approval_status === 'approved' && !v.check_out_time).length || 0;

      const upcomingBookings = upcomingBookingsResult.status === 'fulfilled' ? upcomingBookingsResult.value.data?.length || 0 : 0;

      console.log('[useDashboardMetrics] Final metrics:', {
        activeRequests,
        totalRequests,
        completedRequests,
        pendingRequests,
        slaBreaches,
        avgCompletionTime: avgCompletionTime.toFixed(2),
        slaCompliance: slaCompliance.toFixed(2),
        totalRooms,
        availableRooms,
        activeAlerts,
        totalVisitors,
        activeVisitors,
        pendingVisitors,
        upcomingBookings
      });

      // Calculate derived metrics
      const operationalSystems = activeAlerts === 0 && pendingMaintenance === 0;

      // Default values for missing systems
      const occupancyRate = 0;
      const totalOccupants = 0;
      const currentTemperature = 0;

      if (!isMountedRef.current) return;

      setMetrics({
        activeRequests,
        totalRequests,
        completedRequests,
        pendingRequests,
        availableRooms,
        totalRooms,
        activeAlerts,
        criticalAlerts,
        pendingVisitors,
        totalVisitors,
        activeVisitors,
        pendingMaintenance,
        upcomingBookings,
        systemAlerts: activeAlerts,
        slaBreaches,
        avgCompletionTime,
        slaCompliance,
        operationalSystems,
        currentTemperature,
        occupancyRate,
        totalOccupants,
      });

    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('Error fetching dashboard metrics:', error);
      toast({
        title: "Error loading dashboard data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    currentProperty?.id, 
    isSuperAdmin, 
    availableProperties.map(p => p.id).join(','), // Stable property IDs
    user?.id, 
    isStaff, 
    isAdmin,
    isAuthLoading,
    userRole
  ]);

  // Use useLayoutEffect to update ref synchronously before any effects run
  useLayoutEffect(() => {
    fetchMetricsRef.current = fetchMetrics;
  }, [fetchMetrics]);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  useEffect(() => {
    // CRITICAL: Wait for both auth and property context to load
    if (isAuthLoading) {
      console.log('[useDashboardMetrics] Waiting for auth to load');
      return;
    }

    if (!userRole) {
      console.log('[useDashboardMetrics] Waiting for userRole to be determined');
      return;
    }

    if (isLoadingProperties) {
      console.log('[useDashboardMetrics] Waiting for PropertyContext to load');
      return;
    }
    
    console.log('[useDashboardMetrics] Auth and PropertyContext loaded, starting fetch');
    fetchMetrics();
    
    // Set up real-time updates with ref to avoid stale closures
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        () => {
          console.log('[useDashboardMetrics] Real-time update: maintenance_requests');
          fetchMetricsRef.current?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          console.log('[useDashboardMetrics] Real-time update: alerts');
          fetchMetricsRef.current?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors' },
        () => {
          console.log('[useDashboardMetrics] Real-time update: visitors');
          fetchMetricsRef.current?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_bookings' },
        () => {
          console.log('[useDashboardMetrics] Real-time update: room_bookings');
          fetchMetricsRef.current?.();
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [isAuthLoading, isLoadingProperties, userRole, isStaff, fetchMetrics]);

  return { 
    metrics, 
    isLoading: isAuthLoading || isLoadingProperties || isLoading, 
    refreshMetrics: fetchMetrics 
  };
};