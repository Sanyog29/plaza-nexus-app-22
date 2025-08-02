import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  Users,
  Wrench,
  Package,
  MapPin
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface QRScanResult {
  type: 'visitor' | 'asset' | 'attendance' | 'maintenance' | 'delivery';
  id: string;
  data: any;
  location?: string;
  status?: string;
}

interface EnhancedQRScannerProps {
  onScanResult: (result: QRScanResult) => void;
  onClose?: () => void;
  supportedTypes?: Array<'visitor' | 'asset' | 'attendance' | 'maintenance' | 'delivery'>;
  autoProcess?: boolean;
}

export const EnhancedQRScanner: React.FC<EnhancedQRScannerProps> = ({
  onScanResult,
  onClose,
  supportedTypes = ['visitor', 'asset', 'attendance', 'maintenance', 'delivery'],
  autoProcess = false
}) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastScanResult, setLastScanResult] = useState<QRScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    setCodeReader(reader);

    return () => {
      reader.reset();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startScanning = async () => {
    if (!codeReader || !videoRef.current) return;

    try {
      setError('');
      setIsScanning(true);

      const videoInputDevices = await navigator.mediaDevices.enumerateDevices();
      const selectedDeviceId = videoInputDevices[0]?.deviceId;

      if (!selectedDeviceId) {
        throw new Error('No camera found');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDeviceId,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });

      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;

      codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, error) => {
        if (result) {
          handleQRCodeDetected(result.getText());
        }
      });

    } catch (err: any) {
      setError(err.message || 'Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const handleQRCodeDetected = async (qrText: string) => {
    if (processing) return;
    
    setProcessing(true);
    try {
      const parsedData = JSON.parse(qrText);
      const scanResult = await validateAndProcessQR(parsedData);
      
      if (scanResult) {
        setLastScanResult(scanResult);
        
        if (autoProcess) {
          await processQRResult(scanResult);
        }
        
        onScanResult(scanResult);
        
        if (autoProcess) {
          stopScanning();
        }
      }
    } catch (error: any) {
      console.error('QR processing error:', error);
      toast({
        title: "Invalid QR Code",
        description: "This QR code is not recognized by the system",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const validateAndProcessQR = async (data: any): Promise<QRScanResult | null> => {
    if (!data.type || !supportedTypes.includes(data.type)) {
      throw new Error('Unsupported QR code type');
    }

    switch (data.type) {
      case 'visitor':
        return await validateVisitorQR(data);
      case 'asset':
        return await validateAssetQR(data);
      case 'attendance':
        return await validateAttendanceQR(data);
      case 'maintenance':
        return await validateMaintenanceQR(data);
      case 'delivery':
        return await validateDeliveryQR(data);
      default:
        throw new Error('Unknown QR code type');
    }
  };

  const validateVisitorQR = async (data: any): Promise<QRScanResult> => {
    const { data: visitor, error } = await supabase
      .from('visitors')
      .select('*')
      .eq('id', data.visitor_id)
      .single();

    if (error || !visitor) {
      throw new Error('Visitor not found');
    }

    return {
      type: 'visitor',
      id: data.visitor_id,
      data: visitor,
      status: visitor.approval_status
    };
  };

  const validateAssetQR = async (data: any): Promise<QRScanResult> => {
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', data.asset_id)
      .single();

    if (error || !asset) {
      throw new Error('Asset not found');
    }

    return {
      type: 'asset',
      id: data.asset_id,
      data: asset,
      location: asset.location,
      status: asset.status
    };
  };

  const validateAttendanceQR = async (data: any): Promise<QRScanResult> => {
    // Validate zone exists
    // Mock zone validation for now
    const zone = { zone_name: data.zone_qr_code, floor: '1' };

    if (error || !zone) {
      throw new Error('Work zone not found');
    }

    return {
      type: 'attendance',
      id: data.zone_qr_code,
      data: zone,
      location: `${zone.zone_name} - Floor ${zone.floor}`
    };
  };

  const validateMaintenanceQR = async (data: any): Promise<QRScanResult> => {
    const { data: request, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('id', data.request_id)
      .single();

    if (error || !request) {
      throw new Error('Maintenance request not found');
    }

    return {
      type: 'maintenance',
      id: data.request_id,
      data: request,
      location: request.location,
      status: request.status
    };
  };

  const validateDeliveryQR = async (data: any): Promise<QRScanResult> => {
    // Mock delivery validation for now
    const delivery = { id: data.delivery_id, status: 'pending' };

    if (error || !delivery) {
      throw new Error('Delivery not found');
    }

    return {
      type: 'delivery',
      id: data.delivery_id,
      data: delivery,
      status: delivery.status
    };
  };

  const processQRResult = async (result: QRScanResult) => {
    switch (result.type) {
      case 'visitor':
        await processVisitorScan(result);
        break;
      case 'attendance':
        await processAttendanceScan(result);
        break;
      default:
        break;
    }
  };

  const processVisitorScan = async (result: QRScanResult) => {
    const now = new Date().toISOString();
    const isCheckingIn = result.data.approval_status === 'checked_out' || !result.data.entry_time;

    try {
      // Update visitor status
      const { error: updateError } = await supabase
        .from('visitors')
        .update({
          approval_status: isCheckingIn ? 'checked_in' : 'checked_out',
          entry_time: isCheckingIn ? now : result.data.entry_time,
          exit_time: !isCheckingIn ? now : null
        })
        .eq('id', result.id);

      if (updateError) throw updateError;

      // Log the check action
      const { error: logError } = await supabase
        .from('visitor_check_logs')
        .insert({
          visitor_id: result.id,
          action_type: isCheckingIn ? 'check_in' : 'check_out',
          checked_by: user?.id,
          notes: `QR scan ${isCheckingIn ? 'check-in' : 'check-out'}`
        });

      if (logError) throw logError;

      toast({
        title: `Visitor ${isCheckingIn ? 'Checked In' : 'Checked Out'}`,
        description: `${result.data.name} has been ${isCheckingIn ? 'checked in' : 'checked out'} successfully`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process visitor scan",
        variant: "destructive"
      });
    }
  };

  const processAttendanceScan = async (result: QRScanResult) => {
    // Check if user already has an active attendance record
    const { data: activeAttendance } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('staff_id', user?.id)
      .is('check_out_time', null)
      .single();

    try {
      if (activeAttendance) {
        // Check out from current zone
        const { error } = await supabase
          .from('staff_attendance')
          .update({ check_out_time: new Date().toISOString() })
          .eq('id', activeAttendance.id);

        if (error) throw error;
      }

      // Check in to new zone
      const { error: checkInError } = await supabase
        .from('staff_attendance')
        .insert({
          staff_id: user?.id,
          zone_qr_code: result.id,
          check_in_time: new Date().toISOString()
        });

      if (checkInError) throw checkInError;

      toast({
        title: "Attendance Recorded",
        description: `Checked in to ${result.data.zone_name}`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record attendance",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visitor': return <Users className="h-4 w-4" />;
      case 'asset': return <Package className="h-4 w-4" />;
      case 'attendance': return <MapPin className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'delivery': return <Package className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'visitor': return 'bg-blue-600';
      case 'asset': return 'bg-purple-600';
      case 'attendance': return 'bg-green-600';
      case 'maintenance': return 'bg-orange-600';
      case 'delivery': return 'bg-indigo-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Scanner
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Supported Types */}
        <div className="flex flex-wrap gap-2">
          {supportedTypes.map(type => (
            <Badge key={type} variant="secondary" className={`${getTypeColor(type)} text-white`}>
              {getTypeIcon(type)}
              <span className="ml-1 capitalize">{type}</span>
            </Badge>
          ))}
        </div>

        {/* Camera Controls */}
        <div className="space-y-4">
          {!isScanning ? (
            <Button onClick={startScanning} className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Start Scanner
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              <Square className="h-4 w-4 mr-2" />
              Stop Scanner
            </Button>
          )}

          {/* Video Feed */}
          {isScanning && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
                style={{ maxHeight: '300px' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ display: 'none' }}
              />
              {processing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-white">
                    <Zap className="h-4 w-4 animate-pulse" />
                    Processing...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Scan Result */}
          {lastScanResult && (
            <div className="p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Last Scan</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {getTypeIcon(lastScanResult.type)}
                  <span className="capitalize">{lastScanResult.type}</span>
                </div>
                <p className="text-muted-foreground">ID: {lastScanResult.id.slice(0, 8)}...</p>
                {lastScanResult.location && (
                  <p className="text-muted-foreground">{lastScanResult.location}</p>
                )}
                {lastScanResult.status && (
                  <Badge variant="outline" className="text-xs">
                    {lastScanResult.status}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};