import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ServerCog, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import DashboardStats from '@/components/admin/dashboard/DashboardStats';
import PerformanceChart from '@/components/admin/dashboard/PerformanceChart';
import AnalyticsTabs from '@/components/admin/dashboard/AnalyticsTabs';
import MonitoringTabs from '@/components/admin/dashboard/MonitoringTabs';
import EquipmentMonitoring from '@/components/admin/dashboard/EquipmentMonitoring';
import { generatePerformanceData, staff, equipment, tickets, slaCompliance } from '@/data/admin-dashboard-data';
import { getStatusBadge } from '@/components/admin/dashboard/BadgeUtils';

const performanceData = generatePerformanceData();

const AdminDashboardPage = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase.rpc('is_admin', { uid: user.id });
          if (error) throw error;
          setIsAdmin(data || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast({
          title: "Access Error",
          description: "Failed to verify administrative privileges",
          variant: "destructive",
        });
      }
    };

    checkAdminStatus();
  }, []);

  if (!isAdmin) {
    return (
      <div className="px-4 py-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <Card className="bg-card/50 backdrop-blur max-w-md w-full">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <ServerCog className="h-16 w-16 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
              <p className="text-gray-400">You don't have permission to access the Admin Dashboard.</p>
              <Button variant="default" className="mt-4" onClick={() => history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">Monitor building operations and performance</p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => navigate('/admin/users')}
        >
          <Users size={16} />
          Manage Users
        </Button>
      </div>

      <DashboardStats 
        tickets={tickets}
        staff={staff}
        equipment={equipment}
        slaCompliance={slaCompliance}
      />

      <PerformanceChart data={performanceData} />

      <AnalyticsTabs />

      <MonitoringTabs />

      <EquipmentMonitoring 
        equipment={equipment}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
};

export default AdminDashboardPage;
