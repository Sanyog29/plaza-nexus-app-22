import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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
}

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
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
          reporter:profiles!reported_by (
            first_name,
            last_name
          )
        `)
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Request Management</h1>
          <p className="text-gray-400">Monitor and manage all maintenance requests</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{pending.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-400">{inProgress.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">{completed.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-red-400">{overdue.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
          <RequestsList requests={filteredRequests} navigate={navigate} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} isOverdue={isOverdue} />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          <RequestsList requests={pending} navigate={navigate} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} isOverdue={isOverdue} />
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-4">
          <RequestsList requests={overdue} navigate={navigate} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} isOverdue={isOverdue} />
        </TabsContent>
        
        <TabsContent value="in_progress" className="mt-4">
          <RequestsList requests={inProgress} navigate={navigate} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} isOverdue={isOverdue} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface RequestsListProps {
  requests: MaintenanceRequest[];
  navigate: (path: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  isOverdue: (slaBreachAt: string | undefined) => boolean;
}

const RequestsList: React.FC<RequestsListProps> = ({ 
  requests, 
  navigate, 
  getStatusIcon, 
  getStatusColor, 
  getPriorityColor, 
  isOverdue 
}) => {
  if (requests.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No requests found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="bg-card/50 backdrop-blur hover:bg-card/70 transition-colors cursor-pointer">
          <CardContent className="p-4" onClick={() => navigate(`/requests/${request.id}`)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white">{request.title}</h3>
                  {isOverdue(request.sla_breach_at) && (
                    <Badge className="bg-red-900 text-red-300">OVERDUE</Badge>
                  )}
                </div>
                
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{request.description}</p>
                
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
                  <span>
                    Reported by: {request.reporter?.first_name} {request.reporter?.last_name}
                  </span>
                  <span>{format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminRequestsPage;