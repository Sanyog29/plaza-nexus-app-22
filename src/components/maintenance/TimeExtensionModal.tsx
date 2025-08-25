import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTimeExtensions } from '@/hooks/useTimeExtensions';

interface TimeExtensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  onSuccess?: () => void;
}

const TIME_EXTENSION_REASONS = [
  'Vendor required',
  'Items not available',
  'Technician required',
  'My issue not mentioned here'
];

export const TimeExtensionModal: React.FC<TimeExtensionModalProps> = ({
  open,
  onOpenChange,
  requestId,
  onSuccess
}) => {
  const [additionalHours, setAdditionalHours] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { requestTimeExtension } = useTimeExtensions();

  const handleSubmit = async () => {
    if (!additionalHours || !reason) return;

    setIsSubmitting(true);
    const result = await requestTimeExtension(
      requestId,
      parseInt(additionalHours),
      reason,
      notes || undefined
    );

    if (result.success) {
      // Reset form
      setAdditionalHours('');
      setReason('');
      setNotes('');
      onOpenChange(false);
      onSuccess?.();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    // Reset form when closing
    setAdditionalHours('');
    setReason('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Time Extension</DialogTitle>
          <DialogDescription>
            Request additional time to complete this maintenance task. This will be sent to L2+ staff for approval.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hours" className="text-right">
              Add Hours
            </Label>
            <Input
              id="hours"
              type="number"
              min="1"
              max="72"
              value={additionalHours}
              onChange={(e) => setAdditionalHours(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 4"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select reason for extension" />
              </SelectTrigger>
              <SelectContent>
                {TIME_EXTENSION_REASONS.map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right mt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Additional details about why extension is needed..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!additionalHours || !reason || isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send for Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};