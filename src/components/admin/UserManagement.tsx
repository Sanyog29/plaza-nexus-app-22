import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Shield, Users, UserCheck, UserX, Search, Filter, Settings, Eye } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  last_sign_in_at: string;
  approved_by?: string;
  rejection_reason?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();

  const roles = [
    { value: 'admin', label: 'Admin', color: 'bg-red-500' },
    { value: 'mst', label: 'MST', color: 'bg-blue-500' },
    { value: 'fe', label: 'Field Expert', color: 'bg-green-500' },
    { value: 'hk', label: 'House Keeping', color: 'bg-yellow-500' },
    { value: 'se', label: 'Security Executive', color: 'bg-purple-500' },
    { value: 'assistant_manager', label: 'Assistant Manager', color: 'bg-indigo-500' },
    { value: 'assistant_floor_manager', label: 'Assistant Floor Manager', color: 'bg-cyan-500' },
    { value: 'assistant_general_manager', label: 'Assistant General Manager', color: 'bg-pink-500' },
    { value: 'assistant_vice_president', label: 'Assistant Vice President', color: 'bg-rose-500' },
    { value: 'vp', label: 'VP', color: 'bg-amber-500' },
    { value: 'ceo', label: 'CEO', color: 'bg-emerald-500' },
    { value: 'cxo', label: 'CXO', color: 'bg-teal-500' },
    { value: 'tenant', label: 'Tenant', color: 'bg-gray-500' },
    { value: 'vendor', label: 'Vendor', color: 'bg-orange-500' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'approved', label: 'Approved', color: 'bg-green-500' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_user_management_data', {
        caller_id: currentUser.user.id
      });
      
      if (error) throw error;
      
      // Map the data to include all required fields
      const mappedUsers = (data || []).map((user: any) => ({
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || 'tenant',
        approval_status: user.approval_status || 'pending',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        approved_by: user.approved_by,
        rejection_reason: user.rejection_reason
      }));
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('approve_user', {
        target_user_id: userId,
        approver_id: currentUser.user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User approved successfully",
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    }
  };

  const rejectUser = async (userId: string, reason: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('reject_user', {
        target_user_id: userId,
        approver_id: currentUser.user.id,
        reason: reason
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User rejected successfully",
      });
      
      fetchUsers();
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: newRole,
        caller_id: currentUser.user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.approval_status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingUsers = users.filter(user => user.approval_status === 'pending');

  const getRoleBadge = (role: string) => {
    const roleInfo = roles.find(r => r.value === role);
    return (
      <Badge className={`${roleInfo?.color || 'bg-gray-500'} text-white`}>
        {roleInfo?.label || role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    return (
      <Badge className={`${statusInfo?.color || 'bg-gray-500'} text-white`}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <UserPlus size={16} />
            Invite User
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings size={16} />
            Security Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {users.filter(u => u.approval_status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/50">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary">All Users</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-primary">
            Pending Approval ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-primary">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.first_name || user.last_name 
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : 'No name'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.approval_status)}</TableCell>
                    <TableCell>
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.approval_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveUser(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRejectDialog(true);
                              }}
                            >
                              <UserX size={14} />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals</CardTitle>
              <CardDescription>
                Review and approve new user registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : 'No name'
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveUser(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRejectDialog(true);
                              }}
                            >
                              <UserX size={14} className="mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Matrix</CardTitle>
              <CardDescription>
                Configure permissions for different user roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map(role => (
                  <div key={role.value} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(role.value)}
                        <span className="font-medium">{role.label}</span>
                      </div>
                      <Button size="sm" variant="outline">Configure</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="text-green-500">✓ View Dashboard</div>
                      <div className="text-green-500">✓ Create Requests</div>
                      <div className={role.value === 'admin' ? 'text-green-500' : 'text-red-500'}>
                        {role.value === 'admin' ? '✓' : '✗'} Manage Users
                      </div>
                      <div className={['admin', 'ops_supervisor'].includes(role.value) ? 'text-green-500' : 'text-red-500'}>
                        {['admin', 'ops_supervisor'].includes(role.value) ? '✓' : '✗'} View Analytics
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this user's registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedUser && rejectUser(selectedUser.id, rejectionReason)}
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;