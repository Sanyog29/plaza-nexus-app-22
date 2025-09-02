import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Trash2,
  Search,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { DepartmentSelector } from './DepartmentSelector';
import { ALLOWED_ROLES, DEFAULT_ROLE, getRoleColor, requiresSpecialization } from '@/constants/roles';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  approval_status: string;
  created_at: string;
  confirmed_at: string;
  last_sign_in_at: string;
}

export const EnhancedUserManagement: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  
  // Role editing state
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [departmentSelection, setDepartmentSelection] = useState({ department: '', specialization: '' });
  
  // Categories for department specialization
  const categories = [
    { value: 'Cleaning', label: 'Cleaning' },
    { value: 'Security', label: 'Security' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'Plumbing', label: 'Plumbing' },
    { value: 'General Maintenance', label: 'General Maintenance' },
    { value: 'IT Support', label: 'IT Support' },
    { value: 'Safety', label: 'Safety' }
  ];

  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: DEFAULT_ROLE,
    department: '',
    specialization: ''
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_user_management_data', {
        caller_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;
      const mappedData = (data || []).map((user: any) => ({
        ...user,
        approval_status: user.approval_status || 'pending'
      }));
      setUsers(mappedData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show department specialization field for L1 roles
  const showDepartmentSpecialization = requiresSpecialization(newUser.role);
  
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if department specialization is required but not provided
    if (showDepartmentSpecialization && !newUser.specialization) {
      toast({
        title: "Missing Information",
        description: "Please select a department specialization for this role",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);

    try {
      const { data, error } = await supabase.rpc('admin_create_user_invitation', {
        invitation_email: newUser.email,
        invitation_first_name: newUser.firstName,
        invitation_last_name: newUser.lastName,
        invitation_role: newUser.role,
        invitation_department: newUser.department || null,
        invitation_specialization: newUser.specialization || null,
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'error' in data) {
        toast({
          title: "Error",
          description: data.error as string,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User invitation sent successfully",
      });

      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        role: DEFAULT_ROLE,
        department: '',
        specialization: ''
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user invitation",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('approve_user', {
        target_user_id: userId,
        approver_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User approved successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: string, reason: string = 'Rejected by admin') => {
    try {
      const { error } = await supabase.rpc('reject_user', {
        target_user_id: userId,
        approver_id: (await supabase.auth.getUser()).data.user?.id,
        reason: reason
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User rejected successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject user",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: `Password reset email sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset",
        variant: "destructive",
      });
    }
  };

  const handleStartRoleEdit = (userId: string, currentRole: string) => {
    setEditingRoleUserId(userId);
    setNewRole(currentRole);
  };

  const handleCancelRoleEdit = () => {
    setEditingRoleUserId(null);
    setNewRole('');
  };

  const handleSaveRoleChange = async (userId: string) => {
    if (!newRole || newRole === users.find(u => u.id === userId)?.role) {
      handleCancelRoleEdit();
      return;
    }

    setIsUpdatingRole(true);
    try {
      const { error } = await supabase.rpc('update_user_role_safe', {
        target_user_id: userId,
        new_role_text: newRole
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      setEditingRoleUserId(null);
      setNewRole('');
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    // Prevent admin from deleting themselves
    if (user.id === currentUser?.id) {
      toast({
        title: "Error",
        description: "Cannot delete your own account",
        variant: "destructive",
      });
      return;
    }

    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: userToDelete.id }
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete user');
      }

      // Handle response from edge function
      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: `User ${userToDelete.email} has been permanently deleted`,
      });

      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Delete user error:', error);
      
      // Handle specific error cases
      let errorMessage = error.message || 'Failed to delete user';
      
      if (error.message?.includes('Cannot delete your own account')) {
        errorMessage = 'Cannot delete your own account';
      } else if (error.message?.includes('Insufficient permissions')) {
        errorMessage = 'Insufficient permissions. Admin access required.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'User not found or already deleted';
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  const getRoleBadgeColor = getRoleColor;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.approval_status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need administrator privileges to access user management.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create User Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Enhanced Department Selector */}
            <div className="md:col-span-2">
              <DepartmentSelector
                selectedDepartment={newUser.department}
                selectedSpecialization={newUser.specialization}
                onDepartmentChange={(dept) => setNewUser({ ...newUser, department: dept })}
                onSpecializationChange={(spec) => setNewUser({ ...newUser, specialization: spec })}
                showSpecialization={showDepartmentSpecialization}
                required={showDepartmentSpecialization}
                className="w-full"
              />
            </div>
          </div>
          <Button 
            onClick={handleCreateUser} 
            disabled={isCreatingUser}
            className="w-full md:w-auto"
          >
            {isCreatingUser ? "Creating..." : "Create User & Send Invitation"}
          </Button>
        </CardContent>
      </Card>

      {/* User Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ALLOWED_ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Role Badge/Editor */}
                          {editingRoleUserId === user.id ? (
                            <div className="flex items-center gap-2">
                               <div className="flex flex-col gap-2">
                                <Select value={newRole} onValueChange={setNewRole}>
                                  <SelectTrigger className="w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                   <SelectContent>
                                     {ALLOWED_ROLES.map(role => (
                                       <SelectItem key={role.value} value={role.value}>
                                         {role.label}
                                       </SelectItem>
                                     ))}
                                   </SelectContent>
                                </Select>
                                
                                  {/* Department selector for L1 roles */}
                                  {requiresSpecialization(newRole) && (
                                   <div className="mt-2 space-y-2">
                                     <DepartmentSelector
                                       selectedDepartment={departmentSelection.department}
                                       selectedSpecialization={departmentSelection.specialization}
                                       onDepartmentChange={(dept) => setDepartmentSelection(prev => ({ ...prev, department: dept }))}
                                       onSpecializationChange={(spec) => setDepartmentSelection(prev => ({ ...prev, specialization: spec }))}
                                       showSpecialization={true}
                                       required={true}
                                       className="w-full"
                                     />
                                   </div>
                                 )}
                               </div>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleSaveRoleChange(user.id)}
                                disabled={isUpdatingRole}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelRoleEdit}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                               <Badge className={getRoleBadgeColor(user.role)}>
                                 {ALLOWED_ROLES.find(r => r.value === user.role)?.label || user.role}
                               </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartRoleEdit(user.id, user.role)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          
                          <Badge 
                            variant={
                              user.approval_status === 'approved' ? 'default' :
                              user.approval_status === 'pending' ? 'secondary' : 'destructive'
                            }
                          >
                            {user.approval_status}
                          </Badge>
                          {!user.confirmed_at && (
                            <Badge variant="outline">Email Unconfirmed</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.approval_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveUser(user.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectUser(user.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(user.email)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset Password
                    </Button>
                    {/* Delete Button - Only show for admins, disable for self */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.id === currentUser?.id}
                      title={user.id === currentUser?.id ? "Cannot delete your own account" : "Permanently delete user"}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete User Account"
        description={`Are you sure you want to permanently delete ${userToDelete?.first_name} ${userToDelete?.last_name}'s account? This action cannot be undone and will remove all associated data.`}
        itemName={userToDelete?.email}
        deleteText="Delete User"
        onConfirm={confirmDeleteUser}
        loading={isDeletingUser}
        destructive={true}
      />
    </div>
  );
};
