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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  MoreVertical,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { useGlobalError } from '@/components/common/GlobalErrorProvider';
import UserInvitationModal from './UserInvitationModal';
import SystemHealthCheck from './SystemHealthCheck';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  has_profile: boolean;
}

interface UserActivity {
  id: string;
  user_id: string;
  action: string;
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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user: currentUser, isAdmin } = useAuth();
  const { handleAsyncError } = useGlobalError();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_management_data', {
        caller_id: currentUser?.id
      });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Map the data to ensure all required fields are present
      const usersData = (data || []).map((user: any) => ({
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role,
        approval_status: user.approval_status || 'pending',
        approved_by: user.approved_by || null,
        approved_at: user.approved_at || null,
        rejection_reason: user.rejection_reason || null,
        created_at: user.created_at,
        updated_at: user.updated_at,
        confirmed_at: user.confirmed_at || null,
        last_sign_in_at: user.last_sign_in_at || null,
        has_profile: user.has_profile || false,
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
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
        .select('id, user_id, action, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching user activities:', error);
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
        title: "Success",
        description: "User role updated successfully.",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      // First check if user has a profile, if not create one
      const user = users.find(u => u.id === userId);
      if (user && !user.has_profile) {
        console.log('User has no profile, attempting to repair...');
        
        // Try to create profile manually first
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            role: 'tenant_manager',
            approval_status: 'pending'
          });

        if (!profileError) {
          console.log('User profile created successfully');
          // Refresh users to get updated profile status
          await fetchUsers();
        }
      }

      const { error } = await supabase.rpc('approve_user', {
        target_user_id: userId,
        approver_id: currentUser?.id
      });

      if (error) {
        // If approval fails due to missing profile, try to create it
        if (error.message?.includes('profile') || error.message?.includes('not found')) {
          console.log('Approval failed due to missing profile, creating profile...');
          
          // Create profile manually
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              first_name: user?.first_name || '',
              last_name: user?.last_name || '',
              role: 'tenant_manager',
              approval_status: 'pending'
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error(`Failed to create user profile: ${profileError.message}`);
          }

          // Try approval again
          const { error: retryError } = await supabase.rpc('approve_user', {
            target_user_id: userId,
            approver_id: currentUser?.id
          });

          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "User approved successfully.",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: `Failed to approve user: ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: string, reason: string) => {
    try {
      // First check if user has a profile, if not create one
      const user = users.find(u => u.id === userId);
      if (user && !user.has_profile) {
        console.log('User has no profile, creating one for rejection...');
        
        // Create profile manually
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            role: 'tenant_manager',
            approval_status: 'pending'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Continue with rejection anyway
        }
      }

      const { error } = await supabase.rpc('reject_user', {
        target_user_id: userId,
        approver_id: currentUser?.id,
        reason: reason
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User rejected successfully.",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: `Failed to reject user: ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    }
  };

  const handleCreateUserSuccess = () => {
    setShowCreateUser(false);
    fetchUsers();
    toast({
      title: "Success",
      description: "User invitation sent successfully.",
    });
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      
      console.log('Attempting to delete user:', userToDelete.id);
      
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: userToDelete.id }
      });

      console.log('Delete response:', { data, error });

      if (error) {
        console.error('Function invoke error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `User ${userToDelete.email} has been deleted successfully.`,
      });

      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'verified' && user.confirmed_at) ||
      (statusFilter === 'unverified' && !user.confirmed_at);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getUserStatusBadge = (user: User) => {
    if (!user.confirmed_at) {
      return <Badge variant="secondary">Unverified</Badge>;
    }
    if (user.last_sign_in_at && new Date(user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'ops_supervisor': return 'bg-blue-100 text-blue-800';
      case 'field_staff': return 'bg-green-100 text-green-800';
      case 'tenant_manager': return 'bg-yellow-100 text-yellow-800';
      case 'vendor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.confirmed_at).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => !u.confirmed_at).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ops_supervisor">Ops Supervisor</SelectItem>
                  <SelectItem value="field_staff">Field Staff</SelectItem>
                  <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Check */}
      <SystemHealthCheck />

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
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Approval Status</th>
                    <th className="text-left p-4">Joined</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                       <td className="p-4">
                         <div>
                           <p className="font-medium">
                             {user.first_name && user.last_name 
                               ? `${user.first_name} ${user.last_name}`
                               : 'No name set'
                             }
                             {!user.has_profile && (
                               <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                 No Profile
                               </span>
                             )}
                           </p>
                           <p className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                         </div>
                       </td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="ops_supervisor">Ops Supervisor</SelectItem>
                            <SelectItem value="field_staff">Field Staff</SelectItem>
                            <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            user.approval_status === 'approved' ? 'default' :
                            user.approval_status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {user.approval_status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="p-4">
                        {getUserStatusBadge(user)}
                      </td>
                      <td className="p-4">
                         <div className="flex items-center gap-2">
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
                           
                           {!user.has_profile && (
                             <Button
                               variant="outline"
                               size="sm"
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('profiles')
                                      .insert({
                                        id: user.id,
                                        first_name: user.first_name || '',
                                        last_name: user.last_name || '',
                                        role: 'tenant_manager',
                                        approval_status: 'pending'
                                      });
                                    if (error) throw error;
                                    toast({
                                      title: "Success",
                                      description: "User profile created successfully.",
                                    });
                                    fetchUsers();
                                  } catch (error) {
                                    console.error('Error creating profile:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to create user profile.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                               className="text-blue-600 hover:text-blue-700"
                             >
                               <UserPlus className="h-4 w-4 mr-1" />
                               Create Profile
                             </Button>
                           )}
                           
                           {user.approval_status === 'pending' && (
                             <>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleApproveUser(user.id)}
                                 className="text-green-600 hover:text-green-700"
                               >
                                 <CheckCircle className="h-4 w-4 mr-1" />
                                 Approve
                               </Button>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleRejectUser(user.id, 'Admin rejected')}
                                 className="text-red-600 hover:text-red-700"
                               >
                                 <AlertTriangle className="h-4 w-4 mr-1" />
                                 Reject
                               </Button>
                             </>
                           )}
                           
                           {user.id !== currentUser?.id && (
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => setUserToDelete(user)}
                                 >
                                   <Trash2 className="h-4 w-4 text-destructive" />
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Delete User</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Are you sure you want to delete {user.email}? This action cannot be undone.
                                     All user data, including their requests and activities, will be permanently removed.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                                     Cancel
                                   </AlertDialogCancel>
                                   <AlertDialogAction
                                     onClick={handleDeleteUser}
                                     disabled={isDeleting}
                                     className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                   >
                                     {isDeleting ? 'Deleting...' : 'Delete User'}
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           )}
                         </div>
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
                  <p className="text-sm text-muted-foreground">{selectedUser.role}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {getUserStatusBadge(selectedUser)}
                  </p>
                </div>
                <div>
                  <Label>Joined</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedUser.created_at), 'MMM d, yyyy HH:mm')}
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