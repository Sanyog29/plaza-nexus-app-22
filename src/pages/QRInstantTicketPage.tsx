
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QRInstantTicket } from '@/components/tickets/QRInstantTicket';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const QRInstantTicketPage = () => {
  const navigate = useNavigate();

  const handleTicketCreated = (ticketId: string) => {
    // Navigate to ticket details or dashboard
    navigate(`/dashboard`);
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-md">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleClose} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-center mb-2">Quick Ticket</h1>
          <p className="text-muted-foreground text-center">
            Scan a QR code or create a ticket instantly
          </p>
        </div>
        
        <QRInstantTicket 
          onTicketCreated={handleTicketCreated}
          onClose={handleClose}
        />
      </div>
    </div>
  );
};

export default QRInstantTicketPage;
