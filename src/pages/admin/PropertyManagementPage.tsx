import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building2, Edit, Users, MapPin, UserCheck, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AssignApproverDialog } from '@/components/property/AssignApproverDialog';
import { usePropertyApprovers } from '@/hooks/usePropertyApprovers';

interface Property {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  property_type?: string;
  total_units?: number;
  total_floors?: number;
  status: string;
  created_at: string;
}

const PropertyManagementPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isApproverDialogOpen, setIsApproverDialogOpen] = useState(false);
  const [selectedPropertyForApprover, setSelectedPropertyForApprover] = useState<Property | null>(null);
  const [approvers, setApprovers] = useState<Record<string, any>>({});
  const { getPropertyApprover } = usePropertyApprovers();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: '',
    property_type: 'mixed',
    total_units: '',
    total_floors: '',
  });

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
      
      // Fetch approvers for all properties
      await fetchApprovers();
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApprovers = async () => {
    try {
      const { data: approverData } = await supabase
        .from('property_approvers')
        .select('*')
        .eq('is_active', true);

      if (!approverData) return;

      // Fetch profiles for all approvers
      const userIds = approverData.map(a => a.approver_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);

      // Map approvers by property_id with profile data
      const approverMap: Record<string, any> = {};
      approverData.forEach(approver => {
        const profile = profiles?.find(p => p.id === approver.approver_user_id);
        approverMap[approver.property_id] = {
          ...approver,
          approver: profile
        };
      });
      
      setApprovers(approverMap);
    } catch (error) {
      console.error('Error fetching approvers:', error);
    }
  };

  const openAssignApproverDialog = (property: Property) => {
    setSelectedPropertyForApprover(property);
    setIsApproverDialogOpen(true);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreateProperty = async () => {
    try {
      const { error } = await supabase.from('properties').insert({
        name: formData.name,
        code: formData.code.toUpperCase(),
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        property_type: formData.property_type,
        total_units: formData.total_units ? parseInt(formData.total_units) : null,
        total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
        status: 'active',
      });

      if (error) throw error;

      toast.success('Property created successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        country: '',
        property_type: 'mixed',
        total_units: '',
        total_floors: '',
      });
      fetchProperties();
    } catch (error: any) {
      console.error('Error creating property:', error);
      toast.error(error.message || 'Failed to create property');
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      code: property.code,
      address: property.address || '',
      city: property.city || '',
      state: property.state || '',
      country: property.country || '',
      property_type: property.property_type || 'mixed',
      total_units: property.total_units?.toString() || '',
      total_floors: property.total_floors?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProperty = async () => {
    if (!editingProperty) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({
          name: formData.name,
          code: formData.code.toUpperCase(),
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || null,
          property_type: formData.property_type,
          total_units: formData.total_units ? parseInt(formData.total_units) : null,
          total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
        })
        .eq('id', editingProperty.id);

      if (error) throw error;

      toast.success('Property updated successfully');
      setIsEditDialogOpen(false);
      setEditingProperty(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        country: '',
        property_type: 'mixed',
        total_units: '',
        total_floors: '',
      });
      fetchProperties();
    } catch (error: any) {
      console.error('Error updating property:', error);
      toast.error(error.message || 'Failed to update property');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6 rounded-lg">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Property Management</h1>
            <p className="text-muted-foreground mt-2">Manage all properties across your organization</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Property</DialogTitle>
                <DialogDescription>Add a new property to your organization</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Downtown Plaza"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Property Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="DTP1"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Property Type</Label>
                  <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_units">Total Units</Label>
                  <Input
                    id="total_units"
                    type="number"
                    value={formData.total_units}
                    onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_floors">Total Floors</Label>
                  <Input
                    id="total_floors"
                    type="number"
                    value={formData.total_floors}
                    onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProperty} disabled={!formData.name || !formData.code}>
                  Create Property
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Property Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>Update property information</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Property Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Downtown Plaza"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Property Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="DTP1"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State/Province</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="USA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-property_type">Property Type</Label>
                <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-total_units">Total Units</Label>
                <Input
                  id="edit-total_units"
                  type="number"
                  value={formData.total_units}
                  onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-total_floors">Total Floors</Label>
                <Input
                  id="edit-total_floors"
                  type="number"
                  value={formData.total_floors}
                  onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProperty} disabled={!formData.name || !formData.code}>
                Update Property
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{property.name}</CardTitle>
                      <CardDescription>Code: {property.code}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditProperty(property)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                      {property.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{property.address}, {property.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{property.total_units || 0} units</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{property.total_floors || 0} floors</span>
                  </div>
                </div>
                
                {/* Approver Section */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {property.property_type || 'mixed'}
                    </Badge>
                    {approvers[property.id] ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Approver Set
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        No Approver
                      </Badge>
                    )}
                  </div>
                  
                  {approvers[property.id] && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={approvers[property.id].approver?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {approvers[property.id].approver?.first_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {approvers[property.id].approver?.first_name} {approvers[property.id].approver?.last_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {approvers[property.id].approver_role_title}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => openAssignApproverDialog(property)}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    {approvers[property.id] ? 'Change Approver' : 'Assign Approver'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {properties.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first property
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Property
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Assign Approver Dialog */}
        <AssignApproverDialog
          open={isApproverDialogOpen}
          onOpenChange={(open) => {
            setIsApproverDialogOpen(open);
            if (!open) {
              setSelectedPropertyForApprover(null);
              fetchApprovers();
            }
          }}
          property={selectedPropertyForApprover}
          currentApproverId={selectedPropertyForApprover ? approvers[selectedPropertyForApprover.id]?.approver_user_id : undefined}
        />
      </div>
    </div>
  );
};

export default PropertyManagementPage;