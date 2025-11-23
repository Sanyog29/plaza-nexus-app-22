import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  CalendarIcon, 
  Building, 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Asset {
  id: string;
  property_id: string;
  asset_name: string;
  asset_type: string;
  location: string;
  floor: string;
  zone?: string;
  brand?: string;
  model_number?: string;
  serial_number?: string;
  status: string;
  purchase_date?: string;
  installation_date?: string;
  warranty_expiry?: string;
  last_service_date?: string;
  next_service_due?: string;
  amc_vendor?: string;
  amc_start_date?: string;
  amc_end_date?: string;
  amc_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AssetManagementProps {
  propertyId?: string | null;
}

export function AssetManagement({ propertyId }: AssetManagementProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { toast } = useToast();

  const [newAsset, setNewAsset] = useState({
    asset_name: '',
    asset_type: '',
    location: '',
    floor: '',
    zone: '',
    brand: '',
    model_number: '',
    serial_number: '',
    status: 'operational',
    purchase_date: '',
    installation_date: '',
    warranty_expiry: '',
    amc_vendor: '',
    amc_start_date: '',
    amc_end_date: '',
    amc_cost: '',
    notes: ''
  });

  useEffect(() => {
    fetchAssets();
  }, [propertyId]);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, statusFilter]);

  const fetchAssets = async () => {
    try {
      // RLS policies now handle property filtering automatically
      // No need for manual property filtering
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch assets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    setFilteredAssets(filtered);
  };

  const handleAddAsset = async () => {
    try {
      // CRITICAL: Require propertyId for new assets
      if (!propertyId) {
        toast({
          title: 'Error',
          description: 'Please select a property before adding an asset',
          variant: 'destructive'
        });
        return;
      }

      const assetData = {
        ...newAsset,
        property_id: propertyId,
        amc_cost: newAsset.amc_cost ? parseFloat(newAsset.amc_cost) : null,
        purchase_date: newAsset.purchase_date || null,
        installation_date: newAsset.installation_date || null,
        warranty_expiry: newAsset.warranty_expiry || null,
        amc_start_date: newAsset.amc_start_date || null,
        amc_end_date: newAsset.amc_end_date || null
      };

      const { error } = await supabase
        .from('assets')
        .insert([assetData]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Asset added successfully'
      });

      setIsAddDialogOpen(false);
      setNewAsset({
        asset_name: '',
        asset_type: '',
        location: '',
        floor: '',
        zone: '',
        brand: '',
        model_number: '',
        serial_number: '',
        status: 'operational',
        purchase_date: '',
        installation_date: '',
        warranty_expiry: '',
        amc_vendor: '',
        amc_start_date: '',
        amc_end_date: '',
        amc_cost: '',
        notes: ''
      });
      fetchAssets();
    } catch (error) {
      console.error('Error adding asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to add asset',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-yellow-600" />;
      case 'out_of_order': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'retired': return <Clock className="h-4 w-4 text-muted-foreground" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'default';
      case 'maintenance': return 'secondary';
      case 'out_of_order': return 'destructive';
      case 'retired': return 'outline';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="out_of_order">Out of Order</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  Enter the details for the new asset
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset_name">Asset Name *</Label>
                    <Input
                      id="asset_name"
                      value={newAsset.asset_name}
                      onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                      placeholder="Enter asset name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asset_type">Asset Type *</Label>
                    <Select
                      value={newAsset.asset_type}
                      onValueChange={(value) => setNewAsset({ ...newAsset, asset_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HVAC">HVAC</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                        <SelectItem value="Plumbing">Plumbing</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                        <SelectItem value="Fire Safety">Fire Safety</SelectItem>
                        <SelectItem value="Elevator">Elevator</SelectItem>
                        <SelectItem value="IT Equipment">IT Equipment</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={newAsset.location}
                      onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                      placeholder="Building/Area"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor *</Label>
                    <Input
                      id="floor"
                      value={newAsset.floor}
                      onChange={(e) => setNewAsset({ ...newAsset, floor: e.target.value })}
                      placeholder="Floor number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone</Label>
                    <Input
                      id="zone"
                      value={newAsset.zone}
                      onChange={(e) => setNewAsset({ ...newAsset, zone: e.target.value })}
                      placeholder="Zone/Section"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={newAsset.brand}
                      onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                      placeholder="Manufacturer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model_number">Model Number</Label>
                    <Input
                      id="model_number"
                      value={newAsset.model_number}
                      onChange={(e) => setNewAsset({ ...newAsset, model_number: e.target.value })}
                      placeholder="Model number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Serial Number</Label>
                    <Input
                      id="serial_number"
                      value={newAsset.serial_number}
                      onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                      placeholder="Serial number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newAsset.notes}
                    onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAsset}>
                  Add Asset
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Assets table */}
      <Card>
        <CardHeader>
          <CardTitle>Assets ({filteredAssets.length})</CardTitle>
          <CardDescription>
            Manage all facility assets and equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Service</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{asset.asset_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.brand} {asset.model_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{asset.asset_type}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{asset.location}</div>
                        <div className="text-sm text-muted-foreground">
                          Floor {asset.floor} {asset.zone && `• ${asset.zone}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(asset.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(asset.status)}
                        {asset.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.last_service_date ? 
                        format(new Date(asset.last_service_date), 'MMM dd, yyyy') : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {asset.next_service_due ? 
                        format(new Date(asset.next_service_due), 'MMM dd, yyyy') : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredAssets.length === 0 && (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' ? 'No assets match your filters' : 'No assets found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}