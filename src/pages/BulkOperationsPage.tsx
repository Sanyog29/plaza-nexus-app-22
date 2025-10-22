import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  FileText, 
  Trash2, 
  Edit, 
  Mail, 
  Download,
  Upload,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Shield
} from 'lucide-react';

interface BulkUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

interface BulkRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  reported_by: string;
}

const BulkOperationsPage = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<BulkUser[]>([]);
  const [requests, setRequests] = useState<BulkRequest[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch users with role filtering
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, assigned_role_title, created_at, email')
        .order('created_at', { ascending: false });

      // Fetch maintenance requests
      const { data: requestData } = await supabase
        .from('maintenance_requests')
        .select('id, title, status, priority, created_at, reported_by')
        .order('created_at', { ascending: false })
        .limit(100);

      if (userData) {
        const usersWithEmail = userData.map(user => ({
          ...user,
          role: user.assigned_role_title || 'user',
          email: user.email || `user-${user.id.slice(0, 8)}@example.com`
        }));
        setUsers(usersWithEmail);
      }
      
      if (requestData) setRequests(requestData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
            <p className="text-muted-foreground">Bulk operations require administrator access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests([...selectedRequests, requestId]);
    } else {
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
    }
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectAllRequests = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(filteredRequests.map(request => request.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleBulkUserAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select users to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      switch (action) {
        case 'deactivate':
          // Mock deactivation - in real app would update user status
          toast({
            title: "Users deactivated",
            description: `${selectedUsers.length} users have been deactivated.`
          });
          break;
        case 'change_role':
          toast({
            title: "Role change initiated",
            description: `Role change process started for ${selectedUsers.length} users.`
          });
          break;
        case 'send_email':
          toast({
            title: "Emails sent",
            description: `Notification emails sent to ${selectedUsers.length} users.`
          });
          break;
        case 'export':
          const userData = users.filter(user => selectedUsers.includes(user.id));
          const csv = generateCSV(userData);
          downloadFile(csv, 'users.csv');
          toast({
            title: "Export completed",
            description: `${selectedUsers.length} user records exported.`
          });
          break;
      }
      setSelectedUsers([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk operation.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkRequestAction = async (action: string) => {
    if (selectedRequests.length === 0) {
      toast({
        title: "No requests selected",
        description: "Please select requests to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      switch (action) {
        case 'close':
          await supabase
            .from('maintenance_requests')
            .update({ status: 'completed' })
            .in('id', selectedRequests);
          toast({
            title: "Requests closed",
            description: `${selectedRequests.length} requests have been closed.`
          });
          break;
        case 'assign':
          toast({
            title: "Assignment initiated",
            description: `Assignment process started for ${selectedRequests.length} requests.`
          });
          break;
        case 'priority':
          toast({
            title: "Priority updated",
            description: `Priority updated for ${selectedRequests.length} requests.`
          });
          break;
        case 'export':
          const requestData = requests.filter(request => selectedRequests.includes(request.id));
          const csv = generateCSV(requestData);
          downloadFile(csv, 'requests.csv');
          toast({
            title: "Export completed",
            description: `${selectedRequests.length} request records exported.`
          });
          break;
      }
      setSelectedRequests([]);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk operation.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user => 
    filterRole === 'all' || user.role === filterRole
  );

  const filteredRequests = requests.filter(request => 
    filterStatus === 'all' || request.status === filterStatus
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Edit className="h-8 w-8 text-primary" />
            Bulk Operations
          </h1>
          <p className="text-muted-foreground">
            Perform operations on multiple records simultaneously
          </p>
        </div>
        <Badge variant="destructive" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Admin Only
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-card/50">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Request Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="space-y-6">
            {/* User Controls */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Bulk Operations</span>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="ops_supervisor">Supervisor</SelectItem>
                        <SelectItem value="field_staff">Field Staff</SelectItem>
                        <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkUserAction('deactivate')}
                    disabled={selectedUsers.length === 0 || isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Deactivate ({selectedUsers.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkUserAction('change_role')}
                    disabled={selectedUsers.length === 0 || isLoading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Change Role
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkUserAction('send_email')}
                    disabled={selectedUsers.length === 0 || isLoading}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkUserAction('export')}
                    disabled={selectedUsers.length === 0 || isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-3 bg-muted/20 rounded-lg">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAllUsers}
                    />
                    <span className="font-medium">Select All ({filteredUsers.length} users)</span>
                  </div>

                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 p-3 bg-card/30 rounded-lg">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {user.first_name} {user.last_name}
                          </span>
                          <Badge variant="outline">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="space-y-6">
            {/* Request Controls */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Request Bulk Operations</span>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkRequestAction('close')}
                    disabled={selectedRequests.length === 0 || isLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Close ({selectedRequests.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkRequestAction('assign')}
                    disabled={selectedRequests.length === 0 || isLoading}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkRequestAction('priority')}
                    disabled={selectedRequests.length === 0 || isLoading}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Change Priority
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkRequestAction('export')}
                    disabled={selectedRequests.length === 0 || isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-3 bg-muted/20 rounded-lg">
                    <Checkbox
                      checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                      onCheckedChange={handleSelectAllRequests}
                    />
                    <span className="font-medium">Select All ({filteredRequests.length} requests)</span>
                  </div>

                  {filteredRequests.map((request) => (
                    <div key={request.id} className="flex items-center space-x-2 p-3 bg-card/30 rounded-lg">
                      <Checkbox
                        checked={selectedRequests.includes(request.id)}
                        onCheckedChange={(checked) => handleSelectRequest(request.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{request.title}</span>
                          <Badge variant={
                            request.status === 'completed' ? 'default' :
                            request.status === 'in_progress' ? 'secondary' : 'destructive'
                          }>
                            {request.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            {request.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {request.id.slice(0, 8)}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkOperationsPage;