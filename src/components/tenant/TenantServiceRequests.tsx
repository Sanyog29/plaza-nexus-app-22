import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Wrench,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TenantServiceRequestsProps {
  tenantId: string;
}

const TenantServiceRequests: React.FC<TenantServiceRequestsProps> = ({ tenantId }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState('');
  const [priority, setPriority] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const queryClient = useQueryClient();

  // Get service requests
  const { data: serviceRequests, isLoading } = useQuery({
    queryKey: ['service-requests', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          assigned_staff:staff_assignments(
            staff:staff_members(name, role)
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Create service request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const { data, error } = await supabase
        .from('service_requests')
        .insert([{
          tenant_id: tenantId,
          request_type: requestData.type,
          title: requestData.title,
          description: requestData.description,
          priority: requestData.priority,
          location: requestData.location,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Service request created successfully!');
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create service request. Please try again.');
    }
  });

  const resetForm = () => {
    setRequestType('');
    setPriority('medium');
    setTitle('');
    setDescription('');
    setLocation('');
  };

  const handleCreateRequest = () => {
    if (!requestType || !title || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    createRequestMutation.mutate({
      type: requestType,
      title,
      description,
      priority,
      location
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700';
      case 'in_progress': return 'bg-blue-500/10 text-blue-700';
      case 'completed': return 'bg-green-500/10 text-green-700';
      case 'cancelled': return 'bg-red-500/10 text-red-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/10 text-green-700';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700';
      case 'high': return 'bg-orange-500/10 text-orange-700';
      case 'urgent': return 'bg-red-500/10 text-red-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const serviceTypes = [
    { value: 'hvac', label: 'HVAC & Climate Control' },
    { value: 'electrical', label: 'Electrical Issues' },
    { value: 'plumbing', label: 'Plumbing & Water' },
    { value: 'cleaning', label: 'Cleaning Services' },
    { value: 'security', label: 'Security & Access' },
    { value: 'it', label: 'IT & Technology' },
    { value: 'furniture', label: 'Furniture & Equipment' },
    { value: 'maintenance', label: 'General Maintenance' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Requests</h1>
          <p className="text-muted-foreground">
            Submit and track maintenance and service requests
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Service Request</DialogTitle>
              <DialogDescription>
                Describe the service or maintenance issue you need help with
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Service Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Room number, floor, etc."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the issue"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateRequest} disabled={createRequestMutation.isPending} className="flex-1">
                  {createRequestMutation.isPending ? 'Creating...' : 'Create Request'}
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Requests Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {serviceRequests?.filter(r => r.status === 'pending').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {serviceRequests?.filter(r => r.status === 'in_progress').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {serviceRequests?.filter(r => r.status === 'completed').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Track the status of your service requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : serviceRequests?.length ? (
            <div className="space-y-4">
              {serviceRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{request.title}</h4>
                        <Badge className={getPriorityColor(request.priority)} variant="outline">
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Type: {serviceTypes.find(t => t.value === request.request_type)?.label}</span>
                        {request.location && <span>Location: {request.location}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(request.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                      </Badge>
                      {request.assigned_staff && (
                        <p className="text-xs text-muted-foreground">
                          Assigned: {request.assigned_staff[0]?.staff?.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {request.status === 'completed' && (
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Completed on {format(new Date(request.updated_at), 'MMM dd, yyyy')}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Feedback
                          </Button>
                          <Button variant="outline" size="sm">
                            <Star className="h-3 w-3 mr-1" />
                            Rate
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No Service Requests</h3>
              <p className="text-muted-foreground mb-4">
                You haven't submitted any service requests yet.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantServiceRequests;