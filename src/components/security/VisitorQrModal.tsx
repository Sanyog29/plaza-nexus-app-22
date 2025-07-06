
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Download, User, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface VisitorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: any;
}

const VisitorQrModal: React.FC<VisitorQrModalProps> = ({ isOpen, onClose, visitor }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visitor && isOpen) {
      generateQrCode();
    }
  }, [visitor, isOpen]);

  const generateQrCode = async () => {
    if (!visitor) return;
    
    setLoading(true);
    try {
      // Get QR code data from Supabase function
      const { data, error } = await supabase.rpc('generate_visitor_qr_data', {
        visitor_id: visitor.id
      });

      if (error) throw error;

      // Generate QR code image
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(data), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
      // Fallback to simple QR code
      try {
        const fallbackData = {
          visitor_id: visitor.id,
          name: visitor.name,
          visit_date: visitor.visit_date,
          approval_status: visitor.approval_status
        };
        const fallbackQr = await QRCode.toDataURL(JSON.stringify(fallbackData));
        setQrCodeUrl(fallbackQr);
      } catch (fallbackError) {
        console.error('Fallback QR generation failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const downloadQrCode = () => {
    if (!qrCodeUrl || !visitor) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `visitor-qr-${visitor.name.replace(/\s+/g, '-')}-${visitor.visit_date}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded');
  };

  if (!visitor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-white sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Visitor QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center">
          <div className="bg-white p-3 rounded-lg mb-4 relative">
            {loading ? (
              <div className="w-48 h-48 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Visitor QR Code" 
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                Failed to generate QR code
              </div>
            )}
          </div>
          
          <div className="w-full space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <User size={16} className="text-plaza-blue" />
              <div>
                <p className="text-sm font-medium text-gray-300">Visitor Name</p>
                <p className="text-base text-white">{visitor.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-plaza-blue" />
              <div>
                <p className="text-sm font-medium text-gray-300">Date</p>
                <p className="text-base text-white">{format(new Date(visitor.visit_date), 'PPP')}</p>
              </div>
            </div>
            
            {visitor.entry_time && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-plaza-blue" />
                <div>
                  <p className="text-sm font-medium text-gray-300">Entry Time</p>
                  <p className="text-base text-white">{visitor.entry_time}</p>
                </div>
              </div>
            )}
            
            {visitor.contact_number && (
              <div className="flex items-center gap-2">
                <span className="text-plaza-blue">📞</span>
                <div>
                  <p className="text-sm font-medium text-gray-300">Contact</p>
                  <p className="text-base text-white">{visitor.contact_number}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 w-full">
            <Button onClick={downloadQrCode} variant="outline" className="flex-1" disabled={!qrCodeUrl || loading}>
              <Download size={16} className="mr-2" />
              Download QR Code
            </Button>
            <Button onClick={generateQrCode} variant="secondary" disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Share this QR code with your visitor. They'll need to present it at the security desk for entry.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisitorQrModal;
