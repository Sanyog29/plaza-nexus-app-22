import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, Upload, AlertTriangle, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { handleSupabaseError } from '@/utils/errorHandler';

interface RequestWorkflowManagerProps {
  requestId: string;
  requestStatus: string;
  assignedToUserId?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  onUpdate: () => void;
}

const RequestWorkflowManager: React.FC<RequestWorkflowManagerProps> = ({
  requestId,
  requestStatus,
  assignedToUserId,
  beforePhotoUrl,
  afterPhotoUrl,
  onUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    loading: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    loading: false
  });

  // Permission checks
  const isAssignedToMe = assignedToUserId === user?.id;
  const canAccept = requestStatus === 'pending' && !assignedToUserId;
  const canStart = requestStatus === 'assigned' && isAssignedToMe;
  const canUploadPhotos = requestStatus === 'in_progress' && isAssignedToMe;
  const canComplete = requestStatus === 'in_progress' && isAssignedToMe && beforePhotoUrl && afterPhotoUrl;

  // Status configuration
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'Pending', color: 'outline', icon: Clock },
      assigned: { label: 'Assigned', color: 'secondary', icon: AlertTriangle },
      in_progress: { label: 'In Progress', color: 'default', icon: Play },
      completed: { label: 'Completed', color: 'default', icon: CheckCircle }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  // Update request status
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

  // Handle workflow actions
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

  // Photo upload functionality
  const uploadPhoto = async (file: File, type: 'before' | 'after') => {
    try {
      setLoading(`upload_${type}`);
      
      // Upload to storage
      const fileName = `${requestId}/${type}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('maintenance-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('maintenance-attachments')
        .getPublicUrl(fileName);

      // Update request with photo URL
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
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleFileSelect = async (type: 'before' | 'after') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please select an image file",
            variant: "destructive"
          });
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Maximum file size is 10MB",
            variant: "destructive"
          });
          return;
        }
        await uploadPhoto(file, type);
      }
    };
    input.click();
  };

  // Complete request - duplicated from StaffRequestsPage logic
  const updateRequestStatusToComplete = async (requestId: string, newStatus: 'completed') => {
    const actionText = 'mark as completed';
    
    const openDialog = () => {
      setConfirmDialog({
        open: true,
        title: 'Complete Request',
        description: `Are you sure you want to ${actionText} this request?`,
        onConfirm: () => executeStatusUpdate(requestId, newStatus),
        loading: false
      });
    };

    const executeStatusUpdate = async (requestId: string, newStatus: 'completed') => {
      setConfirmDialog(prev => ({ ...prev, loading: true }));
      setUpdatingRequestId(requestId);
      
      try {
        const { error } = await supabase
          .from('maintenance_requests')
          .update({ 
            status: newStatus,
            assigned_to: user?.id
          })
          .eq('id', requestId);

        if (error) {
          // Handle duplicate key conflicts gracefully
          if (error.code === '23505' || error.message?.includes('duplicate key')) {
            console.warn('Status already updated by another user:', error);
            toast({
              title: "Already Updated",
              description: "This request was already updated by another user",
            });
            onUpdate();
            return;
          }
          throw error;
        }

        toast({
          title: "Request updated successfully",
          description: `Request status changed to ${newStatus.replace('_', ' ')}`,
        });

        setConfirmDialog(prev => ({ ...prev, open: false, loading: false }));
        onUpdate();
      } catch (error: any) {
        console.error('Error updating request:', error);
        const errorMessage = handleSupabaseError(error);
        toast({
          title: "Error updating request",
          description: errorMessage,
          variant: "destructive",
        });
        setConfirmDialog(prev => ({ ...prev, loading: false }));
      } finally {
        setUpdatingRequestId(null);
      }
    };

    openDialog();
  };

  const statusConfig = getStatusConfig(requestStatus);
  const StatusIcon = statusConfig.icon;

  // Don't show panel if assigned to someone else
  if (!isAssignedToMe && assignedToUserId && !canAccept) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">This request is assigned to another technician.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className="w-5 h-5" />
          Request Workflow
          <Badge variant={statusConfig.color as any} className="ml-auto">
            {statusConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Accept Request */}
        {canAccept && (
          <Button
            onClick={handleAcceptRequest}
            disabled={loading === 'assigned'}
            className="w-full"
            size="lg"
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
            className="w-full"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            {loading === 'in_progress' ? 'Starting...' : 'Start Work'}
          </Button>
        )}

        {/* Photo Upload Section */}
        {canUploadPhotos && (
          <div className="space-y-4">
            <h4 className="font-medium">Photo Documentation</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${beforePhotoUrl ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  Before Photo
                  {beforePhotoUrl && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                
                {beforePhotoUrl ? (
                  <div className="relative">
                    <img src={beforePhotoUrl} alt="Before" className="w-full h-20 object-cover rounded" />
                    <div className="absolute top-1 right-1 bg-green-500 text-white px-1 text-xs rounded">✓</div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleFileSelect('before')}
                    disabled={loading === 'upload_before'}
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-1"
                  >
                    {loading === 'upload_before' ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span className="text-xs">Take Photo</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* After Photo */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${afterPhotoUrl ? 'bg-green-500' : 'bg-gray-300'}`} />
                  After Photo
                  {afterPhotoUrl && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                
                {afterPhotoUrl ? (
                  <div className="relative">
                    <img src={afterPhotoUrl} alt="After" className="w-full h-20 object-cover rounded" />
                    <div className="absolute top-1 right-1 bg-green-500 text-white px-1 text-xs rounded">✓</div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleFileSelect('after')}
                    disabled={loading === 'upload_after'}
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-1"
                  >
                    {loading === 'upload_after' ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span className="text-xs">Take Photo</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Complete Request - using duplicated logic from StaffRequestsPage */}
        {canComplete && (
          <Button
            onClick={() => updateRequestStatusToComplete(requestId, 'completed')}
            disabled={updatingRequestId === requestId}
            className="w-full bg-green-500 hover:bg-green-600"
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {updatingRequestId === requestId ? 'Completing...' : 'Mark Complete'}
          </Button>
        )}

        {/* Completed Status */}
        {(requestStatus === 'completed' || requestStatus === 'closed') && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-green-600 font-medium">Request Completed</p>
          </div>
        )}

        {/* Guidelines */}
        {canUploadPhotos && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <h5 className="text-sm font-medium mb-2">📋 Guidelines:</h5>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Take before photos when arriving at the site</li>
              <li>• After photos are required before completion</li>
              <li>• Ensure photos are clear and well-lit</li>
              <li>• Both photos must be uploaded to complete the request</li>
            </ul>
          </div>
        )}
      </CardContent>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="Complete"
        variant="default"
        loading={confirmDialog.loading}
      />
    </Card>
  );
};

export default RequestWorkflowManager;