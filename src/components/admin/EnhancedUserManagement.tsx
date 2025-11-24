import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { PhoneInput } from '@/components/ui/phone-input';
import { useDebouncedSearch } from '@/hooks/useDebounce';
import { advancedSearchFilter } from '@/utils/searchUtils';
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
import { PropertyAssignmentDialog } from './PropertyAssignmentDialog';
import { usePropertyContext } from '@/contexts/PropertyContext';

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
  property_id?: string;
  property_name?: string;
  is_primary?: boolean;
}

export const EnhancedUserManagement: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, user: currentUser } = useAuth();
  const { roles, isLoading: rolesLoading, getRoleColor, requiresSpecialization, getRoleDefaults } = useInvitationRoles();
  const { currentProperty, availableProperties, isSuperAdmin } = usePropertyContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedSearch('', 300);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
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
  
  // Property editing state
  const [editingPropertyUserId, setEditingPropertyUserId] = useState<string | null>(null);
  const [newPropertyId, setNewPropertyId] = useState<string>('');
  const [isUpdatingProperty, setIsUpdatingProperty] = useState(false);
  
  // Vendor staff assignment state
  const [showVendorStaffDialog, setShowVendorStaffDialog] = useState(false);
  const [selectedUserForVendor, setSelectedUserForVendor] = useState<string>('');
  
  // Property assignment dialog state
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [selectedUserForProperty, setSelectedUserForProperty] = useState<UserData | null>(null);
  
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
    empId: '',
    propertyId: currentProperty?.id || ''
  });
  
  const [sendInvitation, setSendInvitation] = useState(true);

  // Define fetchUsers with useCallback for stable reference
  const fetchUsers = useCallback(async () => {
    console.log('fetchUsers called');
    try {
      setIsLoading(true);
      
      // Determine property filter based on user role and current selection
      let propertyFilter: string | null = null;
      
      if (isSuperAdmin) {
        // Super admins: respect their property dropdown selection
        if (selectedProperty !== 'all' && selectedProperty !== 'unassigned') {
          propertyFilter = selectedProperty;
        }
        // If 'all' or 'unassigned', pass null to see all users
      } else {
        // Regular admins: always filter by their current property
        propertyFilter = currentProperty?.id || null;
      }

      console.log('Fetching users with filter:', propertyFilter);
      const { data, error } = await supabase.rpc('get_user_management_data', {
        filter_property_id: propertyFilter
      });

      if (error) throw error;
      const mappedData = (data || []).map((user: any) => ({
        ...user,
        approval_status: user.approval_status || 'pending'
      }));
      console.log('Users fetched:', mappedData.length);
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
  }, [isSuperAdmin, selectedProperty, currentProperty, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // Set default role and property when loaded
  useEffect(() => {
    if (roles.length > 0 && !newUser.role) {
      setNewUser(prev => ({ ...prev, role: roles[0].title }));
    }
  }, [roles, newUser.role]);

  useEffect(() => {
    if (currentProperty && !newUser.propertyId) {
      setNewUser(prev => ({ ...prev, propertyId: currentProperty.id }));
    }
  }, [currentProperty]);

  // Default property filter for non-super admins
  useEffect(() => {
    if (!isSuperAdmin && currentProperty && selectedProperty === 'all') {
      setSelectedProperty(currentProperty.id);
    }
  }, [isSuperAdmin, currentProperty]);

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

  // Real-time subscription for profile updates
  useEffect(() => {
    if (!isAdmin) {
      console.log('Skipping real-time subscription - user is not admin');
      return;
    }

    console.log('Setting up real-time subscription for profiles table');
    
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Real-time UPDATE event received:', payload);
          console.log('Triggering fetchUsers from real-time subscription');
          // Refresh users when any profile is updated
          fetchUsers();
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to profiles changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error');
        }
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchUsers]);

  // Get role object for current selection
  const currentRoleObject = roles.find(r => r.title === newUser.role);
  
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

    // Property is optional - will default to "Unassigned" if not provided

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
          invitation_property_id: newUser.propertyId || null, // Can be null - will default to Unassigned
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

        // Check if user was assigned to default unassigned property
        const isDefaultProperty = data && typeof data === 'object' && 'is_default_property' in data && data.is_default_property;
        
        toast({
          title: "Success",
          description: isDefaultProperty 
            ? "User invitation sent. User assigned to 'Unassigned' property - remember to assign a real property after approval."
            : "User invitation sent successfully",
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
          property_id: newUser.propertyId || undefined, // Can be undefined - will default to Unassigned
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
          description: !newUser.propertyId 
            ? "User account created successfully. User assigned to 'Unassigned' property - assign a real property now."
            : "User account created successfully. They can sign in immediately.",
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
        empId: '',
        propertyId: currentProperty?.id || ''
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
      // Find current user before approval
      const userBefore = users.find(u => u.id === userId);
      console.log('User before approval:', userBefore);

      // Optimistic UI update
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, approval_status: 'approved' } : u
        )
      );
      
      // First, get the current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('You must be logged in to approve users');
      }

      console.log('Approving user:', { userId, approverId: user.id });

      const { data, error } = await supabase.rpc('approve_user', {
        target_user_id: userId,
        approver_id: user.id
      });

      console.log('RPC Response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to approve user');
      }

      // Check the RPC function's success field from jsonb response
      const response = data as { success: boolean; message?: string; error?: string } | null;
      if (response && !response.success) {
        throw new Error(response.error || 'Failed to approve user');
      }

      toast({
        title: "Success",
        description: response?.message || "User approved successfully. Auto-assigned to default property.",
      });

      // Manual refresh as fallback in case real-time doesn't trigger
      console.log('Manually refreshing users after approval');
      await fetchUsers();
      
      // Show property assignment dialog for newly approved users
      const approvedUser = users.find(u => u.id === userId);
      if (approvedUser) {
        setSelectedUserForProperty(approvedUser);
        setShowPropertyDialog(true);
      }
    } catch (error: any) {
      console.error('Approval error:', error);
      
      // Revert optimistic update on error
      await fetchUsers();
      
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve user. Please check your permissions.",
        variant: "destructive",
      });
    }
  };
  
  const handlePropertyAssignment = async (propertyId: string) => {
    if (!selectedUserForProperty) return;
    
    try {
      const { data, error } = await supabase.rpc('update_user_property_assignment', {
        target_user_id: selectedUserForProperty.id,
        new_property_id: propertyId
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error((data as any).error);
      }

      toast({
        title: "Success",
        description: "Property assignment updated successfully",
      });

      setShowPropertyDialog(false);
      setSelectedUserForProperty(null);
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update property assignment",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: string, reason: string = 'Rejected by admin') => {
    try {
      // First, get the current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('You must be logged in to reject users');
      }

      console.log('Rejecting user:', { userId, approverId: user.id, reason });

      const { data, error } = await supabase.rpc('reject_user', {
        target_user_id: userId,
        approver_id: user.id,
        reason: reason
      });

      console.log('RPC Response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to reject user');
      }

      // Check the RPC function's success field from jsonb response
      const response = data as { success: boolean; message?: string; error?: string } | null;
      if (response && !response.success) {
        throw new Error(response.error || 'Failed to reject user');
      }

      toast({
        title: "Success",
        description: response?.message || "User rejected successfully.",
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

  const handleStartPropertyEdit = (userId: string, currentPropertyId: string) => {
    setEditingPropertyUserId(userId);
    setNewPropertyId(currentPropertyId || '');
  };

  const handleCancelPropertyEdit = () => {
    setEditingPropertyUserId(null);
    setNewPropertyId('');
  };

  const handleSavePropertyChange = async (userId: string) => {
    const currentUser = users.find(u => u.id === userId);
    if (!newPropertyId || newPropertyId === currentUser?.property_id) {
      handleCancelPropertyEdit();
      return;
    }

    setIsUpdatingProperty(true);
    try {
      const { data, error } = await supabase.rpc('update_user_property_assignment', {
        target_user_id: userId,
        new_property_id: newPropertyId
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error((data as any).error);
      }

      toast({
        title: "Success",
        description: "Property assignment updated successfully",
      });

      setEditingPropertyUserId(null);
      setNewPropertyId('');
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update property assignment",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProperty(false);
    }
  };

  const getRoleBadgeColor = getRoleColor;

  const filteredUsers = users.filter(user => {
    // Null-safe search matching
    const email = (user.email || '').toLowerCase();
    const firstName = (user.first_name || '').toLowerCase();
    const lastName = (user.last_name || '').toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    const searchLower = searchTerm.toLowerCase().trim();
    
    const matchesSearch = !searchLower || 
                         email.includes(searchLower) ||
                         fullName.includes(searchLower) ||
                         firstName.includes(searchLower) ||
                         lastName.includes(searchLower);
    
    const matchesRole = selectedRole === 'all' || 
                       user.assigned_role_title === selectedRole || 
                       user.role === selectedRole;
    
    const matchesStatus = selectedStatus === 'all' || 
                         user.approval_status === selectedStatus;
    
    // Property filtering is now handled at the database level for most cases
    // Frontend only handles 'unassigned' filter
    const matchesProperty = selectedProperty === 'all' || 
                           (selectedProperty === 'unassigned' ? !user.property_id : true);
    
    return matchesSearch && matchesRole && matchesStatus && matchesProperty;
  });

  const unassignedCount = users.filter(u => !u.property_id).length;

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
            <div className="space-y-2">
              <Label htmlFor="property">Property {!isSuperAdmin && '*'}</Label>
              <Select 
                value={newUser.propertyId} 
                onValueChange={(value) => setNewUser({ ...newUser, propertyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property (optional - defaults to Unassigned)" />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin ? (
                    availableProperties.map(property => (
                      property.id !== '00000000-0000-0000-0000-000000000001' && (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      )
                    ))
                  ) : (
                    availableProperties.map(property => (
                      property.id !== '00000000-0000-0000-0000-000000000001' && (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      )
                    ))
                  )}
                </SelectContent>
              </Select>
              {!newUser.propertyId && (
                <p className="text-xs text-muted-foreground">
                  ℹ️ User will be assigned to "Unassigned" property by default. You can assign a real property after creation.
                </p>
              )}
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
      <Card className="relative">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative z-10">
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
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="unassigned">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Unassigned ({unassignedCount})
                  </span>
                </SelectItem>
                {availableProperties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {unassignedCount > 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{unassignedCount} user{unassignedCount > 1 ? 's' : ''} without property assignment.</strong>
                {' '}Users must be assigned to a property to access the system. Click the edit icon next to "No Property" to assign.
              </AlertDescription>
            </Alert>
          )}
          
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
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                           {/* Property Badge - Enhanced with Unassigned indicator */}
                          {editingPropertyUserId === user.id ? (
                            <div className="flex items-center gap-2">
                              <Select value={newPropertyId} onValueChange={setNewPropertyId}>
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableProperties.map(property => (
                                    <SelectItem key={property.id} value={property.id}>
                                      {property.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleSavePropertyChange(user.id)}
                                disabled={isUpdatingProperty}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelPropertyEdit}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            ) : (
                            <div className="flex items-center gap-2">
                              {user.property_id ? (
                                user.property_id === '00000000-0000-0000-0000-000000000001' ? (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Unassigned
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    {user.is_primary && '⭐ '}
                                    {user.property_name}
                                  </Badge>
                                )
                              ) : (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  No Property
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartPropertyEdit(user.id, user.property_id || '')}
                                className="h-6 w-6 p-0"
                                title={!user.property_id || user.property_id === '00000000-0000-0000-0000-000000000001' ? "Assign property to enable full access" : "Change property"}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                           )}
                          
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
                          title="Approve user (will auto-assign to default property if needed)"
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
      
      {/* Property Assignment Dialog */}
      <PropertyAssignmentDialog
        open={showPropertyDialog}
        onOpenChange={setShowPropertyDialog}
        userId={selectedUserForProperty?.id || ''}
        userName={`${selectedUserForProperty?.first_name} ${selectedUserForProperty?.last_name}`}
        currentPropertyId={selectedUserForProperty?.property_id}
        onAssign={handlePropertyAssignment}
        isLoading={isUpdatingProperty}
      />

      {/* Vendor Staff Assignment Dialog */}
      <VendorStaffAssignmentDialog
        isOpen={showVendorStaffDialog}
        onClose={() => setShowVendorStaffDialog(false)}
        initialUserId={selectedUserForVendor}
        onSuccess={() => {
          setShowVendorStaffDialog(false);
          setSelectedUserForVendor('');
          fetchUsers();
        }}
      />
    </div>
  );
};
