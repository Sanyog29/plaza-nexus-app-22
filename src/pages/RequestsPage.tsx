
import React, { useEffect, useState } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  reported_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  location: string;
  sla_breach_at: string | null;
  maintenance_categories?: {
    name: string;
    icon: string;
  };
}

const RequestsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    resolved: 0
  });

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          maintenance_categories (
            name,
            icon
          )
        `)
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
      
      // Calculate stats
      const activeCount = data?.filter(req => ['pending', 'in_progress'].includes(req.status)).length || 0;
      const pendingCount = data?.filter(req => req.status === 'pending').length || 0;
      const resolvedCount = data?.filter(req => req.status === 'completed').length || 0;
      
      setStats({
        active: activeCount,
        pending: pendingCount,
        resolved: resolvedCount
      });
    } catch (error: any) {
      toast("Error loading requests", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-plaza-blue bg-opacity-20 text-plaza-blue';
      case 'in_progress':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-500';
      case 'completed':
        return 'bg-green-500 bg-opacity-20 text-green-500';
      case 'cancelled':
        return 'bg-red-500 bg-opacity-20 text-red-500';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-600 text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plaza-blue"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Requests</h2>
          <p className="text-sm text-gray-400 mt-1">Track your service requests</p>
        </div>
        <Link to="/requests/new">
          <Button className="bg-plaza-blue hover:bg-blue-700">New Request</Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-plaza-blue/20 p-2 rounded-full">
              <Clock size={20} className="text-plaza-blue" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-lg font-semibold text-white">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-full">
              <AlertTriangle size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-lg font-semibold text-white">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-full">
              <CheckCircle size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Resolved</p>
              <p className="text-lg font-semibold text-white">{stats.resolved}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {requests.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-8 text-center">
            <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No requests yet</h3>
            <p className="text-gray-400 mb-4">You haven't submitted any maintenance requests yet.</p>
            <Link to="/requests/new">
              <Button className="bg-plaza-blue hover:bg-blue-700">Create Your First Request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Link key={request.id} to={`/requests/${request.id}`}>
              <Card className="bg-card hover:bg-card/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className="bg-plaza-blue bg-opacity-20 p-2 rounded-full mr-3 mt-1">
                        <MessageSquare size={18} className="text-plaza-blue" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{request.title}</h4>
                          {getPriorityBadge(request.priority)}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {request.maintenance_categories?.name || 'General'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{request.location}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500">
                            Created: {new Date(request.created_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Updated: {new Date(request.updated_at).toLocaleString()}
                          </p>
                          {request.assigned_to && (
                            <p className="text-xs text-gray-500">
                              Assigned to staff member
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusDisplayName(request.status)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
