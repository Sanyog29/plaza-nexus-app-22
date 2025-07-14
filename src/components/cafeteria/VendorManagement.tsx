import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, 
  Plus, 
  Edit, 
  Star, 
  Clock, 
  Users, 
  TrendingUp,
  DollarSign,
  Settings,
  ChefHat
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  logo_url: string;
  is_active: boolean;
  commission_rate: number;
  average_rating: number;
  total_orders: number;
  operating_hours: any;
  contact_phone: string;
  contact_email: string;
  location?: string;
  preparation_time_minutes?: number;
}

export const VendorManagement: React.FC = () => {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Vendor>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendors
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []) as Vendor[];
    },
  });

  // Fetch vendor analytics
  const { data: vendorAnalytics = {} } = useQuery({
    queryKey: ['vendor-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafeteria_orders')
        .select(`
          vendor_id,
          total_amount,
          status,
          created_at
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Process analytics
      const analytics: Record<string, any> = {};
      data.forEach(order => {
        if (!analytics[order.vendor_id]) {
          analytics[order.vendor_id] = {
            totalRevenue: 0,
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
          };
        }
        
        analytics[order.vendor_id].totalOrders++;
        analytics[order.vendor_id].totalRevenue += order.total_amount;
        
        if (order.status === 'completed') {
          analytics[order.vendor_id].completedOrders++;
        } else if (order.status === 'cancelled') {
          analytics[order.vendor_id].cancelledOrders++;
        }
      });

      return analytics;
    },
  });

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setEditForm(vendor);
    setIsEditDialogOpen(true);
  };

  const handleSaveVendor = async () => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update(editForm)
        .eq('id', selectedVendor?.id);

      if (error) throw error;

      toast({
        title: "Vendor Updated",
        description: "Vendor information has been successfully updated",
      });

      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vendor information",
        variant: "destructive",
      });
    }
  };

  const toggleVendorStatus = async (vendorId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: !isActive })
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Vendor Status Updated",
        description: `Vendor ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      });
    }
  };

  const VendorCard: React.FC<{ vendor: Vendor }> = ({ vendor }) => {
    const analytics = vendorAnalytics[vendor.id] || {};
    const completionRate = analytics.totalOrders > 0 
      ? Math.round((analytics.completedOrders / analytics.totalOrders) * 100) 
      : 0;

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {vendor.logo_url && (
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <CardTitle className="text-lg">{vendor.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{vendor.cuisine_type}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{vendor.average_rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({vendor.total_orders} orders)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                {vendor.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditVendor(vendor)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold">₹{analytics.totalRevenue || 0}</div>
              <div className="text-xs text-muted-foreground">Revenue (30d)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{analytics.totalOrders || 0}</div>
              <div className="text-xs text-muted-foreground">Orders (30d)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{completionRate}%</div>
              <div className="text-xs text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{vendor.commission_rate}%</div>
              <div className="text-xs text-muted-foreground">Commission</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Prep time: {vendor.preparation_time_minutes || 15}mins</span>
            </div>
            <Switch
              checked={vendor.is_active}
              onCheckedChange={() => toggleVendorStatus(vendor.id, vendor.is_active)}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const OperatingHoursEditor: React.FC<{ 
    hours: any, 
    onChange: (hours: any) => void 
  }> = ({ hours = {}, onChange }) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    const updateDaySchedule = (day: string, field: string, value: string | boolean) => {
      const updatedHours = {
        ...hours,
        [day]: {
          ...hours[day],
          [field]: value
        }
      };
      onChange(updatedHours);
    };

    return (
      <div className="space-y-3">
        <Label>Operating Hours</Label>
        {days.map(day => (
          <div key={day} className="flex items-center gap-3">
            <div className="w-20 text-sm capitalize">{day}</div>
            <Switch
              checked={!hours[day]?.closed}
              onCheckedChange={(checked) => updateDaySchedule(day, 'closed', !checked)}
            />
            {!hours[day]?.closed && (
              <>
                <Input
                  type="time"
                  value={hours[day]?.open || '09:00'}
                  onChange={(e) => updateDaySchedule(day, 'open', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm">to</span>
                <Input
                  type="time"
                  value={hours[day]?.close || '21:00'}
                  onChange={(e) => updateDaySchedule(day, 'close', e.target.value)}
                  className="w-24"
                />
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.is_active).length;
  const avgRating = vendors.length > 0 
    ? (vendors.reduce((sum, v) => sum + v.average_rating, 0) / vendors.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Vendor Management Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{activeVendors}</div>
              <div className="text-sm text-muted-foreground">Active Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{totalVendors}</div>
              <div className="text-sm text-muted-foreground">Total Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{avgRating}</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">All Vendors</h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        {vendors.map(vendor => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vendor - {selectedVendor?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Vendor Name</Label>
                <Input
                  id="name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="cuisine">Cuisine Type</Label>
                <Input
                  id="cuisine"
                  value={editForm.cuisine_type || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cuisine_type: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commission">Commission Rate (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.commission_rate || 0}
                  onChange={(e) => setEditForm(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                <Input
                  id="prep-time"
                  type="number"
                  min="1"
                  value={editForm.preparation_time_minutes || 15}
                  onChange={(e) => setEditForm(prev => ({ ...prev, preparation_time_minutes: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  value={editForm.contact_phone || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.contact_email || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contact_email: e.target.value }))}
                />
              </div>
            </div>

            <OperatingHoursEditor
              hours={editForm.operating_hours}
              onChange={(hours) => setEditForm(prev => ({ ...prev, operating_hours: hours }))}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveVendor}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};