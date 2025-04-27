
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';
import { CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
}

const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({ isOpen, onClose, service }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("");
  const [saveDetails, setSaveDetails] = useState(false);

  if (!service) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    toast("Booking Confirmed", {
      description: `Your booking for ${service.title} on ${format(date!, 'PPP')} at ${time} has been confirmed.`,
    });
    onClose();
  };

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", 
    "12:00 PM", "01:00 PM", "02:00 PM", 
    "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book {service.title}</DialogTitle>
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
            <Input 
              id="notes" 
              placeholder="Any special requirements..."
              className="bg-background/50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="saveDetails" 
              checked={saveDetails}
              onCheckedChange={(checked) => 
                setSaveDetails(checked as boolean)
              }
            />
            <label
              htmlFor="saveDetails"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Save my details for future bookings
            </label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="mt-2 sm:mt-0"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-plaza-blue hover:bg-blue-700"
              disabled={!date || !time}
            >
              Confirm Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingModal;
