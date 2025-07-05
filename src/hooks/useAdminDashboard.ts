import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  activeAlerts: number;
  totalUsers: number;
  staffCount: number;
  equipmentCount: number;
  slaCompliance: number;
}

interface RecentRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  reporter?: {
    first_name?: string;
    last_name?: string;
  };
}

export const useAdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    activeAlerts: 0,
    totalUsers: 0,
    staffCount: 0,
    equipmentCount: 0,
    slaCompliance: 0
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc('is_admin', { uid: user.id });
        if (error) throw error;
        setIsAdmin(data || false);
        
        if (data) {
          await fetchDashboardData();
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: "Access Error",
        description: "Failed to verify administrative privileges",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch maintenance requests stats
      const { data: allRequests } = await supabase
        .from('maintenance_requests')
        .select('status, created_at, sla_breach_at');

      const totalRequests = allRequests?.length || 0;
      const pendingRequests = allRequests?.filter(r => r.status === 'pending').length || 0;
      const completedRequests = allRequests?.filter(r => r.status === 'completed').length || 0;
      
      // Calculate SLA compliance
      const completedWithinSLA = allRequests?.filter(r => 
        r.status === 'completed' && 
        (!r.sla_breach_at || new Date(r.created_at) <= new Date(r.sla_breach_at))
      ).length || 0;
      const slaCompliance = completedRequests > 0 ? Math.round((completedWithinSLA / completedRequests) * 100) : 100;

      // Fetch active alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select('id')
        .eq('is_active', true);

      // Fetch users count
      const { data: users } = await supabase.rpc('get_user_management_data');
      const totalUsers = users?.length || 0;
      const staffCount = users?.filter(u => u.role === 'staff' || u.role === 'admin').length || 0;

      // Fetch equipment count
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id');

      // Fetch recent requests
      const { data: recent } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          reporter:profiles!reported_by (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setDashboardStats({
        totalRequests,
        pendingRequests,
        completedRequests,
        activeAlerts: alerts?.length || 0,
        totalUsers,
        staffCount,
        equipmentCount: equipment?.length || 0,
        slaCompliance
      });

      setRecentRequests(recent || []);

    } catch (error: any) {
      toast({
        title: "Error loading dashboard data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  return {
    isAdmin,
    dashboardStats,
    recentRequests,
    isLoading
  };
};