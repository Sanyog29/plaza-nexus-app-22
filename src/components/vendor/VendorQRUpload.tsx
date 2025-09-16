import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VendorQRUploadProps {
  vendorId: string;
  currentQRUrl?: string;
  onUploadSuccess: (url: string) => void;
}

export default function VendorQRUpload({ vendorId, currentQRUrl, onUploadSuccess }: VendorQRUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadQRCode = async (file: File) => {
    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPG, PNG, etc.)');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Create unique filename with timestamp to avoid caching issues
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const fileName = `${vendorId}/qr-code-${timestamp}.${fileExt}`;

      // Upload new file with upsert to replace any existing
      const { data, error } = await supabase.storage
        .from('vendor-qr-codes')
        .upload(fileName, file, { 
          cacheControl: '300', // Shorter cache time for faster updates
          upsert: true 
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Upload failed: ${error.message || 'Unknown storage error'}`);
      }

      if (!data?.path) {
        throw new Error('Upload succeeded but no file path returned');
      }

      // Get public URL with cache-busting parameter
      const { data: { publicUrl } } = supabase.storage
        .from('vendor-qr-codes')
        .getPublicUrl(data.path);

      const cacheBustUrl = `${publicUrl}?t=${timestamp}`;

      // Update vendor store_config using secure RPC
      const { error: updateError } = await supabase
        .rpc('set_vendor_qr', {
          p_vendor_id: vendorId,
          p_custom_qr_url: cacheBustUrl,
          p_use_custom: true
        });

      if (updateError) {
        console.error('RPC update error:', updateError);
        throw new Error(`Failed to save QR settings: ${updateError.message || 'Database error'}`);
      }

      onUploadSuccess(cacheBustUrl);
      
      toast({
        title: "QR Code Updated",
        description: "Your custom payment QR code has been uploaded successfully.",
      });

    } catch (error) {
      console.error('Error uploading QR code:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadQRCode(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadQRCode(files[0]);
    }
  };

  const removeQRCode = async () => {
    try {
      setUploading(true);

      // Update vendor config first to remove the QR reference
      const { error } = await supabase
        .rpc('set_vendor_qr', {
          p_vendor_id: vendorId,
          p_custom_qr_url: null,
          p_use_custom: false
        });

      if (error) {
        console.error('RPC remove error:', error);
        throw new Error(`Failed to remove QR settings: ${error.message || 'Database error'}`);
      }

      // Optionally clean up storage files (not critical if it fails)
      if (currentQRUrl) {
        try {
          // Extract path more robustly
          const urlParts = currentQRUrl.split('/vendor-qr-codes/');
          if (urlParts.length > 1) {
            // Remove query parameters for cleanup
            const pathWithQuery = urlParts[1];
            const path = pathWithQuery.split('?')[0];
            
            if (path) {
              await supabase.storage
                .from('vendor-qr-codes')
                .remove([path]);
            }
          }
        } catch (cleanupError) {
          // Log but don't fail the operation
          console.warn('Storage cleanup failed:', cleanupError);
        }
      }

      onUploadSuccess('');
      
      toast({
        title: "QR Code Removed",
        description: "Custom QR code removed. Auto-generated QR will be used.",
      });

    } catch (error) {
      console.error('Error removing QR code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Custom Payment QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentQRUrl ? (
          <div className="flex items-center gap-4">
            <img 
              src={currentQRUrl} 
              alt="Current QR Code" 
              className="w-20 h-20 object-cover rounded-lg border"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Custom QR code active</p>
              <p className="text-xs text-muted-foreground">This QR will be shown on invoices</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={removeQRCode}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Upload Custom QR Code</p>
            <p className="text-xs text-muted-foreground mb-4">
              Drag and drop or click to select (PNG, JPG up to 5MB)
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="qr-upload"
              disabled={uploading}
            />
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              disabled={uploading}
            >
              <label htmlFor="qr-upload" className="cursor-pointer">
                {uploading ? "Uploading..." : "Choose File"}
              </label>
            </Button>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>• If no custom QR is uploaded, auto-generated UPI QR will be used</p>
          <p>• QR code will be displayed on customer invoices</p>
          <p>• Recommended size: 200x200px or larger</p>
        </div>
      </CardContent>
    </Card>
  );
}