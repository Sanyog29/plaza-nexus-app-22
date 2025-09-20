import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
    if (initialVendorId) {
      setSelectedVendorId(initialVendorId);
      console.log('Preselecting vendor immediately', { initialVendorId });
    }
  }, [initialUserId, initialVendorId, isOpen]);

  // Lock background scroll when dialog is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

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
      if (initialVendorId) {
        const { data: specificVendor, error } = await supabase
          .from('vendors')
          .select('id, name, description, is_active')
          .eq('id', initialVendorId)
          .maybeSingle();

        if (error) throw error;

        if (specificVendor) {
          setVendors([specificVendor]);
          console.log('Loaded pre-selected vendor:', specificVendor);
        } else {
          setVendors([]);
          console.warn('Pre-selected vendor not found');
          toast({
            title: "Warning",
            description: "The selected vendor could not be found. You can still proceed.",
          });
        }
      } else {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, name, description, is_active')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setVendors(data || []);
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
    const vendorIdToUse = selectedVendorId || initialVendorId || '';
    if (!selectedUserId || !vendorIdToUse) {
      toast({
        title: "Missing Information",
        description: "Please select both user and vendor",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Assigning vendor staff', { selectedUserId, vendorIdToUse, isActive });
      const { data, error } = await supabase.rpc('admin_add_vendor_staff', {
        p_user_id: selectedUserId,
        p_vendor_id: vendorIdToUse,
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
        <DialogDescription>
          Select a user and vendor to create a staff assignment relationship.
        </DialogDescription>
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
              <SelectContent className="z-[120] bg-popover shadow-md border max-h-[200px] overflow-y-auto" position="popper">
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
            <Label htmlFor="vendor">Vendor</Label>
            {initialVendorId ? (
              <div className="mt-2 p-3 bg-muted/50 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      {selectedVendor?.name || vendorName || 'Selected Vendor'}
                    </div>
                    {selectedVendor?.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedVendor.description}
                      </div>
                    )}
                  </div>
                  {selectedVendor && (
                    <Badge 
                      variant={selectedVendor.is_active ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {selectedVendor.is_active ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vendor is pre-selected and cannot be changed
                </p>
              </div>
            ) : (
              <>
                <Select 
                  value={selectedVendorId} 
                  onValueChange={setSelectedVendorId}
                  disabled={vendorsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={vendorsLoading ? "Loading vendors..." : "Choose a vendor..."} />
                    {vendorsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </SelectTrigger>
                  <SelectContent className="z-[120] bg-popover shadow-md border max-h-[200px] overflow-y-auto" position="popper">
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
              </>
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
              <SelectContent className="z-[120] bg-popover shadow-md border" position="popper">
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
          <Button onClick={handleAssign} disabled={loading || !selectedUserId || !(selectedVendorId || initialVendorId)}>
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