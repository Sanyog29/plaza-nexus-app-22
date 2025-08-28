
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { CheckCircle, Play, Camera, X } from 'lucide-react';

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
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [closureReason, setClosureReason] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const callWorkflowAction = async (action: string, additionalData?: any) => {
    try {
      setLoading(action);
      
      const { data, error } = await supabase.functions.invoke('assignment-orchestrator', {
        body: {
          requestId,
          action,
          staffId: user?.id,
          ...additionalData
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        onUpdate();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
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

  const uploadPhoto = async (file: File, type: 'before' | 'after') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `request-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('maintenance-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('maintenance-photos')
        .getPublicUrl(filePath);

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

  const handlePhotoUpload = async () => {
    const photoUrls: any = {};
    
    if (beforePhoto && !beforePhotoUrl) {
      const beforeUrl = await uploadPhoto(beforePhoto, 'before');
      if (beforeUrl) photoUrls.before_photo_url = beforeUrl;
    }
    
    if (afterPhoto && !afterPhotoUrl) {
      const afterUrl = await uploadPhoto(afterPhoto, 'after');
      if (afterUrl) photoUrls.after_photo_url = afterUrl;
    }

    if (Object.keys(photoUrls).length > 0) {
      await callWorkflowAction('upload_photos', { photoUrls });
    }
  };

  const canAccept = status === 'pending' && !assignedToUserId;
  const canStart = status === 'accepted' && assignedToUserId === user?.id;
  const canUploadPhotos = status === 'in_progress' && assignedToUserId === user?.id;
  const canClose = status === 'in_progress' && assignedToUserId === user?.id && beforePhotoUrl && afterPhotoUrl;
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

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg text-white">Technician Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Accept Request */}
        {canAccept && (
          <Button
            onClick={() => callWorkflowAction('accept_request')}
            disabled={loading === 'accept_request'}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {loading === 'accept_request' ? 'Accepting...' : 'Accept Request'}
          </Button>
        )}

        {/* Start Work */}
        {canStart && (
          <Button
            onClick={() => callWorkflowAction('start_work')}
            disabled={loading === 'start_work'}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {loading === 'start_work' ? 'Starting...' : 'Start Work'}
          </Button>
        )}

        {/* Photo Upload Section */}
        {canUploadPhotos && (
          <div className="space-y-4">
            <h4 className="font-medium text-white">Upload Photos</h4>
            
            {!beforePhotoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Before Photo (Required)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBeforePhoto(e.target.files?.[0] || null)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            )}

            {!afterPhotoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  After Photo (Required)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAfterPhoto(e.target.files?.[0] || null)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            )}

            {((beforePhoto && !beforePhotoUrl) || (afterPhoto && !afterPhotoUrl)) && (
              <Button
                onClick={handlePhotoUpload}
                disabled={loading === 'upload_photos'}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                {loading === 'upload_photos' ? 'Uploading...' : 'Upload Photos'}
              </Button>
            )}
          </div>
        )}

        {/* Close Request */}
        {canClose && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Closure Reason (Optional)
              </label>
              <Textarea
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder="Describe work completed..."
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <Button
              onClick={() => callWorkflowAction('close_request', { closureReason })}
              disabled={loading === 'close_request'}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading === 'close_request' ? 'Closing...' : 'Close Request'}
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {status === 'closed' && (
          <div className="text-center p-4 bg-green-900/30 rounded-lg">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-green-400 font-medium">Request Completed</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TechnicianWorkflowButtons;
