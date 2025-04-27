import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, User, Clock, ServerCog } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

// Import custom admin dashboard components
import MaintenanceHeatmap from '@/components/admin/MaintenanceHeatmap';
import StaffWorkloadChart from '@/components/admin/StaffWorkloadChart';
import EquipmentCostChart from '@/components/admin/EquipmentCostChart';
import DashboardStats from '@/components/admin/dashboard/DashboardStats';
import PerformanceChart from '@/components/admin/dashboard/PerformanceChart';
import TicketManagement from '@/components/admin/dashboard/TicketManagement';
import StaffAttendance from '@/components/admin/dashboard/StaffAttendance';
import SLAComplianceReport from '@/components/admin/dashboard/SLAComplianceReport';
import EquipmentMonitoring from '@/components/admin/dashboard/EquipmentMonitoring';
import { getStatusBadge, getPriorityBadge, getTrendBadge } from '@/components/admin/dashboard/BadgeUtils';

// Sample data generation function
const generatePerformanceData = () => {
  const result = [];
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i);
    result.push({
      date: format(date, 'MMM dd'),
      totalRequests: Math.floor(Math.random() * 10) + 5,
      completed: Math.floor(Math.random() * 8) + 2,
      breached: Math.floor(Math.random() * 2),
    });
  }
  return result;
};

// Sample data
const performanceData = generatePerformanceData();
const staff = [
  { id: 'staff-1', name: 'Amit Sharma', role: 'Maintenance Technician', status: 'active', currentTask: 'HVAC repair on 3rd floor', attendance: 'present' },
  { id: 'staff-2', name: 'Priya Patel', role: 'Security Officer', status: 'active', currentTask: 'Main entrance monitoring', attendance: 'present' },
  { id: 'staff-3', name: 'Rajiv Kumar', role: 'Electrician', status: 'break', currentTask: 'Scheduled break', attendance: 'present' },
  { id: 'staff-4', name: 'Sunita Verma', role: 'Cleaning Supervisor', status: 'active', currentTask: 'Floor inspection', attendance: 'present' },
  { id: 'staff-5', name: 'Vikram Singh', role: 'Maintenance Technician', status: 'offline', currentTask: 'Off duty', attendance: 'absent' },
];

const equipment = [
  { id: 'equip-1', name: 'Main HVAC System', status: 'operational', lastMaintenance: '2025-04-15', health: '95%', alerts: 0 },
  { id: 'equip-2', name: 'Backup Generator', status: 'maintenance-due', lastMaintenance: '2025-01-20', health: '78%', alerts: 2 },
  { id: 'equip-3', name: 'Elevator System', status: 'operational', lastMaintenance: '2025-03-10', health: '92%', alerts: 0 },
  { id: 'equip-4', name: 'Security Cameras', status: 'needs-attention', lastMaintenance: '2025-02-25', health: '85%', alerts: 1 },
  { id: 'equip-5', name: 'Fire Alarm System', status: 'operational', lastMaintenance: '2025-04-05', health: '98%', alerts: 0 },
];

const tickets = [
  { id: 'ticket-1', title: 'AC not working in Room 305', priority: 'high', status: 'in-progress', createdAt: '2025-04-25', assignedTo: 'Amit Sharma' },
  { id: 'ticket-2', title: 'Flickering lights in hallway', priority: 'medium', status: 'assigned', createdAt: '2025-04-26', assignedTo: 'Rajiv Kumar' },
  { id: 'ticket-3', title: 'Water leak in bathroom', priority: 'high', status: 'open', createdAt: '2025-04-26', assignedTo: 'Unassigned' },
  { id: 'ticket-4', title: 'Door lock broken', priority: 'medium', status: 'open', createdAt: '2025-04-27', assignedTo: 'Unassigned' },
  { id: 'ticket-5', title: 'Replace light bulbs in lobby', priority: 'low', status: 'completed', createdAt: '2025-04-24', assignedTo: 'Sunita Verma' },
];

const slaCompliance = [
  { id: 'sla-1', category: 'HVAC Issues', target: '4 hours', actual: '3.5 hours', compliance: '100%', trend: 'improving' },
  { id: 'sla-2', category: 'Electrical Issues', target: '2 hours', actual: '1.8 hours', compliance: '100%', trend: 'stable' },
  { id: 'sla-3', category: 'Plumbing Issues', target: '3 hours', actual: '3.2 hours', compliance: '96%', trend: 'declining' },
  { id: 'sla-4', category: 'Security Issues', target: '1 hour', actual: '0.8 hours', compliance: '100%', trend: 'improving' },
  { id: 'sla-5', category: 'General Maintenance', target: '24 hours', actual: '18 hours', compliance: '100%', trend: 'stable' },
];

const AdminDashboardPage = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

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
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">Monitor building operations and performance</p>
      </div>

      <DashboardStats 
        tickets={tickets}
        staff={staff}
        equipment={equipment}
        slaCompliance={slaCompliance}
      />

      <PerformanceChart data={performanceData} />

      <Tabs defaultValue="heatmap" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6 bg-card/50">
          <TabsTrigger value="heatmap" className="data-[state=active]:bg-plaza-blue">
            Heatmaps
          </TabsTrigger>
          <TabsTrigger value="staffing" className="data-[state=active]:bg-plaza-blue">
            Staff Workload
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:bg-plaza-blue">
            Budget Impact
          </TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap">
          <MaintenanceHeatmap />
        </TabsContent>

        <TabsContent value="staffing">
          <StaffWorkloadChart />
        </TabsContent>

        <TabsContent value="budget">
          <EquipmentCostChart />
        </TabsContent>
      </Tabs>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6 bg-card/50">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-plaza-blue">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-plaza-blue">
            <User className="h-4 w-4 mr-2" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="sla" className="data-[state=active]:bg-plaza-blue">
            <Clock className="h-4 w-4 mr-2" />
            SLA Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <TicketManagement 
            tickets={tickets}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>

        <TabsContent value="staff">
          <StaffAttendance 
            staff={staff}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="sla">
          <SLAComplianceReport 
            slaCompliance={slaCompliance}
            getTrendBadge={getTrendBadge}
          />
        </TabsContent>
      </Tabs>

      <EquipmentMonitoring 
        equipment={equipment}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
};

export default AdminDashboardPage;
