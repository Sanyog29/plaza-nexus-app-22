import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Camera, CheckCircle, Upload, X } from 'lucide-react';
import EnhancedPhotoCapture from './EnhancedPhotoCapture';

interface CapturedMedia {
  id: string;
  type: 'photo' | 'video';
  blob: Blob;
  url: string;
  timestamp: Date;
  analysis?: {
    category?: string;
    urgency?: string;
    description?: string;
  };
}

interface WorkingModePanelProps {
  requestId: string;
  status: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  onUpdate: () => void;
}

const WorkingModePanel: React.FC<WorkingModePanelProps> = ({
  requestId,
  status,
  beforePhotoUrl,
  afterPhotoUrl,
  onUpdate
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadPhoto = async (file: File, type: 'before' | 'after') => {
    try {
      const fileName = `${requestId}/${type}_${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('maintenance-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('maintenance-attachments')
        .getPublicUrl(fileName);

      const updateField = type === 'before' ? 'before_photo_url' : 'after_photo_url';
      
      const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({ [updateField]: publicUrl })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create attachment record
      await supabase
        .from('request_attachments')
        .insert({
          request_id: requestId,
          file_name: fileName,
          file_type: file.type,
          file_url: publicUrl,
          file_size: file.size,
          uploaded_by: user?.id,
          attachment_type: `${type}_photo`,
          stage: type
        });

      toast({
        title: "Photo Uploaded",
        description: `${type === 'before' ? 'Before' : 'After'} photo uploaded successfully.`
      });

      onUpdate();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMediaCaptured = async (capturedMedia: CapturedMedia[]) => {
    if (capturedMedia.length === 0) return;

    const media = capturedMedia[0];
    const file = new File([media.blob], `${photoType}_photo.jpg`, { type: 'image/jpeg' });
    
    setLoading(`upload_${photoType}`);
    await uploadPhoto(file, photoType);
    setLoading(null);
    setShowPhotoCapture(false);
  };

  const handleFileSelect = async (type: 'before' | 'after') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setLoading(`upload_${type}`);
        await uploadPhoto(file, type);
        setLoading(null);
      }
    };
    input.click();
  };

  const handleCloseRequest = async () => {
    if (!beforePhotoUrl || !afterPhotoUrl) {
      toast({
        title: "Photos Required",
        description: "Both before and after photos must be uploaded before closing the request.",
        variant: "destructive"
      });
      return;
    }

    setLoading('close');
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Completed",
        description: "The maintenance request has been marked as completed."
      });

      onUpdate();
    } catch (error) {
      console.error('Error closing request:', error);
      toast({
        title: "Error",
        description: "Failed to close request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handlePhotoCapture = (type: 'before' | 'after') => {
    setPhotoType(type);
    setShowPhotoCapture(true);
  };

  // Only show for assigned or in_progress status
  if (!['assigned', 'in_progress'].includes(status)) {
    return null;
  }

  const bothPhotosUploaded = beforePhotoUrl && afterPhotoUrl;

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Working Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload Before Photo */}
            <div className="space-y-2">
              <Button
                onClick={() => handlePhotoCapture('before')}
                disabled={loading === 'upload_before'}
                variant={beforePhotoUrl ? "secondary" : "default"}
                className="w-full h-16 flex flex-col items-center gap-1"
              >
                {loading === 'upload_before' ? (
                  <div className="animate-spin h-4 w-4 rounded-full border-2 border-transparent border-t-current" />
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    <span className="text-xs">
                      {beforePhotoUrl ? 'Update Before Photo' : 'Upload Before Photo'}
                    </span>
                  </>
                )}
              </Button>
              {beforePhotoUrl && (
                <div className="text-xs text-center text-muted-foreground">
                  ✓ Before photo uploaded
                </div>
              )}
            </div>

            {/* Upload After Photo */}
            <div className="space-y-2">
              <Button
                onClick={() => handlePhotoCapture('after')}
                disabled={loading === 'upload_after'}
                variant={afterPhotoUrl ? "secondary" : "default"}
                className="w-full h-16 flex flex-col items-center gap-1"
              >
                {loading === 'upload_after' ? (
                  <div className="animate-spin h-4 w-4 rounded-full border-2 border-transparent border-t-current" />
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    <span className="text-xs">
                      {afterPhotoUrl ? 'Update After Photo' : 'Upload After Photo'}
                    </span>
                  </>
                )}
              </Button>
              {afterPhotoUrl && (
                <div className="text-xs text-center text-muted-foreground">
                  ✓ After photo uploaded
                </div>
              )}
            </div>

            {/* Close Request */}
            <div className="space-y-2">
              <Button
                onClick={handleCloseRequest}
                disabled={!bothPhotosUploaded || loading === 'close'}
                variant="default"
                className="w-full h-16 flex flex-col items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
              >
                {loading === 'close' ? (
                  <div className="animate-spin h-4 w-4 rounded-full border-2 border-transparent border-t-current" />
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-xs">Close Request</span>
                  </>
                )}
              </Button>
              {!bothPhotosUploaded && (
                <div className="text-xs text-center text-muted-foreground">
                  Upload both photos to enable
                </div>
              )}
            </div>
          </div>

          {/* File upload alternative */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => handleFileSelect('before')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Choose Before File
            </Button>
            <Button
              onClick={() => handleFileSelect('after')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Choose After File
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPhotoCapture && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-full max-w-md mx-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Capture {photoType === 'before' ? 'Before' : 'After'} Photo
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPhotoCapture(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <EnhancedPhotoCapture
                  onMediaCaptured={handleMediaCaptured}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkingModePanel;