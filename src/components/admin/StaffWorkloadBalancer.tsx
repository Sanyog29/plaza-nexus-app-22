
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  User,
  BarChart3,
  Calendar
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { extractCategoryName } from '@/utils/categoryUtils';

interface StaffMember {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  workload: {
    active: number;
    pending: number;
    completed_today: number;
    avg_resolution_time: number;
    utilization_rate: number;
  };
  performance: {
    sla_compliance: number;
    customer_rating: number;
    tasks_completed: number;
  };
}

interface WorkloadDistribution {
  staff_id: string;
  request_count: number;
  priority_breakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  category_breakdown: { [key: string]: number };
}

const StaffWorkloadBalancer: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [workloadDistribution, setWorkloadDistribution] = useState<WorkloadDistribution[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchStaffWorkload();
    }
  }, [user, selectedDepartment]);

  const fetchStaffWorkload = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch staff members - get both profiles and auth.users data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['field_staff', 'ops_supervisor'])
        .eq('approval_status', 'approved');

      if (profiles) {
        // Get unique departments
        const depts = [...new Set(profiles.map(p => p.department).filter(Boolean))];
        setDepartments(depts);

        // Fetch workload data for each staff member
        const staffWithWorkload = await Promise.all(
          profiles.map(async (profile) => {
            // Active requests
            const { data: activeRequests } = await supabase
              .from('maintenance_requests')
              .select(`
                *,
                main_categories!maintenance_requests_category_id_fkey(name)
              `)
              .eq('assigned_to', profile.id)
              .in('status', ['assigned', 'in_progress'])
              .is('deleted_at', null);

            // Completed requests today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data: completedToday } = await supabase
              .from('maintenance_requests')
              .select('id')
              .eq('assigned_to', profile.id)
              .eq('status', 'completed')
              .gte('completed_at', today.toISOString())
              .is('deleted_at', null);

            // Calculate metrics
            const active = activeRequests?.length || 0;
            const pending = activeRequests?.filter(r => r.status === 'assigned').length || 0;
            const completed_today = completedToday?.length || 0;

            // Get display name
            const displayName = profile.first_name && profile.last_name 
              ? `${profile.first_name} ${profile.last_name}` 
              : profile.first_name || 'Staff Member';

            return {
              id: profile.id,
              email: '', // Not available from profiles table
              first_name: profile.first_name,
              last_name: profile.last_name,
              department: profile.department,
              workload: {
                active,
                pending,
                completed_today,
                avg_resolution_time: 0, // Would calculate from historical data
                utilization_rate: Math.min((active / 10) * 100, 100) // Assuming max 10 concurrent tasks
              },
              performance: {
                sla_compliance: 95, // Would calculate from SLA data
                customer_rating: 4.5, // Would get from feedback
                tasks_completed: completed_today
              }
            };
          })
        );

        setStaffMembers(staffWithWorkload);

        // Calculate workload distribution
        const distribution = await Promise.all(
          profiles.map(async (profile) => {
            const { data: requests } = await supabase
              .from('maintenance_requests')
              .select(`
                priority,
                main_categories!maintenance_requests_category_id_fkey(name)
              `)
              .eq('assigned_to', profile.id)
              .in('status', ['assigned', 'in_progress'])
              .is('deleted_at', null);

            const priority_breakdown = {
              urgent: 0,
              high: 0,
              medium: 0,
              low: 0
            };

            const category_breakdown: { [key: string]: number } = {};

            requests?.forEach(req => {
              // Count by priority
              priority_breakdown[req.priority as keyof typeof priority_breakdown]++;
              
              // Count by category
              const categoryName = extractCategoryName(req.main_categories);
              category_breakdown[categoryName] = (category_breakdown[categoryName] || 0) + 1;
            });

            return {
              staff_id: profile.id,
              request_count: requests?.length || 0,
              priority_breakdown,
              category_breakdown
            };
          })
        );

        setWorkloadDistribution(distribution);
      }

    } catch (error) {
      console.error('Error fetching staff workload:', error);
      toast({
        title: "Error",
        description: "Failed to load staff workload data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = selectedDepartment === 'all'
    ? staffMembers
    : staffMembers.filter(staff => staff.department === selectedDepartment);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Workload Balancer</h1>
          <p className="text-muted-foreground">Monitor and manage staff workload distribution</p>
        </div>
        <Select onValueChange={setSelectedDepartment} defaultValue={selectedDepartment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Dept" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map(staff => {
          const distribution = workloadDistribution.find(d => d.staff_id === staff.id);
          const displayName = staff.first_name && staff.last_name 
            ? `${staff.first_name} ${staff.last_name}` 
            : staff.first_name || 'Staff Member';

          return (
            <Card key={staff.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {displayName}
                  </div>
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Tasks</span>
                    <span className="font-medium">{staff.workload.active}</span>
                  </div>
                  <Progress value={staff.workload.utilization_rate} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending Tasks</span>
                    <span className="font-medium">{staff.workload.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed Today</span>
                    <span className="font-medium">{staff.workload.completed_today}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">SLA Compliance</span>
                    <span className="font-medium">{staff.performance.sla_compliance}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StaffWorkloadBalancer;
