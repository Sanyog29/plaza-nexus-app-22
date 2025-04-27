
import React from 'react';
import { Image, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface RequestAttachmentsProps {
  isLoading: boolean;
}

const RequestAttachments: React.FC<RequestAttachmentsProps> = ({ isLoading }) => {
  return (
    <div className="space-y-2">
      <Label>Attachments</Label>
      <div className="flex space-x-4">
        <Button type="button" variant="outline" className="border-gray-600" disabled={isLoading}>
          <Image size={20} className="mr-2" />
          Photo
        </Button>
        <Button type="button" variant="outline" className="border-gray-600" disabled={isLoading}>
          <Paperclip size={20} className="mr-2" />
          Attach
        </Button>
      </div>
    </div>
  );
};

export default RequestAttachments;
