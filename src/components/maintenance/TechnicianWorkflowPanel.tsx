import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, AlertTriangle, Clock, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface WorkflowState {
  id: string;
  request_id: string;
  current_stage: string;
  before_photos_required: boolean;
  after_photos_required: boolean;
  before_photos_uploaded: boolean;
  after_photos_uploaded: boolean;
  technician_id: string;
  started_at?: string;
  completed_at?: string;
}

interface TechnicianWorkflowPanelProps {
  requestId: string;
  requestStatus: string;
  onStatusUpdate?: () => void;
}

const TechnicianWorkflowPanel: React.FC<TechnicianWorkflowPanelProps> = ({
  requestId,
  requestStatus,
  onStatusUpdate
}) => {
  const { user } = useAuth();
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const beforePhotoRef = useRef<HTMLInputElement>(null);
  const afterPhotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWorkflowState();
  }, [requestId]);

  const fetchWorkflowState = async () => {
    try {
      const { data, error } = await supabase
        .from('request_workflow_states')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      setWorkflowState(data);
    } catch (error: any) {
      console.error('Error fetching workflow state:', error);
      toast({
        title: "Error loading workflow",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async (file: File, type: 'before' | 'after') => {
    if (!user) return;

    setUploading(type);
    setUploadProgress(0);

    try {
      const fileName = `${user.id}/${requestId}/${type}-${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('maintenance-attachments')
        .upload(fileName, file);

      // Simulate progress for better UX
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from('request_attachments')
        .insert({
          request_id: requestId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: fileName,
          uploaded_by: user.id,
          attachment_type: type === 'before' ? 'technician_before' : 'technician_after',
          stage: requestStatus,
          metadata: {
            captured_by: user.id,
            captured_at: new Date().toISOString(),
            workflow_stage: type
          }
        });

      if (dbError) throw dbError;

      toast({
        title: `✅ ${type === 'before' ? 'Before' : 'After'} photo uploaded`,
        description: "Photo documentation complete"
      });

      // Refresh workflow state
      await fetchWorkflowState();
      onStatusUpdate?.();

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }

    uploadPhoto(file, type);
    e.target.value = ''; // Reset input
  };

  const getStageStatus = (stage: string) => {
    const stages = {
      pending: { label: 'Pending Assignment', color: 'outline', icon: Clock },
      assigned: { label: 'Assigned', color: 'secondary', icon: AlertTriangle },
      in_progress: { label: 'In Progress', color: 'secondary', icon: Clock },
      completed: { label: 'Completed', color: 'default', icon: CheckCircle2 }
    };
    return stages[stage as keyof typeof stages] || stages.pending;
  };

  const canUploadBefore = workflowState?.before_photos_required && !workflowState?.before_photos_uploaded;
  const canUploadAfter = workflowState?.after_photos_required && !workflowState?.after_photos_uploaded;
  const isWorkComplete = workflowState?.before_photos_uploaded && workflowState?.after_photos_uploaded;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading workflow...</p>
        </CardContent>
      </Card>
    );
  }

  if (!workflowState) {
    return null; // Don't show panel if no workflow state
  }

  const stageStatus = getStageStatus(workflowState.current_stage);
  const StageIcon = stageStatus.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StageIcon className="w-5 h-5" />
          Technician Workflow
          <Badge variant={stageStatus.color as any} className="ml-auto">
            {stageStatus.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Documentation Requirements */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Photo Documentation
          </h4>

          {/* Before Photos */}
          {workflowState.before_photos_required && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    workflowState.before_photos_uploaded ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm font-medium">Before Photos</span>
                  {workflowState.before_photos_uploaded && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                </div>
                
                {canUploadBefore && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => beforePhotoRef.current?.click()}
                    disabled={uploading === 'before'}
                  >
                    {uploading === 'before' ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </>
                    )}
                  </Button>
                )}
              </div>

              {uploading === 'before' && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Uploading before photo... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Document the issue before starting work
              </p>
            </div>
          )}

          <Separator />

          {/* After Photos */}
          {workflowState.after_photos_required && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    workflowState.after_photos_uploaded ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm font-medium">After Photos</span>
                  {workflowState.after_photos_uploaded && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                </div>
                
                {canUploadAfter && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => afterPhotoRef.current?.click()}
                    disabled={uploading === 'after'}
                  >
                    {uploading === 'after' ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </>
                    )}
                  </Button>
                )}
              </div>

              {uploading === 'after' && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Uploading after photo... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Document the completed work for verification
              </p>
            </div>
          )}
        </div>

        {/* Work Status */}
        {isWorkComplete && requestStatus !== 'completed' && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              All required photos uploaded! The ticket can now be marked as completed.
            </AlertDescription>
          </Alert>
        )}

        {/* Workflow Guidelines */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <h5 className="text-sm font-medium mb-2">📋 Workflow Guidelines:</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Take before photos when you arrive at the site</li>
            <li>• After photos are required before marking complete</li>
            <li>• Clear, well-lit photos help with quality assurance</li>
            <li>• Photos are automatically linked to your work record</li>
          </ul>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={beforePhotoRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e, 'before')}
          className="hidden"
        />
        <input
          ref={afterPhotoRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e, 'after')}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default TechnicianWorkflowPanel;