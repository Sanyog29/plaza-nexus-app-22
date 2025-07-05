import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, Clock, AlertTriangle, CheckCircle, 
  ArrowRight, RotateCcw, Zap 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  activeRequests: number;
  completedToday: number;
  avgResponseTime: number;
  workload: number;
  availability: 'available' | 'busy' | 'offline';
  specialties: string[];
}

interface PendingRequest {
  id: string;
  title: string;
  priority: string;
  category: string;
  estimatedTime: number;
  suggestedStaff: string;
}

const StaffWorkloadBalancer = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoBalanceEnabled, setAutoBalanceEnabled] = useState(false);

  const fetchStaffWorkload = async () => {
    try {
      // Fetch staff members
      const { data: staffProfiles } = await supabase.rpc('get_user_management_data');
      const staffList = staffProfiles?.filter(s => s.role === 'staff' || s.role === 'admin') || [];

      // Fetch active requests for each staff member
      const staffWithWorkload = await Promise.all(
        staffList.map(async (staff) => {
          const { data: activeRequests } = await supabase
            .from('maintenance_requests')
            .select('*')
            .eq('assigned_to', staff.id)
            .in('status', ['pending', 'in_progress']);

          const { data: completedToday } = await supabase
            .from('maintenance_requests')
            .select('*')
            .eq('assigned_to', staff.id)
            .eq('status', 'completed')
            .gte('completed_at', new Date().toISOString().split('T')[0]);

          // Calculate average response time
          const { data: completedRequests } = await supabase
            .from('maintenance_requests')
            .select('created_at, completed_at')
            .eq('assigned_to', staff.id)
            .eq('status', 'completed')
            .limit(10);

          let avgResponseTime = 0;
          if (completedRequests && completedRequests.length > 0) {
            const totalTime = completedRequests.reduce((acc, req) => {
              const created = new Date(req.created_at);
              const completed = new Date(req.completed_at);
              return acc + (completed.getTime() - created.getTime());
            }, 0);
            avgResponseTime = totalTime / (completedRequests.length * 60 * 60 * 1000); // Convert to hours
          }

          const workload = Math.min((activeRequests?.length || 0) * 25, 100);
          
          return {
            id: staff.id,
            name: `${staff.first_name} ${staff.last_name}`.trim() || 'Unknown',
            role: staff.role,
            activeRequests: activeRequests?.length || 0,
            completedToday: completedToday?.length || 0,
            avgResponseTime: Number(avgResponseTime.toFixed(1)),
            workload,
            availability: workload > 75 ? 'busy' : workload > 40 ? 'available' : 'available',
            specialties: ['General Maintenance', 'HVAC'] // Mock data - could be expanded
          } as StaffMember;
        })
      );

      // Fetch unassigned pending requests
      const { data: unassignedRequests } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          title,
          priority,
          category:maintenance_categories(name)
        `)
        .eq('status', 'pending')
        .is('assigned_to', null);

      const pendingWithSuggestions = (unassignedRequests || []).map(req => {
        // Simple algorithm to suggest best staff member
        const availableStaff = staffWithWorkload
          .filter(s => s.availability === 'available')
          .sort((a, b) => a.workload - b.workload);
        
        const suggestedStaff = availableStaff[0]?.name || 'No available staff';
        
        return {
          id: req.id,
          title: req.title,
          priority: req.priority,
          category: req.category?.name || 'General',
          estimatedTime: req.priority === 'urgent' ? 2 : req.priority === 'high' ? 4 : 8,
          suggestedStaff
        };
      });

      setStaffMembers(staffWithWorkload);
      setPendingRequests(pendingWithSuggestions);

    } catch (error) {
      console.error('Error fetching staff workload:', error);
      toast({
        title: "Error loading staff workload",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffWorkload();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchStaffWorkload, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const assignRequest = async (requestId: string, staffId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ assigned_to: staffId })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request assigned successfully",
        description: "The request has been assigned to the staff member",
      });

      fetchStaffWorkload(); // Refresh data
    } catch (error) {
      console.error('Error assigning request:', error);
      toast({
        title: "Error assigning request",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const autoBalance = async () => {
    try {
      // Simple auto-balance algorithm
      const availableStaff = staffMembers
        .filter(s => s.availability === 'available')
        .sort((a, b) => a.workload - b.workload);

      const urgentRequests = pendingRequests
        .filter(r => r.priority === 'urgent')
        .slice(0, availableStaff.length);

      for (let i = 0; i < urgentRequests.length && i < availableStaff.length; i++) {
        await assignRequest(urgentRequests[i].id, availableStaff[i].id);
      }

      toast({
        title: "Auto-balance completed",
        description: `Assigned ${Math.min(urgentRequests.length, availableStaff.length)} urgent requests`,
      });

    } catch (error) {
      console.error('Error during auto-balance:', error);
      toast({
        title: "Auto-balance failed",
        description: "Please try manual assignment",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Staff Workload Balancer</h3>
          <p className="text-sm text-muted-foreground">Optimize task distribution and staff efficiency</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoBalanceEnabled(!autoBalanceEnabled)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Auto-Balance: {autoBalanceEnabled ? 'ON' : 'OFF'}
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={autoBalance}
            disabled={pendingRequests.length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Balance Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Overview */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Staff Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {staffMembers.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-white text-sm">{staff.name}</div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          staff.availability === 'available' ? 'text-green-400 border-green-400' :
                          staff.availability === 'busy' ? 'text-yellow-400 border-yellow-400' :
                          'text-gray-400 border-gray-400'
                        }`}
                      >
                        {staff.availability}
                      </Badge>
                      <span>{staff.role}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-muted-foreground">Workload</div>
                  <div className="flex items-center space-x-2">
                    <Progress value={staff.workload} className="w-20 h-2" />
                    <span className="text-xs text-white min-w-[30px]">{staff.workload}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {staff.activeRequests} active • {staff.completedToday} today
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending Assignments ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-5 w-5 mr-2" />
                All requests are assigned!
              </div>
            ) : (
              pendingRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{request.title}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          request.priority === 'urgent' ? 'text-red-400 border-red-400' :
                          request.priority === 'high' ? 'text-orange-400 border-orange-400' :
                          request.priority === 'medium' ? 'text-yellow-400 border-yellow-400' :
                          'text-green-400 border-green-400'
                        }`}
                      >
                        {request.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{request.category}</span>
                      <span className="text-xs text-muted-foreground">~{request.estimatedTime}h</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Suggested: {request.suggestedStaff}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const suggestedStaff = staffMembers.find(s => s.name === request.suggestedStaff);
                      if (suggestedStaff) {
                        assignRequest(request.id, suggestedStaff.id);
                      }
                    }}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workload Distribution Chart */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">
                {staffMembers.filter(s => s.availability === 'available').length}
              </div>
              <div className="text-sm text-green-400">Available Staff</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-400">
                {staffMembers.filter(s => s.availability === 'busy').length}
              </div>
              <div className="text-sm text-yellow-400">Busy Staff</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(staffMembers.reduce((acc, s) => acc + s.workload, 0) / staffMembers.length) || 0}%
              </div>
              <div className="text-sm text-blue-400">Avg Workload</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffWorkloadBalancer;