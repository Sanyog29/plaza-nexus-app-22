import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Wrench,
  Shield
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

const StaffDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requestStats, setRequestStats] = useState<RequestStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch maintenance requests statistics
      const { data: requests, error: requestsError } = await supabase
        .from('maintenance_requests')
        .select('status, created_at, title, priority, id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (requestsError) throw requestsError;

      // Calculate stats
      const stats = requests?.reduce((acc, req) => {
        acc.total++;
        if (req.status === 'pending') acc.pending++;
        else if (req.status === 'in_progress') acc.inProgress++;
        else if (req.status === 'completed') acc.completed++;
        return acc;
      }, { total: 0, pending: 0, inProgress: 0, completed: 0 }) || {
        total: 0, pending: 0, inProgress: 0, completed: 0
      };

      setRequestStats(stats);
      setRecentRequests(requests?.slice(0, 5) || []);
    } catch (error: any) {
      toast({
        title: "Error loading dashboard data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'pending': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Staff Dashboard</h1>
        <p className="text-gray-400">Monitor and manage facility operations</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-white">{requestStats.total}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-plaza-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-red-400">{requestStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400">{requestStats.inProgress}</p>
              </div>
              <Wrench className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">{requestStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card/50 backdrop-blur mb-8">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate('/staff/requests')}
              className="h-20 flex flex-col bg-plaza-blue/10 hover:bg-plaza-blue/20 border border-plaza-blue/30"
            >
              <ClipboardList className="h-6 w-6 text-plaza-blue mb-2" />
              <span className="text-sm">View Requests</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/staff/alerts')}
              className="h-20 flex flex-col bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
            >
              <AlertTriangle className="h-6 w-6 text-red-400 mb-2" />
              <span className="text-sm">Active Alerts</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/staff/reports')}
              className="h-20 flex flex-col bg-green-500/10 hover:bg-green-500/20 border border-green-500/30"
            >
              <TrendingUp className="h-6 w-6 text-green-400 mb-2" />
              <span className="text-sm">View Reports</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/profile')}
              className="h-20 flex flex-col bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30"
            >
              <Users className="h-6 w-6 text-purple-400 mb-2" />
              <span className="text-sm">My Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Recent Requests</CardTitle>
          <CardDescription>Latest maintenance requests in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recent requests found</p>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer"
                  onClick={() => navigate(`/requests/${request.id}`)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">{request.title}</h4>
                    <p className="text-sm text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                    <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffDashboardPage;