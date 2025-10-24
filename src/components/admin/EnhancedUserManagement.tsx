import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { PhoneInput } from '@/components/ui/phone-input';
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
import { useInvitationRoles } from '@/hooks/useInvitationRoles';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { VendorStaffAssignmentDialog } from './VendorStaffAssignmentDialog';

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  assigned_role_title: string;
  department: string;
  specialization: string;
  approval_status: string;
  created_at: string;
  confirmed_at: string;
  last_sign_in_at: string;
}

export const EnhancedUserManagement: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, user: currentUser } = useAuth();
  const { roles, isLoading: rolesLoading, getRoleColor, requiresSpecialization, getRoleDefaults } = useInvitationRoles();
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
  
  // Vendor staff assignment state
  const [showVendorStaffDialog, setShowVendorStaffDialog] = useState(false);
  const [selectedUserForVendor, setSelectedUserForVendor] = useState<string>('');
  
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
    mobileNumber: '',
    firstName: '',
    lastName: '',
    role: '',
    department: '',
    specialization: '',
    password: '',
    empId: ''
  });
  
  const [sendInvitation, setSendInvitation] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Set default role when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !newUser.role) {
      setNewUser(prev => ({ ...prev, role: roles[0].title }));
    }
  }, [roles, newUser.role]);

  // Update specialization visibility when role changes
  useEffect(() => {
    const shouldShow = requiresSpecialization(newUser.role);
    setShowDepartmentSpecialization(shouldShow);
    
    if (shouldShow) {
      const defaults = getRoleDefaults(newUser.role);
      if (defaults.department && !newUser.department) {
        setNewUser(prev => ({ ...prev, department: defaults.department! }));
      }
      if (defaults.specialization && !newUser.specialization) {
        setNewUser(prev => ({ ...prev, specialization: defaults.specialization! }));
      }
    } else {
      setNewUser(prev => ({ ...prev, department: '', specialization: '' }));
    }
  }, [newUser.role, requiresSpecialization, getRoleDefaults]);

  // Get role object for current selection
  const currentRoleObject = roles.find(r => r.title === newUser.role);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_user_management_data');

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
        description: `Failed to fetch users: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  
  // Show department specialization field for L1 roles
  const [showDepartmentSpecialization, setShowDepartmentSpecialization] = useState(false);
  
  const handleCreateUser = async () => {
    if ((!newUser.email && !newUser.mobileNumber) || !newUser.firstName || !newUser.lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields. Either email or mobile number is required.",
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

    // If creating account now, password is required
    if (!sendInvitation && !newUser.password) {
      toast({
        title: "Missing Information",
        description: "Password is required when creating account directly",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);

    try {
      if (sendInvitation) {
        // Use RPC for invitation - send the title directly
        const { data, error } = await supabase.rpc('admin_create_user_invitation', {
          invitation_email: newUser.email || null,
          invitation_phone_number: newUser.mobileNumber || null,
          invitation_first_name: newUser.firstName,
          invitation_last_name: newUser.lastName,
          invitation_role: newUser.role, // Already contains the title
          invitation_department: newUser.department || null,
          invitation_specialization: newUser.specialization || null,
          invitation_password: newUser.password || null,
          invitation_emp_id: newUser.empId || null,
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
      } else {
      // Use the title directly for user creation
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newUser.email || undefined,
          mobile_number: newUser.mobileNumber || undefined,
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          role: newUser.role, // Already contains the title
          department: newUser.department || undefined,
          specialization: newUser.specialization || undefined,
          password: newUser.password,
          emp_id: newUser.empId || undefined,
          send_invitation: false
        }
      });

        if (error) throw error;

        if (data?.error) {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "User account created successfully. They can sign in immediately.",
        });
      }

      setNewUser({
        email: '',
        mobileNumber: '',
        firstName: '',
        lastName: '',
        role: roles.length > 0 ? roles[0].title : '',
        department: '',
        specialization: '',
        password: '',
        empId: ''
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${sendInvitation ? 'create user invitation' : 'create user account'}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_user', {
        target_user_id: userId,
        approver_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) {
        throw new Error(error.message || 'Failed to approve user');
      }

      toast({
        title: "Success",
        description: "User approved successfully. They can now access the system.",
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve user. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: string, reason: string = 'Rejected by admin') => {
    try {
      const { data, error } = await supabase.rpc('reject_user', {
        target_user_id: userId,
        approver_id: (await supabase.auth.getUser()).data.user?.id,
        reason: reason
      });

      if (error) {
        throw new Error(error.message || 'Failed to reject user');
      }

      toast({
        title: "Success",
        description: "User rejected successfully.",
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject user. Please check your permissions.",
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
    
    // Initialize department selection with user's current values
    const user = users.find(u => u.id === userId);
    setDepartmentSelection({
      department: user?.department || '',
      specialization: user?.specialization || ''
    });
  };

  const handleCancelRoleEdit = () => {
    setEditingRoleUserId(null);
    setNewRole('');
  };

  const handleSaveRoleChange = async (userId: string) => {
    const currentUser = users.find(u => u.id === userId);
    if (!newRole || (newRole === currentUser?.assigned_role_title && 
        departmentSelection.department === (currentUser?.department || '') &&
        departmentSelection.specialization === (currentUser?.specialization || ''))) {
      handleCancelRoleEdit();
      return;
    }

    setIsUpdatingRole(true);
    try {
      const { data, error } = await supabase.rpc('update_user_role_and_department', {
        target_user_id: userId,
        role_text: newRole,
        dept: departmentSelection.department || null,
        spec: departmentSelection.specialization || null
      });

      if (error) throw error;

      // Check if the RPC returned an error in the data
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error((data as any).error);
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditingRoleUserId(null);
      setNewRole('');
      setDepartmentSelection({ department: '', specialization: '' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
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
    const matchesRole = selectedRole === 'all' || user.assigned_role_title === selectedRole || user.role === selectedRole;
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
          {/* Creation Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Switch
                  id="send-invitation"
                  checked={sendInvitation}
                  onCheckedChange={setSendInvitation}
                />
                <Label htmlFor="send-invitation">Send invitation</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {sendInvitation 
                  ? "User will receive an email/SMS to set their password and activate account"
                  : "Account will be created immediately with provided credentials - user can sign in right away"
                }
              </p>
            </div>
          </div>
          
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <PhoneInput
                value={newUser.mobileNumber}
                onChange={(value) => setNewUser({ ...newUser, mobileNumber: value })}
                placeholder="Enter mobile number"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!sendInvitation && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder={sendInvitation ? "Enter password (optional)" : "Enter password (required)"}
              />
              {!sendInvitation && (
                <p className="text-xs text-muted-foreground">
                  User will use this password to sign in immediately
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="empId">Employee ID</Label>
              <Input
                id="empId"
                value={newUser.empId}
                onChange={(e) => setNewUser({ ...newUser, empId: e.target.value })}
                placeholder="Enter employee ID (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.title}>{role.title}</SelectItem>
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
            {isCreatingUser 
              ? (sendInvitation ? "Sending..." : "Creating...") 
              : (sendInvitation ? "Create User & Send Invitation" : "Create Account Now")
            }
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
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.title}>{role.title}</SelectItem>
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
                                     {roles.map(role => (
                                       <SelectItem key={role.id} value={role.title}>
                                         {role.title}
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
                                  {user.assigned_role_title || user.role}
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
