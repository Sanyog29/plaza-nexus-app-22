
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Download, User, Car } from 'lucide-react';
import { format } from 'date-fns';

interface VisitorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: any;
}

const VisitorQrModal: React.FC<VisitorQrModalProps> = ({ isOpen, onClose, visitor }) => {
  if (!visitor) return null;

  // This is a placeholder for a real QR code - in a real app, we'd generate this dynamically
  const qrCodeUrl = "/placeholder.svg";
  
  const downloadQrCode = () => {
    // In a real app, we'd implement actual download logic here
    console.log("Downloading QR code for visitor:", visitor.name);
    // Mock download
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `visitor-qr-${visitor.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-white sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Visitor QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center">
          <div className="bg-white p-3 rounded-lg mb-4">
            <img 
              src={qrCodeUrl} 
              alt="Visitor QR Code" 
              className="w-48 h-48 object-contain"
            />
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
          
          <Button onClick={downloadQrCode} variant="outline" className="w-full">
            <Download size={16} className="mr-2" />
            Download QR Code
          </Button>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Share this QR code with your visitor. They'll need to present it at the security desk for entry.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisitorQrModal;
