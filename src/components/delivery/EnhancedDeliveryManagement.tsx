import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchTransition, useFilterTransition } from '@/hooks/useTransitionState';
import { 
  Package, 
  Search, 
  QrCode, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  MapPin,
  Filter,
  Plus,
  Bell,
  Calendar,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface Delivery {
  id: string;
  recipient_name: string;
  recipient_company?: string;
  recipient_contact?: string;
  package_description?: string;
  package_type?: string;
  delivery_service?: string;
  tracking_number?: string;
  delivery_date: string;
  delivery_time?: string;
  status: string;
  pickup_code?: string;
  pickup_at?: string;
  pickup_by?: string;
  sender_name?: string;
  sender_company?: string;
  special_instructions?: string;
  photo_urls?: string[];
  created_at: string;
}

export const EnhancedDeliveryManagement = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useSearchTransition('');
  const [statusFilter, setStatusFilter] = useFilterTransition<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const { toast } = useToast();

  const [newDelivery, setNewDelivery] = useState({
    recipient_name: '',
    recipient_company: '',
    recipient_contact: '',
    package_description: '',
    package_type: 'document',
    delivery_service: '',
    tracking_number: '',
    sender_name: '',
    sender_company: '',
    special_instructions: '',
  });

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to load deliveries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDelivery = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .insert([{
          ...newDelivery,
          delivery_date: new Date().toISOString().split('T')[0],
          delivery_time: new Date().toISOString().split('T')[1].split('.')[0],
          status: 'received',
        }])
        .select();

      if (error) throw error;

      setDeliveries([...deliveries, ...(data || [])]);
      setShowAddModal(false);
      setNewDelivery({
        recipient_name: '',
        recipient_company: '',
        recipient_contact: '',
        package_description: '',
        package_type: 'document',
        delivery_service: '',
        tracking_number: '',
        sender_name: '',
        sender_company: '',
        special_instructions: '',
      });

      toast({
        title: "Success",
        description: "Delivery logged successfully",
      });
    } catch (error) {
      console.error('Error adding delivery:', error);
      toast({
        title: "Error",
        description: "Failed to log delivery",
        variant: "destructive",
      });
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'picked_up') {
        updateData.pickup_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) throw error;

      setDeliveries(deliveries.map(delivery => 
        delivery.id === deliveryId 
          ? { ...delivery, ...updateData }
          : delivery
      ));

      toast({
        title: "Success",
        description: "Delivery status updated successfully",
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    }
  };

  const generateQRData = (delivery: Delivery) => {
    return JSON.stringify({
      id: delivery.id,
      recipient: delivery.recipient_name,
      pickup_code: delivery.pickup_code,
      package: delivery.package_description,
    });
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.pickup_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800 border-green-200';
      case 'picked_up': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'returned': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return <Package className="h-4 w-4" />;
      case 'ready_for_pickup': return <CheckCircle className="h-4 w-4" />;
      case 'picked_up': return <Truck className="h-4 w-4" />;
      case 'returned': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const stats = {
    total: deliveries.length,
    received: deliveries.filter(d => d.status === 'received').length,
    ready: deliveries.filter(d => d.status === 'ready_for_pickup').length,
    picked_up: deliveries.filter(d => d.status === 'picked_up').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Delivery Management</h2>
          <p className="text-muted-foreground">Track and manage package deliveries</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log New Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Delivery</DialogTitle>
              <DialogDescription>
                Enter the details of the incoming package
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Recipient Name *</Label>
                  <Input
                    id="recipient_name"
                    value={newDelivery.recipient_name}
                    onChange={(e) => setNewDelivery({...newDelivery, recipient_name: e.target.value})}
                    placeholder="Enter recipient name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient_company">Company</Label>
                  <Input
                    id="recipient_company"
                    value={newDelivery.recipient_company}
                    onChange={(e) => setNewDelivery({...newDelivery, recipient_company: e.target.value})}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_contact">Contact</Label>
                  <Input
                    id="recipient_contact"
                    value={newDelivery.recipient_contact}
                    onChange={(e) => setNewDelivery({...newDelivery, recipient_contact: e.target.value})}
                    placeholder="Phone or email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package_type">Package Type</Label>
                  <Select 
                    value={newDelivery.package_type} 
                    onValueChange={(value) => setNewDelivery({...newDelivery, package_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="package">Package</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="parcel">Parcel</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package_description">Package Description</Label>
                <Textarea
                  id="package_description"
                  value={newDelivery.package_description}
                  onChange={(e) => setNewDelivery({...newDelivery, package_description: e.target.value})}
                  placeholder="Describe the package contents"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_service">Delivery Service</Label>
                  <Input
                    id="delivery_service"
                    value={newDelivery.delivery_service}
                    onChange={(e) => setNewDelivery({...newDelivery, delivery_service: e.target.value})}
                    placeholder="FedEx, UPS, DHL, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking_number">Tracking Number</Label>
                  <Input
                    id="tracking_number"
                    value={newDelivery.tracking_number}
                    onChange={(e) => setNewDelivery({...newDelivery, tracking_number: e.target.value})}
                    placeholder="Enter tracking number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sender_name">Sender Name</Label>
                  <Input
                    id="sender_name"
                    value={newDelivery.sender_name}
                    onChange={(e) => setNewDelivery({...newDelivery, sender_name: e.target.value})}
                    placeholder="Sender name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender_company">Sender Company</Label>
                  <Input
                    id="sender_company"
                    value={newDelivery.sender_company}
                    onChange={(e) => setNewDelivery({...newDelivery, sender_company: e.target.value})}
                    placeholder="Sender company"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_instructions">Special Instructions</Label>
                <Textarea
                  id="special_instructions"
                  value={newDelivery.special_instructions}
                  onChange={(e) => setNewDelivery({...newDelivery, special_instructions: e.target.value})}
                  placeholder="Any special handling instructions"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={addDelivery} disabled={!newDelivery.recipient_name}>
                  Log Delivery
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.received}</div>
                <p className="text-sm text-muted-foreground">Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.ready}</div>
                <p className="text-sm text-muted-foreground">Ready for Pickup</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">{stats.picked_up}</div>
                <p className="text-sm text-muted-foreground">Picked Up</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by recipient, tracking number, or pickup code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {filteredDeliveries.map((delivery) => (
          <Card key={delivery.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(delivery.status)}
                      <h3 className="font-semibold">{delivery.recipient_name}</h3>
                    </div>
                    <Badge className={getStatusColor(delivery.status)}>
                      {delivery.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {delivery.pickup_code && (
                      <Badge variant="outline" className="font-mono">
                        {delivery.pickup_code}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">Package Details</div>
                      <div>{delivery.package_description || 'No description'}</div>
                      <div className="text-muted-foreground">{delivery.package_type}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Delivery Info</div>
                      <div>{delivery.delivery_service || 'Unknown service'}</div>
                      {delivery.tracking_number && (
                        <div className="text-muted-foreground font-mono">{delivery.tracking_number}</div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Received</div>
                      <div>{new Date(delivery.created_at).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {new Date(delivery.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {delivery.special_instructions && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-amber-800 mb-1">Special Instructions</div>
                      <div className="text-sm text-amber-700">{delivery.special_instructions}</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {delivery.status === 'received' && (
                    <Button 
                      size="sm" 
                      onClick={() => updateDeliveryStatus(delivery.id, 'ready_for_pickup')}
                    >
                      Mark Ready
                    </Button>
                  )}
                  {delivery.status === 'ready_for_pickup' && (
                    <Button 
                      size="sm" 
                      onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                    >
                      Mark Picked Up
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setShowQRModal(true);
                    }}
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    QR Code
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4 mr-1" />
                    Notify
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDeliveries.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <div className="text-lg font-medium">No deliveries found</div>
          <p className="text-sm text-muted-foreground mt-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Log your first delivery to get started'
            }
          </p>
        </div>
      )}

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Package QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code for quick package pickup
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={generateQRData(selectedDelivery)}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
              <div className="text-center space-y-2">
                <div className="font-medium">{selectedDelivery.recipient_name}</div>
                {selectedDelivery.pickup_code && (
                  <div className="font-mono text-lg font-bold">{selectedDelivery.pickup_code}</div>
                )}
                <div className="text-sm text-muted-foreground">
                  {selectedDelivery.package_description}
                </div>
              </div>
              <Button onClick={() => setShowQRModal(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};