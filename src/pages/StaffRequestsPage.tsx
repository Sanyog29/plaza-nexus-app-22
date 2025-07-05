import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Search, Filter, Clock, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  created_at: string;
  reported_by: string;
  assigned_to?: string;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

const StaffRequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, priorityFilter, activeTab]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          profiles:reported_by (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading requests",
        description: error.message,
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
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: newStatus,
          assigned_to: newStatus === 'in_progress' ? user?.id : null
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request updated",
        description: `Request status changed to ${newStatus.replace('_', ' ')}`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error updating request",
        description: error.message,
        variant: "destructive",
      });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Maintenance Requests</h1>
        <p className="text-gray-400">Manage and track maintenance requests</p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card/50 backdrop-blur mb-6">
        <CardContent className="p-6">
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
                            onClick={() => navigate(`/requests/${request.id}`)}
                          >
                            {request.title}
                          </h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{request.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>📍 {request.location}</span>
                          <span>
                            👤 {request.profiles?.first_name} {request.profiles?.last_name}
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
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'in_progress')}
                          className="bg-yellow-500 hover:bg-yellow-600"
                        >
                          Start Work
                        </Button>
                      )}
                      
                      {request.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'completed')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Mark Complete
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/requests/${request.id}`)}
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
    </div>
  );
};

export default StaffRequestsPage;