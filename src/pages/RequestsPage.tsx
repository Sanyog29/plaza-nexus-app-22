import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertTriangle, Timer, Trash2, Star } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { formatUserNameFromProfile } from '@/utils/formatters';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'assigned' | 'en_route';
  reported_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  location: string;
  sla_breach_at: string | null;
  main_categories?: {
    name: string;
    icon: string;
  };
  reporter?: {
    first_name?: string;
    last_name?: string;
  };
  assignee?: {
    first_name?: string;
    last_name?: string;
  };
}

const RequestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    resolved: 0
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; request: MaintenanceRequest | null; loading: boolean }>({
    open: false,
    request: null,
    loading: false
  });
  const [requestsWithFeedback, setRequestsWithFeedback] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
    
    // Set initial filter from URL
    const urlStatus = searchParams.get('status');
    if (urlStatus && ['completed', 'in_progress', 'pending', 'all'].includes(urlStatus)) {
      setStatusFilter(urlStatus);
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests',
          filter: `reported_by=eq.${user?.id}`
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          main_categories!maintenance_requests_category_id_fkey (
            name,
            icon
          ),
          reporter:profiles!maintenance_requests_reported_by_fkey(first_name, last_name),
          assignee:profiles!maintenance_requests_assigned_to_fkey(first_name, last_name)
        `)
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to handle the array structure from Supabase
      const processedData = (data || []).map(request => {
        const categoryArray = request.main_categories as any;
        return {
          ...request,
          main_categories: Array.isArray(categoryArray) && categoryArray.length > 0 
            ? categoryArray[0]
            : categoryArray || undefined
        };
      });

      setRequests(processedData);
      
      // Calculate stats
      const activeCount = processedData?.filter(req => ['pending', 'in_progress'].includes(req.status)).length || 0;
      const pendingCount = processedData?.filter(req => req.status === 'pending').length || 0;
      const resolvedCount = processedData?.filter(req => req.status === 'completed').length || 0;
      
      setStats({
        active: activeCount,
        pending: pendingCount,
        resolved: resolvedCount
      });

      // Check which completed requests have feedback
      const completedRequests = processedData?.filter(req => req.status === 'completed') || [];
      if (completedRequests.length > 0) {
        const { data: feedbackData } = await supabase
          .from('maintenance_request_feedback')
          .select('request_id')
          .eq('user_id', user.id)
          .in('request_id', completedRequests.map(req => req.id));
        
        setRequestsWithFeedback(new Set(feedbackData?.map(f => f.request_id) || []));
      }
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

  const handleDeleteRequest = async () => {
    if (!deleteDialog.request || !user) return;
    
    setDeleteDialog(prev => ({ ...prev, loading: true }));
    
    try {
      // Delete attachments and comments first
      await supabase
        .from('request_attachments')
        .delete()
        .eq('request_id', deleteDialog.request.id);

      await supabase
        .from('request_comments')
        .delete()
        .eq('request_id', deleteDialog.request.id);

      // Delete the request
      const { error } = await supabase
        .from('maintenance_requests')
        .delete()
        .eq('id', deleteDialog.request.id);

      if (error) throw error;

      toast("Request deleted successfully");
      setDeleteDialog({ open: false, request: null, loading: false });
      await fetchRequests(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting request:', error);
      toast("Failed to delete request", {
        description: error.message,
      });
      setDeleteDialog(prev => ({ ...prev, loading: false }));
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

      {/* Filter indicator */}
      {statusFilter !== 'all' && (
        <Card className="bg-card/50 backdrop-blur mb-4">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Filtered by:</span>
              <Badge variant="outline" className="text-sm">
                Status: {statusFilter.replace('_', ' ')}
                <button 
                  onClick={() => setStatusFilter('all')}
                  className="ml-2 hover:text-red-400"
                >
                  ×
                </button>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
          {requests.filter(req => statusFilter === 'all' || req.status === statusFilter).map((request) => (
            <Card key={request.id} className="bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start flex-1">
                    <div className="bg-plaza-blue bg-opacity-20 p-2 rounded-full mr-3 mt-1">
                      <MessageSquare size={18} className="text-plaza-blue" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{request.title}</h4>
                        {getPriorityBadge(request.priority)}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {request.main_categories?.name || 'General'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{request.location}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                          Created: {new Date(request.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Updated: {new Date(request.updated_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Reported by: You
                        </p>
                        {request.assignee && (
                          <p className="text-xs text-gray-500">
                            Assigned to: {formatUserNameFromProfile(request.assignee)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusDisplayName(request.status)}
                    </span>
                    
                    {/* Feedback prompt for completed requests */}
                    {request.status === 'completed' && !requestsWithFeedback.has(request.id) && (
                      <Button variant="outline" size="sm" className="border-green-400/30 text-green-400 hover:bg-green-400/10">
                        <Star className="h-3 w-3 mr-1" />
                        Rate
                      </Button>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Link to={`/requests/${request.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      
                      {request.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteDialog({ open: true, request, loading: false });
                          }}
                          className="text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        title="Delete Request"
        description="This action cannot be undone. This will permanently delete the request and all associated data."
        itemName={deleteDialog.request?.title}
        deleteText="Delete Request"
        onConfirm={handleDeleteRequest}
        loading={deleteDialog.loading}
        destructive={true}
      />
    </div>
  );
};

export default RequestsPage;
