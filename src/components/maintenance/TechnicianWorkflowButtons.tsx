
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { CheckCircle, Play, Camera, X } from 'lucide-react';
import { SimplePhotoCapture } from '../ui/SimplePhotoCapture';

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

interface TechnicianWorkflowButtonsProps {
  requestId: string;
  status: string;
  assignedToUserId?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  onUpdate: () => void;
}

const TechnicianWorkflowButtons: React.FC<TechnicianWorkflowButtonsProps> = ({
  requestId,
  status,
  assignedToUserId,
  beforePhotoUrl,
  afterPhotoUrl,
  onUpdate
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [closureReason, setClosureReason] = useState('');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const { toast } = useToast();
  const { user } = useAuth();

  const updateRequestStatus = async (newStatus: string, additionalFields: any = {}) => {
    try {
      setLoading(newStatus);
      
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...additionalFields
      };

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${newStatus.replace('_', ' ')} successfully`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleAcceptRequest = () => {
    updateRequestStatus('assigned', {
      assigned_to: user?.id,
      assigned_at: new Date().toISOString()
    });
  };

  const handleStartWork = () => {
    updateRequestStatus('in_progress', {
      work_started_at: new Date().toISOString()
    });
  };

  const handleCompleteRequest = async () => {
    setLoading('closed');
    try {
      const { data, error } = await supabase.rpc('complete_request', {
        request_id: requestId,
        p_closure_reason: closureReason || 'Work completed successfully'
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: result?.message || "Request closed successfully"
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to close request",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const uploadPhoto = async (file: File, type: 'before' | 'after') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to maintenance-attachments bucket
      const { error: uploadError } = await supabase.storage
        .from('maintenance-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('maintenance-attachments')
        .getPublicUrl(filePath);

      // Update maintenance_requests with photo URL
      const updateField = type === 'before' ? 'before_photo_url' : 'after_photo_url';
      const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({ [updateField]: publicUrl })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Insert into request_attachments for record keeping
      const { error: attachmentError } = await supabase
        .from('request_attachments')
        .insert({
          request_id: requestId,
          file_name: fileName,
          file_type: file.type,
          file_url: publicUrl,
          file_size: file.size,
          uploaded_by: user?.id,
          attachment_type: 'work_photo',
          stage: type
        });

      if (attachmentError) {
        console.error('Error creating attachment record:', attachmentError);
        // Don't fail the upload if attachment record fails
      }

      toast({
        title: "Photo Uploaded",
        description: `${type === 'before' ? 'Before' : 'After'} photo uploaded successfully`,
      });
      
      onUpdate();
      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleMediaCaptured = async (capturedMedia: CapturedMedia[]) => {
    if (capturedMedia.length === 0) return;
    
    const media = capturedMedia[0]; // Use the first captured photo
    const file = new File([media.blob], `${photoType}_photo.jpg`, { type: 'image/jpeg' });
    
    await uploadPhoto(file, photoType);
    setShowPhotoCapture(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    await uploadPhoto(file, type);
    event.target.value = ''; // Reset input
  };

  const openPhotoCapture = (type: 'before' | 'after') => {
    setPhotoType(type);
    setShowPhotoCapture(true);
  };

  const canAccept = status === 'pending' && !assignedToUserId;
  const canStart = status === 'assigned' && assignedToUserId === user?.id;
  const canUploadPhotos = status === 'in_progress' && assignedToUserId === user?.id;
  const canComplete = status === 'in_progress' && assignedToUserId === user?.id && beforePhotoUrl && afterPhotoUrl;
  const isAssignedToMe = assignedToUserId === user?.id;

  if (!isAssignedToMe && assignedToUserId) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <p className="text-gray-400">This ticket is assigned to another technician.</p>
        </CardContent>
      </Card>
    );
  }

  if (showPhotoCapture) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-white">
              Capture {photoType === 'before' ? 'Before' : 'After'} Photo
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPhotoCapture(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SimplePhotoCapture
            onMediaCaptured={handleMediaCaptured}
            disabled={false}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg text-white">Technician Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Accept Request */}
        {canAccept && (
          <Button
            onClick={handleAcceptRequest}
            disabled={loading === 'assigned'}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {loading === 'assigned' ? 'Accepting...' : 'Accept Request'}
          </Button>
        )}

        {/* Start Work */}
        {canStart && (
          <Button
            onClick={handleStartWork}
            disabled={loading === 'in_progress'}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {loading === 'in_progress' ? 'Starting...' : 'Start Work'}
          </Button>
        )}

        {/* Photo Upload Section */}
        {canUploadPhotos && (
          <div className="space-y-4">
            <h4 className="font-medium text-white">Upload Photos</h4>
            
            {/* Before Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Before Photo {!beforePhotoUrl && '(Required)'}
              </label>
              {beforePhotoUrl ? (
                <div className="relative">
                  <img src={beforePhotoUrl} alt="Before" className="w-full h-32 object-cover rounded" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    ✓ Uploaded
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => openPhotoCapture('before')}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'before')}
                      className="hidden"
                      id="before-photo-input"
                    />
                    <Button
                      onClick={() => document.getElementById('before-photo-input')?.click()}
                      variant="outline"
                      className="w-full"
                    >
                      Choose File
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* After Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                After Photo {!afterPhotoUrl && '(Required)'}
              </label>
              {afterPhotoUrl ? (
                <div className="relative">
                  <img src={afterPhotoUrl} alt="After" className="w-full h-32 object-cover rounded" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    ✓ Uploaded
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => openPhotoCapture('after')}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'after')}
                      className="hidden"
                      id="after-photo-input"
                    />
                    <Button
                      onClick={() => document.getElementById('after-photo-input')?.click()}
                      variant="outline"
                      className="w-full"
                    >
                      Choose File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Complete Request */}
        {canComplete && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Completion Notes (Optional)
              </label>
              <Textarea
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder="Describe work completed..."
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <Button
              onClick={handleCompleteRequest}
              disabled={loading === 'closed'}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading === 'closed' ? 'Closing...' : 'Close Request'}
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {(status === 'completed' || status === 'closed') && (
          <div className="text-center p-4 bg-green-900/30 rounded-lg">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-green-400 font-medium">Request Closed</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TechnicianWorkflowButtons;
