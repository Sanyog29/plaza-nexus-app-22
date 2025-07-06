import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Camera, StopCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Badge } from '@/components/ui/badge';

interface QRScannerProps {
  onVisitorScanned: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onVisitorScanned }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not supported on this device');
        return;
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);

        reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            try {
              const qrData = JSON.parse(result.getText());
              setScannedData(qrData);
              handleVisitorCheckIn(qrData);
              stopScanning();
            } catch (err) {
              console.error('Invalid QR code format:', err);
              toast.error('Invalid QR code format');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast.error('Failed to start camera');
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleVisitorCheckIn = async (qrData: any) => {
    if (!qrData.visitor_id) {
      toast.error('Invalid QR code - missing visitor information');
      return;
    }

    setProcessing(true);
    try {
      // Get visitor details
      const { data: visitor, error: visitorError } = await supabase
        .from('visitors')
        .select('*, profiles!visitors_host_id_fkey (first_name, last_name)')
        .eq('id', qrData.visitor_id)
        .single();

      if (visitorError || !visitor) {
        toast.error('Visitor not found');
        return;
      }

      // Check if already checked in
      if (visitor.status === 'checked_in') {
        // Check out the visitor
        const { error: checkoutError } = await supabase
          .from('visitors')
          .update({
            status: 'checked_out',
            check_out_time: new Date().toISOString()
          })
          .eq('id', visitor.id);

        if (checkoutError) {
          toast.error('Failed to check out visitor');
          return;
        }

        // Log the check out
        await supabase.from('visitor_check_logs').insert({
          visitor_id: visitor.id,
          action_type: 'check_out',
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          location: 'Main Entrance'
        });

        toast.success(`${visitor.name} checked out successfully`);
      } else {
        // Check in the visitor
        const { error: checkinError } = await supabase
          .from('visitors')
          .update({
            status: 'checked_in',
            check_in_time: new Date().toISOString()
          })
          .eq('id', visitor.id);

        if (checkinError) {
          toast.error('Failed to check in visitor');
          return;
        }

        // Log the check in
        await supabase.from('visitor_check_logs').insert({
          visitor_id: visitor.id,
          action_type: 'check_in',
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          location: 'Main Entrance'
        });

        toast.success(`${visitor.name} checked in successfully`);
      }

      onVisitorScanned();
    } catch (error) {
      console.error('Error processing visitor:', error);
      toast.error('Failed to process visitor check-in/out');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {!isScanning ? (
              <Button 
                onClick={startScanning} 
                className="bg-plaza-blue hover:bg-blue-700"
                disabled={processing}
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            ) : (
              <Button 
                onClick={stopScanning} 
                variant="destructive"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Scanning
              </Button>
            )}
          </div>

          {isScanning && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-md mx-auto rounded-lg border border-border"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute inset-0 border-2 border-plaza-blue rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-plaza-blue"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-plaza-blue"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-plaza-blue"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-plaza-blue"></div>
              </div>
            </div>
          )}

          {processing && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-plaza-blue">
                <div className="w-4 h-4 border-2 border-plaza-blue border-t-transparent rounded-full animate-spin"></div>
                Processing visitor...
              </div>
            </div>
          )}

          {scannedData && (
            <Card className="bg-green-900/20 border border-green-600">
              <CardContent className="p-4">
                <h4 className="font-medium text-white mb-2">Last Scanned Visitor</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">Name: {scannedData.name}</p>
                  <p className="text-gray-300">Visit Date: {scannedData.visit_date}</p>
                  <p className="text-gray-300">Entry Time: {scannedData.entry_time}</p>
                  <Badge className="bg-green-600 mt-2">
                    {scannedData.approval_status === 'approved' ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-gray-400 text-center">
            <p>Position the QR code within the camera frame</p>
            <p>The system will automatically process check-in/check-out</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};