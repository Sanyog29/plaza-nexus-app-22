import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, User, Building, Phone, MapPin } from 'lucide-react';
import { usePropertyContext } from '@/contexts/PropertyContext';

interface UserInvitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface InvitationData {
  email: string;
  mobile_number: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  phone_number: string;
  office_number: string;
  floor: string;
  property_id: string;
  send_invitation: boolean;
}

const UserInvitationModal: React.FC<UserInvitationModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { availableProperties, currentProperty } = usePropertyContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<InvitationData>({
    email: '',
    mobile_number: '',
    first_name: '',
    last_name: '',
    role: 'tenant_manager',
    department: '',
    phone_number: '',
    office_number: '',
    floor: '',
    property_id: currentProperty?.id || '',
    send_invitation: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that either email or mobile number is provided
    if (!formData.email && !formData.mobile_number) {
      toast({
        title: "Error",
        description: "Either email or mobile number is required",
        variant: "destructive",
      });
      return;
    }

    // Validate property is selected
    if (!formData.property_id) {
      toast({
        title: "Error",
        description: "Property is required for all users",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (formData.send_invitation) {
        // Use RPC function for invitation
        const { data, error } = await supabase.rpc('admin_create_user_invitation', {
          invitation_email: formData.email || null,
          invitation_first_name: formData.first_name,
          invitation_last_name: formData.last_name,
          invitation_role: formData.role,
          invitation_department: formData.department || null,
          invitation_phone_number: formData.mobile_number || formData.phone_number || null,
          invitation_office_number: formData.office_number || null,
          invitation_floor: formData.floor || null,
          invitation_property_id: formData.property_id
        });

        // Type the response properly
        const response = data as { success?: boolean; error?: string; message?: string } | null;

        if (error || response?.error) {
          throw new Error(response?.error || error?.message || 'Failed to send invitation');
        }

        toast({
          title: "Success",
          description: `Invitation sent to ${formData.email || formData.mobile_number}`,
        });
      } else {
        // For direct user creation, we'll still use the Edge Function as it requires admin privileges
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: { 
            ...formData, 
            property_id: formData.property_id,
            send_invitation: false 
          }
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "User created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        email: '',
        mobile_number: '',
        first_name: '',
        last_name: '',
        role: 'tenant_manager',
        department: '',
        phone_number: '',
        office_number: '',
        floor: '',
        property_id: currentProperty?.id || '',
        send_invitation: true
      });

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof InvitationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {formData.send_invitation ? 'Invite New User' : 'Create New User'}
          </DialogTitle>
          <DialogDescription>
            {formData.send_invitation 
              ? 'Send an invitation email to a new user to join the system.'
              : 'Create a new user account directly without sending an invitation.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateFormData('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateFormData('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="pl-10"
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mobile_number"
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) => updateFormData('mobile_number', e.target.value)}
                    className="pl-10"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              * Either email or mobile number is required for login
            </p>

            <div>
              <Label htmlFor="property">Property *</Label>
              <Select 
                value={formData.property_id} 
                onValueChange={(value) => updateFormData('property_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Property assignment is required for all users
              </p>
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="ops_supervisor">Operations Supervisor</SelectItem>
                  <SelectItem value="field_staff">Field Staff</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Additional Information</h3>
            
            <div>
              <Label htmlFor="department">Department</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => updateFormData('department', e.target.value)}
                  className="pl-10"
                  placeholder="e.g., Facilities, Security, Operations"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => updateFormData('phone_number', e.target.value)}
                    className="pl-10"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="office_number">Office Number</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="office_number"
                    value={formData.office_number}
                    onChange={(e) => updateFormData('office_number', e.target.value)}
                    className="pl-10"
                    placeholder="e.g., 301, A-12"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => updateFormData('floor', e.target.value)}
                placeholder="e.g., 3rd Floor, Ground Floor"
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Options</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send_invitation"
                checked={formData.send_invitation}
                onCheckedChange={(checked) => updateFormData('send_invitation', checked)}
              />
              <Label htmlFor="send_invitation" className="text-sm">
                Send invitation email (recommended)
              </Label>
            </div>
            
            {!formData.send_invitation && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  If you don't send an invitation, the user will be created with a random password and will need to reset it to access their account.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : (formData.send_invitation ? 'Send Invitation' : 'Create User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserInvitationModal;