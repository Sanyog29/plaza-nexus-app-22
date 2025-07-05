
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useEmailService } from '@/hooks/useEmailService';

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
}

const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({ isOpen, onClose, service }) => {
  const { user } = useAuth();
  const { sendBookingConfirmation } = useEmailService();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!service) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !date || !time) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .insert({
          user_id: user.id,
          service_item_id: service.id,
          booking_date: format(date, 'yyyy-MM-dd'),
          booking_time: time,
          status: 'confirmed',
          notes: notes || null,
          total_amount: service.price || 0
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email
      const userProfile = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (user.email) {
        await sendBookingConfirmation(user.email, {
          service_name: service.name,
          booking_date: format(date, 'yyyy-MM-dd'),
          booking_time: time,
          status: 'confirmed',
          notes
        });
      }

      // Create notification
      await supabase.rpc('create_notification', {
        target_user_id: user.id,
        notification_title: 'Booking Confirmed',
        notification_message: `Your ${service.name} booking for ${format(date, 'PPP')} at ${time} has been confirmed`,
        notification_type: 'success',
        action_url: '/bookings'
      });

      toast({
        title: "Booking Confirmed!",
        description: `Your booking for ${service.name} on ${format(date, 'PPP')} at ${time} has been confirmed. Check your email for details.`,
      });
      
      // Reset form
      setDate(new Date());
      setTime("");
      setNotes("");
      onClose();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    "09:00", "10:00", "11:00", 
    "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book {service.title || service.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => 
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Select Time</Label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant={time === slot ? "default" : "outline"}
                  className={cn(
                    "px-3 py-1.5 h-auto", 
                    time === slot && "bg-plaza-blue"
                  )}
                  onClick={() => setTime(slot)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {slot}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Instructions (Optional)</Label>
            <Textarea 
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements..."
              className="bg-background/50"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
              className="mt-2 sm:mt-0"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-plaza-blue hover:bg-blue-700"
              disabled={!date || !time || isSubmitting}
            >
              {isSubmitting ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingModal;
