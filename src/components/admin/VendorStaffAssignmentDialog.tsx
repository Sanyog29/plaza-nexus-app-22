import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Vendor {
  id: string;
  name: string;
  description: string;
}

interface VendorStaffAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialUserId?: string;
}

export const VendorStaffAssignmentDialog: React.FC<VendorStaffAssignmentDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialUserId
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId || '');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [loading, setLoading] = useState(false);
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
  }, [initialUserId]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('approval_status', 'approved')
        .order('first_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign User to Vendor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user">Select User</Label>
            <Select 
              value={selectedUserId} 
              onValueChange={setSelectedUserId}
              disabled={!!initialUserId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email}) - {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Select Vendor</Label>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a vendor..." />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                    {vendor.description && (
                      <span className="text-sm text-muted-foreground ml-2">
                        - {vendor.description.substring(0, 50)}...
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <SelectContent>
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
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign to Vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};