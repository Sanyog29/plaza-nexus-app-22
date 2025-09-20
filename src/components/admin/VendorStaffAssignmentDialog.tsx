import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/utils/formatters';
import { Loader2, User as UserIcon } from 'lucide-react';

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
  profile_picture_url?: string;
}

interface Vendor {
  id: string;
  name: string;
  description: string;
  is_active?: boolean;
}

interface VendorStaffAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialUserId?: string;
  initialVendorId?: string;
  vendorName?: string;
}

export const VendorStaffAssignmentDialog: React.FC<VendorStaffAssignmentDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialUserId,
  initialVendorId,
  vendorName
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId || '');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchVendors();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedUserId(initialUserId || '');
    // Don't set selectedVendorId here - it will be set after vendors are fetched
  }, [initialUserId]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_unassigned_users');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchVendors = async () => {
    setVendorsLoading(true);
    console.log('Fetching vendors...', { initialVendorId });
    
    try {
      let vendorsQuery = supabase
        .from('vendors')
        .select('id, name, description, is_active')
        .order('name');

      // If we have an initialVendorId, fetch all vendors to ensure pre-selected vendor is included
      if (!initialVendorId) {
        vendorsQuery = vendorsQuery.eq('is_active', true);
      }

      const { data, error } = await vendorsQuery;

      if (error) throw error;
      
      const fetchedVendors = data || [];
      console.log('Fetched vendors:', fetchedVendors);

      // If we have initialVendorId but it's not in the list, fetch it separately
      if (initialVendorId && !fetchedVendors.find(v => v.id === initialVendorId)) {
        console.log('Pre-selected vendor not found, fetching separately...');
        const { data: specificVendor, error: specificError } = await supabase
          .from('vendors')
          .select('id, name, description, is_active')
          .eq('id', initialVendorId)
          .single();

        if (!specificError && specificVendor) {
          fetchedVendors.unshift(specificVendor); // Add to beginning of list
          console.log('Added pre-selected vendor:', specificVendor);
        } else {
          console.error('Failed to fetch pre-selected vendor:', specificError);
          toast({
            title: "Warning",
            description: "The selected vendor could not be found. Please select a different vendor.",
            variant: "destructive",
          });
        }
      }

      setVendors(fetchedVendors);
      
      // Set the pre-selected vendor after vendors are loaded
      if (initialVendorId && fetchedVendors.find(v => v.id === initialVendorId)) {
        setSelectedVendorId(initialVendorId);
        console.log('Pre-selected vendor set:', initialVendorId);
      }
      
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      });
    } finally {
      setVendorsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId || !selectedVendorId) {
      toast({
        title: "Missing Information",
        description: "Please select both user and vendor",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_add_vendor_staff', {
        p_user_id: selectedUserId,
        p_vendor_id: selectedVendorId,
        p_is_active: isActive
      });

      if (error) throw error;

      const result = data as { error?: string; message?: string; success?: boolean };

      if (result?.error) {
        toast({
          title: "Assignment Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: result?.message || "User assigned to vendor successfully",
      });

      onSuccess();
      onClose();
      
      // Reset form
      setSelectedUserId('');
      setSelectedVendorId('');
      setIsActive(true);
    } catch (error) {
      console.error('Error assigning vendor staff:', error);
      toast({
        title: "Error",
        description: "Failed to assign user to vendor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get selected user and vendor details for display
  const selectedUser = users.find(user => user.user_id === selectedUserId);
  const selectedVendor = vendors.find(vendor => vendor.id === selectedVendorId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md relative">
        <DialogHeader>
        <DialogTitle>
          {vendorName ? `Assign Staff to ${vendorName}` : 'Assign User to Vendor'}
        </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user">Select User</Label>
            <Select 
              value={selectedUserId} 
              onValueChange={setSelectedUserId}
              disabled={!!initialUserId || usersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={usersLoading ? "Loading users..." : "Choose a user..."} />
                {usersLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </SelectTrigger>
              <SelectContent className="z-[100] max-h-[200px] overflow-y-auto">
                {users.length === 0 && !usersLoading ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No unassigned users available
                  </div>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.profile_picture_url} />
                          <AvatarFallback className="text-xs">
                            <UserIcon className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {formatUserName(user.first_name, user.last_name, user.email)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.role}{user.department && ` • ${user.department}`}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {/* Selected User Details Display */}
            {selectedUser && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser.profile_picture_url} />
                      <AvatarFallback>
                        <UserIcon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {formatUserName(selectedUser.first_name, selectedUser.last_name, selectedUser.email)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedUser.role}
                        {selectedUser.department && ` • ${selectedUser.department}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedUser.email}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      ✅ Available
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Select Vendor</Label>
            <Select 
              value={selectedVendorId} 
              onValueChange={setSelectedVendorId}
              disabled={vendorsLoading || !!initialVendorId}
            >
              <SelectTrigger>
                <SelectValue placeholder={vendorsLoading ? "Loading vendors..." : "Choose a vendor..."} />
                {vendorsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </SelectTrigger>
              <SelectContent className="z-[100] max-h-[200px] overflow-y-auto">
                {vendors.length === 0 && !vendorsLoading ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No active vendors available
                  </div>
                ) : (
                  vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {/* Selected Vendor Details Display */}
            {selectedVendor && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{selectedVendor.name}</div>
                    {selectedVendor.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedVendor.description}
                      </div>
                    )}
                  </div>
                  <div>
                    <Badge 
                      variant={selectedVendor.is_active ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {selectedVendor.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            {initialVendorId && (
              <p className="text-xs text-muted-foreground mt-1">
                Vendor is pre-selected and cannot be changed
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Assignment Status</Label>
            <Select 
              value={isActive ? 'active' : 'inactive'} 
              onValueChange={(value) => setIsActive(value === 'active')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedUserId || !selectedVendorId}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              'Assign to Vendor'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};