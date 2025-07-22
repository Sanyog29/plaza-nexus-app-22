
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Camera, 
  MapPin, 
  AlertCircle, 
  CheckCircle,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface QRInstantTicketProps {
  onTicketCreated?: (ticketId: string) => void;
  onClose?: () => void;
}

export const QRInstantTicket: React.FC<QRInstantTicketProps> = ({ 
  onTicketCreated, 
  onClose 
}) => {
  const { user, permissions } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [ticketData, setTicketData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium' as 'urgent' | 'high' | 'medium' | 'low',
    location: '',
    asset_id: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleQRScan = () => {
    setIsScanning(true);
    
    // For demo purposes, simulate QR scan result
    // In production, you'd integrate with a QR scanner library
    setTimeout(() => {
      const mockQRData = {
        type: 'asset',
        id: 'HVAC-001',
        location: 'Floor 3, Conference Room A',
        category: 'hvac'
      };
      
      setScannedData(JSON.stringify(mockQRData));
      setTicketData(prev => ({
        ...prev,
        asset_id: mockQRData.id,
        location: mockQRData.location,
        category_id: mockQRData.category,
        title: `Issue with ${mockQRData.id}`
      }));
      
      setIsScanning(false);
      toast({
        title: "QR Code Scanned",
        description: `Asset ${mockQRData.id} detected`,
      });
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!ticketData.title || !ticketData.description || !ticketData.category_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          title: ticketData.title,
          description: ticketData.description,
          category_id: ticketData.category_id,
          priority: ticketData.priority,
          location: ticketData.location,
          asset_id: ticketData.asset_id || null,
          reported_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ticket Created",
        description: `Ticket #${data.id.slice(0, 8)} has been created successfully`,
      });

      if (onTicketCreated) {
        onTicketCreated(data.id);
      }

      // Reset form
      setTicketData({
        title: '',
        description: '',
        category_id: '',
        priority: 'medium',
        location: '',
        asset_id: '',
      });
      setScannedData('');

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permissions.can_use_qr_instant_ticket) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            You don't have permission to create instant tickets.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Instant Ticket
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Scanner Section */}
        <div className="space-y-2">
          <Label>Scan Asset QR Code (Optional)</Label>
          <Button
            type="button"
            variant="outline"
            onClick={handleQRScan}
            disabled={isScanning}
            className="w-full"
          >
            <Camera className="h-4 w-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Scan QR Code'}
          </Button>
          {scannedData && (
            <Badge variant="secondary" className="w-full justify-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Asset Detected
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              value={ticketData.title}
              onChange={(e) => setTicketData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select 
              value={ticketData.category_id} 
              onValueChange={(value) => setTicketData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select 
              value={ticketData.priority} 
              onValueChange={(value: any) => setTicketData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={ticketData.location}
                onChange={(e) => setTicketData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Floor, room, or area"
                className="pl-10"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={ticketData.description}
              onChange={(e) => setTicketData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the issue"
              rows={3}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
