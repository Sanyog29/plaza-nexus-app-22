import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  ToggleLeft, 
  ToggleRight, 
  Star, 
  MapPin,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';

const AdminVendorManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_menu_items(count),
          commission_records(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const toggleVendorStatus = useMutation({
    mutationFn: async ({ vendorId, isActive }: { vendorId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', vendorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast({
        title: "Vendor Updated",
        description: "Vendor status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vendor status.",
        variant: "destructive",
      });
    },
  });

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMenuItemsCount = (vendor: any) => {
    return vendor.vendor_menu_items?.[0]?.count || 0;
  };

  const getCommissionCount = (vendor: any) => {
    return vendor.commission_records?.[0]?.count || 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendor Management</h2>
          <p className="text-muted-foreground">Manage food vendors and their operations</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-muted-foreground">Vendor onboarding form coming soon...</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search vendors by name or cuisine type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendor List */}
      <div className="grid gap-4">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {vendor.logo_url && (
                    <img 
                      src={vendor.logo_url} 
                      alt={vendor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <CardTitle className="text-xl text-card-foreground">{vendor.name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span>{vendor.cuisine_type}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {vendor.stall_location}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                    {vendor.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {vendor.average_rating > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {vendor.average_rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Vendor Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{getMenuItemsCount(vendor)}</p>
                  <p className="text-sm text-muted-foreground">Menu Items</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{vendor.total_orders || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{vendor.commission_rate}%</p>
                  <p className="text-sm text-muted-foreground">Commission</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{getCommissionCount(vendor)}</p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {vendor.contact_email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {vendor.contact_email}
                  </div>
                )}
                {vendor.contact_phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {vendor.contact_phone}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
                
                <Button variant="outline" size="sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Financials
                </Button>
                
                <Button
                  variant={vendor.is_active ? "destructive" : "default"}
                  size="sm"
                  onClick={() => toggleVendorStatus.mutate({
                    vendorId: vendor.id,
                    isActive: vendor.is_active
                  })}
                  disabled={toggleVendorStatus.isPending}
                >
                  {vendor.is_active ? (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Vendors Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'No vendors match your search criteria.' : 'Get started by adding your first vendor.'}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Vendor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminVendorManagement;