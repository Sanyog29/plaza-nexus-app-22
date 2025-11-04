import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const statsQuery = useQuery({
    queryKey: ['manager-stats', user?.id],
    queryFn: async () => {
      const [pending, approved, rejected, urgent] = await Promise.all([
        supabase
          .from('requisition_lists')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending_manager_approval'),
        supabase
          .from('requisition_lists')
          .select('id', { count: 'exact', head: true })
          .eq('manager_id', user?.id!)
          .eq('status', 'manager_approved'),
        supabase
          .from('requisition_lists')
          .select('id', { count: 'exact', head: true })
          .eq('manager_id', user?.id!)
          .eq('status', 'manager_rejected'),
        supabase
          .from('requisition_lists')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending_manager_approval')
          .eq('priority', 'urgent'),
      ]);

      return {
        pending: pending.count || 0,
        approved: approved.count || 0,
        rejected: rejected.count || 0,
        urgent: urgent.count || 0,
      };
    },
    enabled: !!user,
  });

  const recentQuery = useQuery({
    queryKey: ['recent-requisitions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_lists')
        .select('id, order_number, status, priority, created_at, created_by_name, total_items')
        .or('status.eq.pending_manager_approval,manager_id.eq.' + user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const stats = statsQuery.data;
  const recent = recentQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">Review and approve requisitions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.urgent || 0}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">Sent to procurement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rejected || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/procurement/pending-approvals')}
            >
              <Package className="mr-2 h-4 w-4" />
              Review Pending Approvals ({stats?.pending || 0})
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/procurement/approval-history')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View Approval History
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent?.map((req) => (
                <div 
                  key={req.id} 
                  className="flex items-center justify-between cursor-pointer hover:bg-accent p-2 rounded"
                  onClick={() => navigate(`/procurement/requisitions/${req.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{req.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.created_by_name} • {req.total_items} items
                    </p>
                  </div>
                  <div className="text-xs">{req.status}</div>
                </div>
              ))}
              {!recent?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
