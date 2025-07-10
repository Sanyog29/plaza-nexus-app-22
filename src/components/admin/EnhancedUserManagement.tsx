import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Shield, 
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  Settings,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import UserInvitationModal from './UserInvitationModal';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  phone_number?: string;
  office_number?: string;
  floor?: string;
}

interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  created_at: string;
}

const EnhancedUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const { user: currentUser, isAdmin } = useAuth();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_user_management_data', {
        caller_id: currentUser?.id
      });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('update_user_role_safe', {
        target_user_id: userId,
        new_role_text: newRole
      });
      
      if (error) throw error;
      
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateUserSuccess = () => {
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'verified' && user.confirmed_at) ||
      (statusFilter === 'unverified' && !user.confirmed_at);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getUserStatusBadge = (user: User) => {
    if (!user.confirmed_at) {
      return <Badge variant="destructive">Unverified</Badge>;
    }
    if (user.last_sign_in_at) {
      const lastSignIn = new Date(user.last_sign_in_at);
      const daysSince = (Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSince < 7) {
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      } else if (daysSince < 30) {
        return <Badge variant="secondary">Inactive</Badge>;
      }
    }
    return <Badge variant="outline">Never Signed In</Badge>;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      ops_supervisor: 'bg-blue-100 text-blue-800',
      field_staff: 'bg-green-100 text-green-800',
      staff: 'bg-purple-100 text-purple-800',
      tenant_manager: 'bg-gray-100 text-gray-800',
      vendor: 'bg-orange-100 text-orange-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (currentUser && isAdmin) {
      fetchUsers();
      fetchUserActivities();
    }
  }, [currentUser, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access user management features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchUsers()}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateUser(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.confirmed_at).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.last_sign_in_at && 
                    (Date.now() - new Date(u.last_sign_in_at).getTime()) < 7 * 24 * 60 * 60 * 1000
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="ops_supervisor">Operations Supervisor</SelectItem>
                <SelectItem value="field_staff">Field Staff</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingWrapper loading={isLoading}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Department</th>
                    <th className="text-left p-4 font-medium">Last Activity</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : 'No name set'
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border border-border z-50">
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="ops_supervisor">Operations Supervisor</SelectItem>
                            <SelectItem value="field_staff">Field Staff</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {user.department || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {user.last_sign_in_at 
                            ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                            : 'Never'
                          }
                        </span>
                      </td>
                      <td className="p-4">
                        {getUserStatusBadge(user)}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LoadingWrapper>
        </CardContent>
      </Card>

      {/* User Invitation Modal */}
      <UserInvitationModal
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
        onSuccess={handleCreateUserSuccess}
      />

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.first_name && selectedUser.last_name 
                      ? `${selectedUser.first_name} ${selectedUser.last_name}`
                      : 'No name set'
                    }
                  </p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {selectedUser.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.department || '-'}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedUser.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <Label>Last Sign In</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.last_sign_in_at 
                      ? format(new Date(selectedUser.last_sign_in_at), 'MMM d, yyyy HH:mm')
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedUserManagement;