import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Search, Filter, Clock, AlertTriangle, CheckCircle, Wrench, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRealtimeRequests } from '@/hooks/useRealtimeUpdates';
import { TaskCompletionNotifier } from '@/components/realtime/TaskCompletionNotifier';
import { LoadingState } from '@/components/ui/loading-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { handleSupabaseError } from '@/utils/errorHandler';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'assigned' | 'en_route';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  created_at: string;
  reported_by: string;
  assigned_to?: string;
  [key: string]: any; // Allow additional Supabase fields
}

const StaffRequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    loading: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    loading: false
  });

  // Enable real-time updates
  useRealtimeRequests();

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription for better UX feedback
    const channel = supabase
      .channel('staff-requests-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'maintenance_requests'
      }, (payload) => {
        // Refetch data when requests change
        console.log('Request update received:', payload);
        fetchRequests();
      })
      .subscribe();
    
    // Set initial filter from URL
    const urlStatus = searchParams.get('status');
    if (urlStatus && ['completed', 'in_progress', 'pending'].includes(urlStatus)) {
      setStatusFilter(urlStatus);
      setActiveTab(urlStatus === 'completed' ? 'done' : urlStatus === 'in_progress' ? 'in_progress' : 'pending');
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, priorityFilter, activeTab]);

  const fetchRequests = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          reporter:profiles!reported_by (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to handle join results
      const transformedData = (data || []).map(req => ({
        ...req,
        reporterName: req.reporter?.first_name && req.reporter?.last_name 
          ? `${req.reporter.first_name} ${req.reporter.last_name}`
          : 'Unknown User'
      }));
      
      setRequests(transformedData);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      const errorMessage = handleSupabaseError(error);
      setError(new Error(errorMessage));
      toast({
        title: "Error loading requests",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(req => req.status === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(req => req.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    const request = requests.find(r => r.id === requestId);
    const actionText = newStatus === 'completed' ? 'mark as completed' : 'update status';
    
    const openDialog = () => {
      setConfirmDialog({
        open: true,
        title: newStatus === 'completed' ? 'Complete Request' : 'Update Status',
        description: `Are you sure you want to ${actionText} "${request?.title}"?`,
        onConfirm: () => executeStatusUpdate(requestId, newStatus),
        loading: false
      });
    };

    const executeStatusUpdate = async (requestId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
      setConfirmDialog(prev => ({ ...prev, loading: true }));
      setUpdatingRequestId(requestId);
      
      try {
        const { error } = await supabase
          .from('maintenance_requests')
          .update({ 
            status: newStatus,
            assigned_to: newStatus === 'in_progress' ? user?.id : null
          })
          .eq('id', requestId);

        if (error) {
          // Handle duplicate key conflicts gracefully
          if (error.code === '23505' || error.message?.includes('duplicate key')) {
            console.warn('Status already updated by another user:', error);
            toast({
              title: "Already Updated",
              description: "This request was already updated by another user",
            });
            fetchRequests();
            return;
          }
          throw error;
        }

        // Create notification for the reporter
        if (request?.reported_by) {
          try {
            await supabase.rpc('create_notification', {
              target_user_id: request.reported_by,
              notification_title: 'Request Status Updated',
              notification_message: `Your request "${request.title}" is now ${newStatus.replace('_', ' ')}`,
              notification_type: newStatus === 'completed' ? 'success' : 'info',
              action_url: `/requests/${requestId}`
            });
          } catch (err) {
            console.warn('Error creating notification:', err);
          }
        }

        toast({
          title: "Request updated successfully",
          description: `Request status changed to ${newStatus.replace('_', ' ')}`,
        });

        setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
        fetchRequests();
      } catch (error: any) {
        console.error('Error updating request:', error);
        const errorMessage = handleSupabaseError(error);
        toast({
          title: "Error updating request",
          description: errorMessage,
          variant: "destructive",
        });
        setConfirmDialog(prev => ({ ...prev, loading: false }));
      } finally {
        setUpdatingRequestId(null);
      }
    };

    openDialog();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in_progress': return <Wrench className="h-4 w-4 text-yellow-400" />;
      case 'pending': return <Clock className="h-4 w-4 text-red-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRequestCount = (status: string) => {
    if (status === 'all') return requests.length;
    return requests.filter(req => req.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Maintenance Requests</h1>
          <p className="text-gray-400">Manage and track maintenance requests</p>
        </div>
        <LoadingState type="card" count={5} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      {/* Real-time Task Completion Notifier */}
      <TaskCompletionNotifier />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Maintenance Requests</h1>
        <p className="text-gray-400">Manage and track maintenance requests</p>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-900/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load requests: {error.message}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
              disabled={isLoading}
              className="ml-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="bg-card/50 backdrop-blur mb-6">
        <CardContent className="p-6">
          {/* Filter indicator */}
          {(statusFilter !== 'all' || priorityFilter !== 'all') && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-400">Filtered by:</span>
              {statusFilter !== 'all' && (
                <Badge variant="outline" className="text-sm">
                  Status: {statusFilter.replace('_', ' ')}
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className="ml-2 hover:text-red-400"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {priorityFilter !== 'all' && (
                <Badge variant="outline" className="text-sm">
                  Priority: {priorityFilter}
                  <button 
                    onClick={() => setPriorityFilter('all')}
                    className="ml-2 hover:text-red-400"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({getRequestCount('all')})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({getRequestCount('pending')})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Active ({getRequestCount('in_progress')})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Done ({getRequestCount('completed')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredRequests.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No requests found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="bg-card/50 backdrop-blur hover:bg-card/70 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(request.status)}
                          <h3 
                            className="font-semibold text-white cursor-pointer hover:text-plaza-blue"
                             onClick={() => navigate(`/staff/requests/${request.id}`)}
                          >
                            {request.title}
                          </h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{request.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>📍 {request.location}</span>
                          <span>
                            👤 {request.reporterName || 'Unknown User'}
                          </span>
                          <span>🕒 {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {request.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'completed')}
                          disabled={updatingRequestId === request.id}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {updatingRequestId === request.id ? 'Completing...' : 'Mark Complete'}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/staff/requests/${request.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        loading={confirmDialog.loading}
      />
    </div>
  );
};

export default StaffRequestsPage;