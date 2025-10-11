import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Clock, AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { BroadcastTaskButton } from '@/components/admin/BroadcastTaskButton';
import { formatUserNameFromProfile } from '@/utils/formatters';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location: string;
  created_at: string;
  reported_by: string;
  assigned_to?: string;
  sla_breach_at?: string;
  reporter?: {
    first_name?: string;
    last_name?: string;
  };
  assignee?: {
    first_name?: string;
    last_name?: string;
  };
}

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<MaintenanceRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchRequests();
    
    // Set initial filter from URL
    const urlStatus = searchParams.get('status');
    if (urlStatus && ['completed', 'in_progress', 'pending'].includes(urlStatus)) {
      setStatusFilter(urlStatus);
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          reporter:profiles!maintenance_requests_reported_by_fkey(first_name, last_name),
          assignee:profiles!maintenance_requests_assigned_to_fkey(first_name, last_name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900 text-yellow-300';
      case 'in_progress': return 'bg-blue-900 text-blue-300';
      case 'completed': return 'bg-green-900 text-green-300';
      case 'cancelled': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-900 text-red-300';
      case 'high': return 'bg-orange-900 text-orange-300';
      case 'medium': return 'bg-yellow-900 text-yellow-300';
      case 'low': return 'bg-green-900 text-green-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const isOverdue = (slaBreachAt: string | undefined) => {
    if (!slaBreachAt) return false;
    return new Date(slaBreachAt) < new Date();
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;

    setIsDeleting(true);
    try {
      // Check if request can be deleted (only pending requests)
      if (requestToDelete.status !== 'pending') {
        toast({
          title: "Cannot delete request",
          description: "Only pending requests can be deleted",
          variant: "destructive",
        });
        return;
      }

      // Delete attachments first
      await supabase
        .from('request_attachments')
        .delete()
        .eq('request_id', requestToDelete.id);

      // Delete comments
      await supabase
        .from('request_comments')
        .delete()
        .eq('request_id', requestToDelete.id);

      // Delete the request
      const { error } = await supabase
        .from('maintenance_requests')
        .delete()
        .eq('id', requestToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request deleted successfully",
      });

      // Refresh the requests list
      await fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    }
  };

  const openDeleteDialog = (request: MaintenanceRequest) => {
    setRequestToDelete(request);
    setDeleteDialogOpen(true);
  };

  const categorizeRequests = () => {
    const pending = filteredRequests.filter(r => r.status === 'pending');
    const inProgress = filteredRequests.filter(r => r.status === 'in_progress');
    const completed = filteredRequests.filter(r => r.status === 'completed');
    const overdue = filteredRequests.filter(r => isOverdue(r.sla_breach_at));
    
    return { pending, inProgress, completed, overdue };
  };

  const { pending, inProgress, completed, overdue } = categorizeRequests();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Request Management"
        description="Monitor and manage all maintenance requests."
        url={`${window.location.origin}/admin/requests`}
        type="website"
        noindex
      />
      <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Request Management</h1>
          <p className="text-foreground">Monitor and manage all maintenance requests</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{pending.length}</p>
              </div>
              <Clock className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">In Progress</p>
                <p className="text-2xl font-bold text-foreground">{inProgress.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{completed.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Overdue</p>
                <p className="text-2xl font-bold text-foreground">{overdue.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          {/* Filter indicator */}
          {(statusFilter !== 'all' || priorityFilter !== 'all') && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-foreground">Filtered by:</span>
              {statusFilter !== 'all' && (
                <Badge variant="outline" className="text-sm">
                  Status: {statusFilter.replace('_', ' ')}
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className="ml-2 hover:opacity-80"
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
                    className="ml-2 hover:opacity-80"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground w-4 h-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({filteredRequests.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgress.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <RequestsList requests={filteredRequests} navigate={navigate} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} isOverdue={isOverdue} onDeleteRequest={openDeleteDialog} />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          <RequestsList requests={pending} navigate={navigate} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} isOverdue={isOverdue} onDeleteRequest={openDeleteDialog} />
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-4">
          <RequestsList requests={overdue} navigate={navigate} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} isOverdue={isOverdue} onDeleteRequest={openDeleteDialog} />
        </TabsContent>
        
        <TabsContent value="in_progress" className="mt-4">
          <RequestsList requests={inProgress} navigate={navigate} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} isOverdue={isOverdue} onDeleteRequest={openDeleteDialog} />
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Request"
        description={`Are you sure you want to delete "${requestToDelete?.title}"? This action cannot be undone and will also delete all associated attachments and comments.`}
        itemName={requestToDelete?.title}
        onConfirm={handleDeleteRequest}
        loading={isDeleting}
      />
    </div>
  </>
  );
};

interface RequestsListProps {
  requests: MaintenanceRequest[];
  navigate: (path: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  isOverdue: (slaBreachAt: string | undefined) => boolean;
  onDeleteRequest: (request: MaintenanceRequest) => void;
}

const RequestsList: React.FC<RequestsListProps> = ({ 
  requests, 
  navigate, 
  getStatusIcon, 
  getStatusColor, 
  getPriorityColor, 
  isOverdue,
  onDeleteRequest 
}) => {
  if (requests.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-8 text-center">
          <p className="text-foreground">No requests found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="bg-card/50 backdrop-blur hover:bg-card/70 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => navigate(`/admin/requests/${request.id}`)}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">{request.title}</h3>
                  {isOverdue(request.sla_breach_at) && (
                    <Badge className="bg-red-900 text-red-300">OVERDUE</Badge>
                  )}
                </div>
                
                <p className="text-foreground text-sm mb-3 line-clamp-2">{request.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  
                  <Badge className={`${getPriorityColor(request.priority)}`}>
                    {request.priority.toUpperCase()}
                  </Badge>
                  
                  <Badge variant="outline" className="text-gray-300">
                    📍 {request.location}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="space-y-1">
                    <div>Reported by: {formatUserNameFromProfile(request.reporter)}</div>
                    {request.assignee && (
                      <div>Assigned to: {formatUserNameFromProfile(request.assignee)}</div>
                    )}
                  </div>
                  <span>{format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                {/* Broadcast Button - Show for pending/open requests without assignment */}
                {(request.status === 'pending' || request.status === 'open') && !request.assigned_to && (
                  <BroadcastTaskButton
                    requestId={request.id}
                    requestTitle={request.title}
                    isAssigned={!!request.assigned_to}
                  />
                )}
                
                {request.status === 'pending' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRequest(request);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminRequestsPage;