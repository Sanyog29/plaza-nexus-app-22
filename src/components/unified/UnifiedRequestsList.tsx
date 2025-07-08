import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, User, AlertCircle, Search, Filter, Plus, Trash2, XCircle } from 'lucide-react';
import { useUnifiedRequests, UnifiedRequest } from '@/hooks/useUnifiedRequests';
import { useSLAMonitoring } from '@/hooks/useSLAMonitoring';
import { useAuth } from '@/components/AuthProvider';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

interface UnifiedRequestsListProps {
  onCreateRequest?: () => void;
  onViewRequest?: (request: UnifiedRequest) => void;
}

export const UnifiedRequestsList: React.FC<UnifiedRequestsListProps> = ({
  onCreateRequest,
  onViewRequest,
}) => {
  const { isStaff, permissions, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; request: UnifiedRequest | null; loading: boolean }>({
    open: false,
    request: null,
    loading: false
  });
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; request: UnifiedRequest | null; loading: boolean }>({
    open: false,
    request: null,
    loading: false
  });
  
  const { requests, isLoading, assignRequest, completeRequest, deleteRequest, cancelRequest } = useUnifiedRequests({
    status: statusFilter !== 'all' ? [statusFilter as any] : undefined,
    priority: priorityFilter !== 'all' ? [priorityFilter as any] : undefined,
  });
  
  const { getSLAStatusColor, formatTimeRemaining } = useSLAMonitoring();

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'destructive',
      high: 'secondary',
      medium: 'outline',
      low: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'outline',
      in_progress: 'secondary',
      completed: 'default',
      cancelled: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getSLAIndicator = (request: UnifiedRequest) => {
    if (!request.sla_breach_at) return null;
    
    const color = getSLAStatusColor(request);
    const timeInfo = formatTimeRemaining(request.sla_breach_at);
    
    return (
      <div className={`flex items-center gap-1 text-xs ${
        color === 'red' ? 'text-red-400' : 
        color === 'orange' ? 'text-orange-400' : 
        color === 'yellow' ? 'text-yellow-400' : 
        'text-green-400'
      }`}>
        <Clock className="h-3 w-3" />
        {timeInfo}
      </div>
    );
  };

  const handleDeleteRequest = async () => {
    if (!deleteDialog.request) return;
    
    setDeleteDialog(prev => ({ ...prev, loading: true }));
    const success = await deleteRequest(deleteDialog.request.id);
    
    if (success) {
      setDeleteDialog({ open: false, request: null, loading: false });
    } else {
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelDialog.request) return;
    
    setCancelDialog(prev => ({ ...prev, loading: true }));
    const success = await cancelRequest(cancelDialog.request.id);
    
    if (success) {
      setCancelDialog({ open: false, request: null, loading: false });
    } else {
      setCancelDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const canDelete = (request: UnifiedRequest): boolean => {
    if (request.status !== 'pending') return false;
    return isStaff || request.reported_by === user?.id;
  };

  const canCancel = (request: UnifiedRequest): boolean => {
    if (request.status === 'completed' || request.status === 'cancelled') return false;
    return isStaff || request.reported_by === user?.id;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Service Requests</h2>
          <p className="text-sm text-muted-foreground">
            Unified request management system
          </p>
        </div>
        
        {onCreateRequest && (
          <Button onClick={onCreateRequest} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-input border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] bg-input border-border">
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

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-white font-medium">No requests found</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first request to get started'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="bg-card/50 backdrop-blur hover:bg-card/70 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{request.title}</h3>
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {request.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {request.location}
                      </div>
                      
                      {request.reported_by_profile && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {request.reported_by_profile.first_name} {request.reported_by_profile.last_name}
                        </div>
                      )}
                      
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      
                      {getSLAIndicator(request)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {onViewRequest && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewRequest(request)}
                      >
                        View
                      </Button>
                    )}
                    
                    {isStaff && request.status === 'pending' && permissions?.can_assign_requests && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => assignRequest(request.id, 'auto')}
                      >
                        Assign
                      </Button>
                    )}
                    
                    {isStaff && request.status === 'in_progress' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => completeRequest(request.id)}
                      >
                        Complete
                      </Button>
                    )}

                    {canCancel(request) && request.status !== 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelDialog({ open: true, request, loading: false })}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                    
                    {canDelete(request) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, request, loading: false })}
                        className="text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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

      {/* Cancel Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog(prev => ({ ...prev, open }))}
        title="Cancel Request"
        description="This will mark the request as cancelled. The request will remain in the system for audit purposes but no further work will be done."
        itemName={cancelDialog.request?.title}
        deleteText="Cancel Request"
        onConfirm={handleCancelRequest}
        loading={cancelDialog.loading}
        destructive={false}
      />
    </div>
  );
};