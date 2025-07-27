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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send } from 'lucide-react';
import { useFeatureRequest } from '@/hooks/useFeatureRequest';

interface FeatureRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  featureDisplayName?: string;
}

export const FeatureRequestDialog: React.FC<FeatureRequestDialogProps> = ({
  open,
  onOpenChange,
  feature,
  featureDisplayName
}) => {
  const [reason, setReason] = useState('');
  const { submitFeatureRequest, isSubmitting } = useFeatureRequest();

  const handleSubmit = async () => {
    const success = await submitFeatureRequest(feature, reason);
    if (success) {
      setReason('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Request Feature Access
          </DialogTitle>
          <DialogDescription>
            Request access to <strong>{featureDisplayName || feature}</strong> from your administrator.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Why do you need this feature? (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Explain how this feature would help you in your role..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};