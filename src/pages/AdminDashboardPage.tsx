import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ServerCog, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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

const AdminDashboardPage = () => {
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
  const navigate = useNavigate();

  useEffect(() => {
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

    checkAdminStatus();
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/admin/content')}
          >
            <ServerCog size={16} />
            Manage Content
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/admin/users')}
          >
            <Users size={16} />
            Manage Users
          </Button>
        </div>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-white">{dashboardStats.totalRequests}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                📋
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{dashboardStats.pendingRequests}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                ⏱️
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Alerts</p>
                <p className="text-2xl font-bold text-red-400">{dashboardStats.activeAlerts}</p>
              </div>
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                🚨
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">SLA Compliance</p>
                <p className="text-2xl font-bold text-green-400">{dashboardStats.slaCompliance}%</p>
              </div>
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                ✅
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-400">Total Users</p>
            <p className="text-xl font-bold text-white">{dashboardStats.totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-400">Staff Members</p>
            <p className="text-xl font-bold text-white">{dashboardStats.staffCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-400">Equipment Items</p>
            <p className="text-xl font-bold text-white">{dashboardStats.equipmentCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Requests</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/requests')}>
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No recent requests</p>
            ) : (
              recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => navigate(`/requests/${request.id}`)}>
                  <div>
                    <h4 className="font-medium text-white">{request.title}</h4>
                    <p className="text-sm text-gray-400">
                      By {request.reporter?.first_name} {request.reporter?.last_name} • {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.priority === 'urgent' ? 'bg-red-900 text-red-300' :
                      request.priority === 'high' ? 'bg-orange-900 text-orange-300' :
                      request.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {request.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'completed' ? 'bg-green-900 text-green-300' :
                      request.status === 'in_progress' ? 'bg-blue-900 text-blue-300' :
                      request.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-gray-900 text-gray-300'
                    }`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate('/admin/content')}
              className="h-20 flex flex-col bg-plaza-blue/10 hover:bg-plaza-blue/20 border border-plaza-blue/30"
            >
              <ServerCog className="h-6 w-6 text-plaza-blue mb-2" />
              <span className="text-sm">Manage Content</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/admin/requests')}
              className="h-20 flex flex-col bg-green-500/10 hover:bg-green-500/20 border border-green-500/30"
            >
              <span className="text-2xl mb-1">📋</span>
              <span className="text-sm">View Requests</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/admin/users')}
              className="h-20 flex flex-col bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30"
            >
              <Users className="h-6 w-6 text-purple-400 mb-2" />
              <span className="text-sm">Manage Users</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/admin/analytics')}
              className="h-20 flex flex-col bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30"
            >
              <span className="text-2xl mb-1">📊</span>
              <span className="text-sm">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
