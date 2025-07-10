import React, { useState, useRef } from 'react';
import { QrCode, Camera, X, Download, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface QRVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: {
    id: string;
    name: string;
    company?: string;
    visit_date: string;
    entry_time?: string;
    visit_purpose: string;
    approval_status: string;
    host_name?: string;
  };
}

export const QRVisitorModal: React.FC<QRVisitorModalProps> = ({
  isOpen,
  onClose,
  visitor
}) => {
  const [qrData, setQrData] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate QR code data when modal opens
  React.useEffect(() => {
    if (isOpen && visitor) {
      generateQRCode();
    }
  }, [isOpen, visitor]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Call the Supabase function to generate QR data
      const { data, error } = await supabase
        .rpc('generate_visitor_qr_data', { visitor_id: visitor.id });

      if (error) throw error;

      // Convert the data to a QR code string
      const qrString = JSON.stringify(data);
      setQrData(qrString);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    // In a real implementation, you'd generate an actual QR code image
    // For now, we'll create a simple text file
    const blob = new Blob([qrData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-qr-${visitor.name.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('QR code data downloaded');
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Visitor QR Code - ${visitor.name}`,
          text: `QR code for visitor: ${visitor.name}`,
          url: window.location.origin
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(qrData);
        toast.success('QR code data copied to clipboard');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast.error('Failed to copy QR code data');
      }
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Visitor QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visitor Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{visitor.name}</h3>
                    {visitor.company && (
                      <p className="text-sm text-muted-foreground">{visitor.company}</p>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(visitor.approval_status)}>
                    {visitor.approval_status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Visit Date:</span>
                    <p>{new Date(visitor.visit_date).toLocaleDateString()}</p>
                  </div>
                  {visitor.entry_time && (
                    <div>
                      <span className="text-muted-foreground">Entry Time:</span>
                      <p>{new Date(visitor.entry_time).toLocaleTimeString()}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Purpose:</span>
                    <p>{visitor.visit_purpose}</p>
                  </div>
                  {visitor.host_name && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Host:</span>
                      <p>{visitor.host_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <div className="text-center">
            {isGenerating ? (
              <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Generating QR code...</p>
                </div>
              </div>
            ) : (
              <div ref={qrRef} className="space-y-4">
                {/* QR Code placeholder - in real app, render actual QR code */}
                <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center space-y-2">
                    <QrCode className="w-16 h-16 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">QR Code</p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      ID: {visitor.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Show this QR code to security for quick check-in</p>
                  <p>Valid for: {new Date(visitor.visit_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isGenerating && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadQR}
                className="flex-1"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={shareQR}
                className="flex-1"
                size="sm"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium mb-1">Instructions:</h4>
            <ul className="space-y-1">
              <li>• Present this QR code at the security desk</li>
              <li>• Keep your ID ready for verification</li>
              <li>• QR code is valid only for the scheduled visit date</li>
              <li>• Contact your host if you need to reschedule</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};