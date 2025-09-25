import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image } from 'lucide-react';

interface VendorLogoUploadProps {
  currentLogoUrl?: string;
  onLogoUpdate: (logoUrl: string | null) => void;
  vendorId: string;
}

export function VendorLogoUpload({ currentLogoUrl, onLogoUpdate, vendorId }: VendorLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (PNG, JPEG, JPG, WEBP)');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      await uploadLogo(file);
    } catch (error) {
      console.error('Error handling file:', error);
      toast.error('Failed to process file');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadLogo = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const filename = `logos/${vendorId}/${timestamp}.${fileExt}`;

    // Delete old logo if it exists and is from our storage
    if (currentLogoUrl && currentLogoUrl.includes('vendor-images')) {
      const oldPath = currentLogoUrl.split('/vendor-images/')[1];
      if (oldPath) {
        await supabase.storage.from('vendor-images').remove([oldPath]);
      }
    }

    // Upload new logo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filename, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      toast.error('Failed to upload logo');
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filename);

    onLogoUpdate(urlData.publicUrl);
    toast.success('Logo uploaded successfully');
  };

  const removeLogo = async () => {
    try {
      // Delete from storage if it's our file
      if (currentLogoUrl && currentLogoUrl.includes('vendor-images')) {
        const path = currentLogoUrl.split('/vendor-images/')[1];
        if (path) {
          await supabase.storage.from('vendor-images').remove([path]);
        }
      }

      onLogoUpdate(null);
      setPreviewUrl(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const displayImage = previewUrl || currentLogoUrl;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {displayImage ? (
        <div className="relative">
          <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <img
              src={displayImage}
              alt="Vendor logo"
              className="w-full h-full object-contain"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0"
            onClick={removeLogo}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className="w-32 h-32 border-2 border-dashed border-border rounded-lg bg-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
          onClick={triggerUpload}
        >
          <Image className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground text-center px-2">
            Click to upload logo
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerUpload}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentLogoUrl ? 'Change Logo' : 'Upload Logo'}
        </Button>
        
        {displayImage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeLogo}
            disabled={isUploading}
          >
            Remove
          </Button>
        )}
      </div>

      {isUploading && (
        <p className="text-sm text-muted-foreground">Uploading logo...</p>
      )}
      
      <p className="text-xs text-muted-foreground">
        Supported formats: PNG, JPEG, WEBP. Max size: 2MB.
      </p>
    </div>
  );
}