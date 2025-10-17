import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AttachBeforePhotoButtonProps {
  requestId: string;
  requestTitle: string;
  onPhotoAttached?: () => void;
}

export const AttachBeforePhotoButton = ({
  requestId,
  requestTitle,
  onPhotoAttached,
}: AttachBeforePhotoButtonProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}_before_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('maintenance-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('maintenance-attachments')
        .getPublicUrl(uploadData.path);

      // Update maintenance_requests
      const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({ before_photo_url: publicUrl })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast({
        title: "Before Photo Uploaded Successfully",
        description: `Photo attached to request: ${requestTitle}`,
      });

      if (onPhotoAttached) onPhotoAttached();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id={`photo-upload-${requestId}`}
        disabled={isUploading}
      />
      <label htmlFor={`photo-upload-${requestId}`}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          className="gap-2 h-8"
          asChild
        >
          <span className="cursor-pointer">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Attach Before Photo
              </>
            )}
          </span>
        </Button>
      </label>
    </>
  );
};
