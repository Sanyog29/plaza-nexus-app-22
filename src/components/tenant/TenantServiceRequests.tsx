import React, { useState } from 'react';
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
  Calendar,
  Construction
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

  // Mock service requests data
  const mockServiceRequests = [
    {
      id: '1',
      request_type: 'hvac',
      title: 'Air conditioning not working',
      description: 'The AC unit in our office is not cooling properly',
      priority: 'high',
      location: 'Floor 3, Room 301',
      status: 'in_progress',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      assigned_staff: [{ staff: { name: 'John Doe', role: 'Maintenance' } }]
    },
    {
      id: '2',
      request_type: 'cleaning',
      title: 'Regular office cleaning',
      description: 'Weekly deep cleaning of office space',
      priority: 'medium',
      location: 'Floor 3, Room 301-305',
      status: 'completed',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      assigned_staff: [{ staff: { name: 'Jane Smith', role: 'Cleaning' } }]
    }
  ];

  // Create service request (mock implementation)
  const handleCreateRequest = () => {
    if (!requestType || !title || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success('Service request submitted! This feature will be fully integrated soon.');
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setRequestType('');
    setPriority('medium');
    setTitle('');
    setDescription('');
    setLocation('');
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
                <Button onClick={handleCreateRequest} className="flex-1">
                  Submit Request
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
                  {mockServiceRequests?.filter(r => r.status === 'pending').length || 0}
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
                  {mockServiceRequests?.filter(r => r.status === 'in_progress').length || 0}
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
                  {mockServiceRequests?.filter(r => r.status === 'completed').length || 0}
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
          {mockServiceRequests?.length ? (
            <div className="space-y-4">
              {mockServiceRequests.map((request) => (
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
              <Construction className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Service Request System</h3>
              <p className="text-muted-foreground mb-4">
                Service request functionality is under development. 
                This will integrate with the building's maintenance management system.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Test Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantServiceRequests;