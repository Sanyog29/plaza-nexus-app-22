import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Download, 
  Copy, 
  RefreshCw,
  Users,
  Package,
  MapPin,
  Wrench,
  Building
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface QRGeneratorProps {
  type?: 'visitor' | 'asset' | 'attendance' | 'maintenance' | 'delivery';
  entityId?: string;
  onGenerated?: (qrData: string) => void;
}

export const QRCodeGenerator: React.FC<QRGeneratorProps> = ({
  type: initialType,
  entityId,
  onGenerated
}) => {
  const { user } = useAuth();
  const [qrType, setQrType] = useState(initialType || 'asset');
  const [qrData, setQrData] = useState<string>('');
  const [qrConfig, setQrConfig] = useState({
    size: 256,
    level: 'M' as 'L' | 'M' | 'Q' | 'H',
    includeMargin: true
  });

  // Form data for different QR types
  const [formData, setFormData] = useState({
    // Asset QR
    assetId: entityId || '',
    assetName: '',
    location: '',
    assetType: '',
    
    // Attendance QR
    zoneQrCode: '',
    zoneName: '',
    floor: '',
    
    // Visitor QR
    visitorId: entityId || '',
    
    // Maintenance QR
    requestId: entityId || '',
    
    // Delivery QR
    deliveryId: entityId || '',
    
    // Common
    customData: '',
    expiryDate: '',
    description: ''
  });

  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (qrType) {
      fetchEntities();
    }
  }, [qrType]);

  useEffect(() => {
    if (entityId) {
      generateQRCode();
    }
  }, [entityId, qrType]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      let query;
      switch (qrType) {
        case 'asset':
          query = supabase.from('assets').select('id, asset_name, location, asset_type');
          break;
        case 'attendance':
          // Use existing assets table for zones/locations
          query = supabase.from('assets').select('id, asset_name as zone_name, location, floor').eq('asset_type', 'zone');
          break;
        case 'visitor':
          query = supabase.from('visitors').select('id, name, company, visit_date');
          break;
        case 'maintenance':
          query = supabase.from('maintenance_requests').select('id, title, location, status');
          break;
        case 'delivery':
          // Use existing assets table for delivery points
          query = supabase.from('assets').select('id, asset_name as tracking_number, status').eq('asset_type', 'delivery_point');
          break;
        default:
          return;
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      let qrPayload;

      switch (qrType) {
        case 'asset':
          if (!formData.assetId) {
            toast({
              title: "Missing Asset ID",
              description: "Please select or enter an asset ID",
              variant: "destructive"
            });
            return;
          }
          qrPayload = {
            type: 'asset',
            asset_id: formData.assetId,
            asset_name: formData.assetName,
            location: formData.location,
            asset_type: formData.assetType,
            generated_at: new Date().toISOString(),
            expires_at: formData.expiryDate || null
          };
          break;

        case 'attendance':
          if (!formData.zoneQrCode) {
            toast({
              title: "Missing Zone Code",
              description: "Please enter a zone QR code",
              variant: "destructive"
            });
            return;
          }
          qrPayload = {
            type: 'attendance',
            zone_qr_code: formData.zoneQrCode,
            zone_name: formData.zoneName,
            floor: formData.floor,
            generated_at: new Date().toISOString()
          };
          break;

        case 'visitor':
          if (!formData.visitorId) {
            toast({
              title: "Missing Visitor ID",
              description: "Please select a visitor",
              variant: "destructive"
            });
            return;
          }
          
          // Use the existing Supabase function for visitor QR
          const { data: visitorQrData, error: visitorError } = await supabase.rpc(
            'generate_visitor_qr_data',
            { visitor_id: formData.visitorId }
          );
          
          if (visitorError) throw visitorError;
          qrPayload = visitorQrData;
          break;

        case 'maintenance':
          if (!formData.requestId) {
            toast({
              title: "Missing Request ID",
              description: "Please select a maintenance request",
              variant: "destructive"
            });
            return;
          }
          qrPayload = {
            type: 'maintenance',
            request_id: formData.requestId,
            generated_at: new Date().toISOString()
          };
          break;

        case 'delivery':
          if (!formData.deliveryId) {
            toast({
              title: "Missing Delivery ID",
              description: "Please select a delivery",
              variant: "destructive"
            });
            return;
          }
          qrPayload = {
            type: 'delivery',
            delivery_id: formData.deliveryId,
            generated_at: new Date().toISOString()
          };
          break;

        default:
          qrPayload = {
            type: 'custom',
            data: formData.customData,
            generated_at: new Date().toISOString()
          };
      }

      const qrString = JSON.stringify(qrPayload);
      setQrData(qrString);
      
      if (onGenerated) {
        onGenerated(qrString);
      }

      toast({
        title: "QR Code Generated",
        description: "QR code has been generated successfully",
      });

    } catch (error: any) {
      toast({
        title: "Generation Error",
        description: error.message || "Failed to generate QR code",
        variant: "destructive"
      });
    }
  };

  const downloadQRCode = () => {
    const svg = document.querySelector('.qr-code-svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = qrConfig.size;
      canvas.height = qrConfig.size;
      ctx?.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `qr-${qrType}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(data);
  };

  const copyQRData = () => {
    navigator.clipboard.writeText(qrData);
    toast({
      title: "Copied",
      description: "QR data copied to clipboard",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visitor': return <Users className="h-4 w-4" />;
      case 'asset': return <Package className="h-4 w-4" />;
      case 'attendance': return <MapPin className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'delivery': return <Building className="h-4 w-4" />;
      default: return <QrCode className="h-4 w-4" />;
    }
  };

  const renderFormFields = () => {
    switch (qrType) {
      case 'asset':
        return (
          <div className="space-y-4">
            <div>
              <Label>Asset</Label>
              <Select 
                value={formData.assetId} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, assetId: value }));
                  const asset = entities.find(e => e.id === value);
                  if (asset) {
                    setFormData(prev => ({
                      ...prev,
                      assetName: asset.asset_name,
                      location: asset.location,
                      assetType: asset.asset_type
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.asset_name} - {asset.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.assetId && (
              <>
                <Input
                  placeholder="Asset Name"
                  value={formData.assetName}
                  onChange={(e) => setFormData(prev => ({ ...prev, assetName: e.target.value }))}
                />
                <Input
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
                <Input
                  placeholder="Asset Type"
                  value={formData.assetType}
                  onChange={(e) => setFormData(prev => ({ ...prev, assetType: e.target.value }))}
                />
              </>
            )}
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-4">
            <div>
              <Label>Work Zone</Label>
              <Select 
                value={formData.zoneQrCode} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, zoneQrCode: value }));
                  const zone = entities.find(e => e.id === value);
                  if (zone) {
                    setFormData(prev => ({
                      ...prev,
                      zoneName: zone.zone_name,
                      floor: zone.floor
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work zone" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map(zone => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.zone_name} - Floor {zone.floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Zone Name"
              value={formData.zoneName}
              onChange={(e) => setFormData(prev => ({ ...prev, zoneName: e.target.value }))}
            />
            <Input
              placeholder="Floor"
              value={formData.floor}
              onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
            />
          </div>
        );

      case 'visitor':
        return (
          <div>
            <Label>Visitor</Label>
            <Select 
              value={formData.visitorId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, visitorId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visitor" />
              </SelectTrigger>
              <SelectContent>
                {entities.map(visitor => (
                  <SelectItem key={visitor.id} value={visitor.id}>
                    {visitor.name} - {visitor.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'maintenance':
        return (
          <div>
            <Label>Maintenance Request</Label>
            <Select 
              value={formData.requestId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, requestId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select request" />
              </SelectTrigger>
              <SelectContent>
                {entities.map(request => (
                  <SelectItem key={request.id} value={request.id}>
                    {request.title} - {request.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'delivery':
        return (
          <div>
            <Label>Delivery</Label>
            <Select 
              value={formData.deliveryId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery" />
              </SelectTrigger>
              <SelectContent>
                {entities.map(delivery => (
                  <SelectItem key={delivery.id} value={delivery.id}>
                    {delivery.tracking_number} - {delivery.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div>
            <Label>Custom Data</Label>
            <Textarea
              placeholder="Enter custom JSON data"
              value={formData.customData}
              onChange={(e) => setFormData(prev => ({ ...prev, customData: e.target.value }))}
            />
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Type Selection */}
        <div className="space-y-2">
          <Label>QR Code Type</Label>
          <div className="flex flex-wrap gap-2">
            {['visitor', 'asset', 'attendance', 'maintenance', 'delivery'].map(type => (
              <Button
                key={type}
                variant={qrType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQrType(type as any)}
                className="flex items-center gap-2"
              >
                {getTypeIcon(type)}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {renderFormFields()}
          
          {/* Common Fields */}
          <div className="space-y-4">
            <div>
              <Label>Expiry Date (Optional)</Label>
              <Input
                type="datetime-local"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Add a description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* QR Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Size</Label>
            <Select 
              value={qrConfig.size.toString()} 
              onValueChange={(value) => setQrConfig(prev => ({ ...prev, size: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="128">128px</SelectItem>
                <SelectItem value="256">256px</SelectItem>
                <SelectItem value="512">512px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Error Correction</Label>
            <Select 
              value={qrConfig.level} 
              onValueChange={(value: any) => setQrConfig(prev => ({ ...prev, level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Low</SelectItem>
                <SelectItem value="M">Medium</SelectItem>
                <SelectItem value="Q">Quartile</SelectItem>
                <SelectItem value="H">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={generateQRCode} className="w-full" disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate QR Code
        </Button>

        {/* QR Code Display */}
        {qrData && (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4 p-4 bg-background/50 rounded-lg">
              <QRCodeSVG
                value={qrData}
                size={qrConfig.size}
                level={qrConfig.level}
                includeMargin={qrConfig.includeMargin}
                className="qr-code-svg border rounded"
              />
              
              <div className="flex gap-2">
                <Button onClick={downloadQRCode} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={copyQRData} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Data
                </Button>
              </div>
            </div>

            {/* QR Data Preview */}
            <div className="space-y-2">
              <Label>QR Data Preview</Label>
              <div className="p-3 bg-muted rounded text-sm font-mono overflow-x-auto">
                {JSON.stringify(JSON.parse(qrData), null, 2)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};