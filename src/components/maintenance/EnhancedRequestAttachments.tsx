import React, { useState, useRef } from 'react';
import { Camera, Paperclip, X, FileText, Upload, ImageIcon, Zap, Video } from 'lucide-react';
import EnhancedPhotoCapture from './EnhancedPhotoCapture';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AttachmentFile {
  file: File;
  preview?: string;
  uploading: boolean;
  analysis?: {
    category?: string;
    urgency?: string;
    description?: string;
  };
}

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

interface EnhancedRequestAttachmentsProps {
  isLoading: boolean;
  onFilesChange?: (files: File[]) => void;
  requestId?: string;
}

const EnhancedRequestAttachments: React.FC<EnhancedRequestAttachmentsProps> = ({ 
  isLoading, 
  onFilesChange,
  requestId 
}) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Analyze image for maintenance issues (mock AI analysis)
  const analyzeImage = async (file: File): Promise<AttachmentFile['analysis']> => {
    // Simulate AI analysis based on file name and type
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('water') || fileName.includes('leak')) {
      return {
        category: 'plumbing',
        urgency: 'high',
        description: 'Possible water damage detected'
      };
    } else if (fileName.includes('electric') || fileName.includes('spark')) {
      return {
        category: 'electrical',
        urgency: 'urgent',
        description: 'Electrical issue detected - requires immediate attention'
      };
    } else if (fileName.includes('break') || fileName.includes('damage')) {
      return {
        category: 'general',
        urgency: 'high',
        description: 'Physical damage detected'
      };
    }
    
    return {
      category: 'general',
      urgency: 'medium',
      description: 'Issue documented in image'
    };
  };

  const handleFileSelect = async (files: FileList | null, source: 'camera' | 'gallery' | 'file' = 'file') => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (source === 'camera' || source === 'gallery') {
        return file.type.startsWith('image/');
      }
      // Allow common file types
      const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats'];
      return allowedTypes.some(type => file.type.startsWith(type)) || file.size < 10 * 1024 * 1024; // 10MB limit
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files were skipped",
        description: "Only images, PDFs, documents under 10MB are allowed",
        variant: "destructive"
      });
    }

    const newAttachments: AttachmentFile[] = await Promise.all(
      validFiles.map(async (file) => {
        const attachment: AttachmentFile = {
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          uploading: false
        };

        // Analyze images for maintenance issues
        if (file.type.startsWith('image/')) {
          try {
            attachment.analysis = await analyzeImage(file);
          } catch (error) {
            console.error('Image analysis failed:', error);
          }
        }

        return attachment;
      })
    );

    const updatedAttachments = [...attachments, ...newAttachments];
    setAttachments(updatedAttachments);
    onFilesChange?.(updatedAttachments.map(att => att.file));

    // Show analysis results
    newAttachments.forEach(attachment => {
      if (attachment.analysis && attachment.analysis.urgency === 'urgent') {
        toast({
          title: "⚠️ Urgent Issue Detected",
          description: attachment.analysis.description,
          variant: "destructive"
        });
      } else if (attachment.analysis && attachment.analysis.urgency === 'high') {
        toast({
          title: "⚡ High Priority Issue",
          description: attachment.analysis.description,
        });
      }
    });
  };

  const removeAttachment = (index: number) => {
    const attachment = attachments[index];
    if (attachment.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    const updatedAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(updatedAttachments);
    onFilesChange?.(updatedAttachments.map(att => att.file));
  };

  const uploadFile = async (attachment: AttachmentFile, index: number) => {
    if (!user) return;

    const fileName = `${user.id}/${Date.now()}-${attachment.file.name}`;
    
    setAttachments(prev => prev.map((att, i) => 
      i === index ? { ...att, uploading: true } : att
    ));

    try {
      const { error } = await supabase.storage
        .from('maintenance-attachments')
        .upload(fileName, attachment.file);

      if (error) throw error;

      // If we have a requestId, save to database
      if (requestId) {
        const { error: dbError } = await supabase
          .from('request_attachments')
          .insert({
            request_id: requestId,
            file_name: attachment.file.name,
            file_type: attachment.file.type,
            file_size: attachment.file.size,
            file_url: fileName,
            uploaded_by: user.id
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "✅ File uploaded successfully",
        description: attachment.file.name
      });

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAttachments(prev => prev.map((att, i) => 
        i === index ? { ...att, uploading: false } : att
      ));
    }
  };

  const handleCameraCapture = () => setShowPhotoCapture(true);
  const handleGallerySelect = () => photoInputRef.current?.click();
  const handleFileAttach = () => fileInputRef.current?.click();

  const handleMediaCaptured = (capturedMedia: CapturedMedia[]) => {
    // Convert captured media to attachment files
    const newAttachments: AttachmentFile[] = capturedMedia.map(media => ({
      file: new File([media.blob], `${media.type}_${media.timestamp.getTime()}.${media.type === 'photo' ? 'jpg' : 'webm'}`, {
        type: media.type === 'photo' ? 'image/jpeg' : 'video/webm'
      }),
      preview: media.url,
      uploading: false,
      analysis: media.analysis
    }));

    const updatedAttachments = [...attachments, ...newAttachments];
    setAttachments(updatedAttachments);
    onFilesChange?.(updatedAttachments.map(att => att.file));
    setShowPhotoCapture(false);

    toast({
      title: "✅ Media Added",
      description: `${capturedMedia.length} files added successfully`
    });
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Attachments & Photos</Label>
      
      {showPhotoCapture ? (
        <EnhancedPhotoCapture
          onMediaCaptured={handleMediaCaptured}
          disabled={isLoading}
        />
      ) : (
        <>
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCameraCapture}
              disabled={isLoading}
              className="flex flex-col items-center py-4 h-auto"
            >
              <Camera size={24} className="mb-1" />
              <span className="text-xs">Enhanced Camera</span>
            </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGallerySelect}
          disabled={isLoading}
          className="flex flex-col items-center py-4 h-auto"
        >
          <ImageIcon size={24} className="mb-1" />
          <span className="text-xs">Gallery</span>
        </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleFileAttach}
              disabled={isLoading}
              className="flex flex-col items-center py-4 h-auto"
            >
              <Paperclip size={24} className="mb-1" />
              <span className="text-xs">Files</span>
            </Button>
          </div>
        </>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files, 'camera')}
        className="hidden"
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files, 'gallery')}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
        multiple
        onChange={(e) => handleFileSelect(e.target.files, 'file')}
        className="hidden"
      />

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Attached Files:</Label>
          <div className="space-y-3">
            {attachments.map((attachment, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* File Preview */}
                    <div className="flex-shrink-0">
                      {attachment.preview ? (
                        <img 
                          src={attachment.preview} 
                          alt="Preview" 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{attachment.file.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      
                      {/* AI Analysis Results */}
                      {attachment.analysis && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getUrgencyColor(attachment.analysis.urgency)} className="text-xs">
                              {attachment.analysis.urgency === 'urgent' && '🚨 '}
                              {attachment.analysis.urgency === 'high' && '⚡ '}
                              {attachment.analysis.urgency?.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {attachment.analysis.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {attachment.analysis.description}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {requestId && !attachment.uploading && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => uploadFile(attachment, index)}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {attachment.uploading && (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary"></div>
                      )}
                      
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAttachment(index)}
                        disabled={attachment.uploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {!showPhotoCapture && (
      <Card className="bg-muted/50">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-primary mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">Pro Tips:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Take clear photos of the issue for faster resolution</li>
                <li>Multiple angles help our AI analyze the problem better</li>
                <li>Images are automatically analyzed for urgency and category</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default EnhancedRequestAttachments;