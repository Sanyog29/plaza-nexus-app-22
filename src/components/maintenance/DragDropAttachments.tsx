import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, X, FileText, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface AttachmentFile {
  file: File;
  preview?: string;
  uploading: boolean;
  progress: number;
  uploaded: boolean;
  error?: string;
  analysis?: {
    category?: string;
    urgency?: string;
    description?: string;
  };
}

interface DragDropAttachmentsProps {
  isLoading: boolean;
  onFilesChange?: (files: File[]) => void;
  requestId?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  showTips?: boolean;
}

const DragDropAttachments: React.FC<DragDropAttachmentsProps> = ({
  isLoading,
  onFilesChange,
  requestId,
  maxFiles = 10,
  maxSize = 10,
  showTips = true
}) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Mock AI analysis function
  const analyzeImage = async (file: File): Promise<AttachmentFile['analysis']> => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('water') || fileName.includes('leak')) {
      return {
        category: 'plumbing',
        urgency: 'high',
        description: 'Water damage detected - priority repair needed'
      };
    } else if (fileName.includes('electric') || fileName.includes('spark')) {
      return {
        category: 'electrical',
        urgency: 'urgent',
        description: 'Electrical hazard - immediate attention required'
      };
    } else if (fileName.includes('break') || fileName.includes('damage')) {
      return {
        category: 'structural',
        urgency: 'high',
        description: 'Structural damage requiring assessment'
      };
    }
    
    return {
      category: 'general',
      urgency: 'medium',
      description: 'Issue documented in image'
    };
  };

  const uploadFile = async (attachment: AttachmentFile, index: number) => {
    if (!user) return;

    const fileName = `${user.id}/${Date.now()}-${attachment.file.name}`;
    
    // Start upload
    setAttachments(prev => prev.map((att, i) => 
      i === index ? { ...att, uploading: true, progress: 0 } : att
    ));

    try {
      const { error } = await supabase.storage
        .from('maintenance-attachments')
        .upload(fileName, attachment.file);

      // Simulate progress for better UX
      setAttachments(prev => prev.map((att, i) => 
        i === index ? { ...att, progress: 100 } : att
      ));

      if (error) throw error;

      // Save to database if requestId exists
      if (requestId) {
        const { error: dbError } = await supabase
          .from('request_attachments')
          .insert({
            request_id: requestId,
            file_name: attachment.file.name,
            file_type: attachment.file.type,
            file_size: attachment.file.size,
            file_url: fileName,
            uploaded_by: user.id,
            attachment_type: 'user_upload',
            metadata: attachment.analysis ? { analysis: attachment.analysis } : {}
          });

        if (dbError) throw dbError;
      }

      setAttachments(prev => prev.map((att, i) => 
        i === index ? { ...att, uploading: false, uploaded: true, progress: 100 } : att
      ));

      toast({
        title: "✅ File uploaded successfully",
        description: attachment.file.name
      });

    } catch (error: any) {
      setAttachments(prev => prev.map((att, i) => 
        i === index ? { ...att, uploading: false, error: error.message } : att
      ));
      
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const reasons = rejectedFiles.map(f => f.errors[0]?.message).join(', ');
      toast({
        title: "Some files were rejected",
        description: reasons,
        variant: "destructive"
      });
    }

    // Check total file limit
    if (attachments.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    // Process accepted files
    const newAttachments: AttachmentFile[] = await Promise.all(
      acceptedFiles.map(async (file) => {
        const attachment: AttachmentFile = {
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          uploading: false,
          progress: 0,
          uploaded: false
        };

        // Analyze images
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

    // Show urgency alerts
    newAttachments.forEach(attachment => {
      if (attachment.analysis?.urgency === 'urgent') {
        toast({
          title: "🚨 Urgent Issue Detected",
          description: attachment.analysis.description,
          variant: "destructive"
        });
      }
    });
  }, [attachments, maxFiles, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: maxSize * 1024 * 1024,
    disabled: isLoading
  });

  const removeAttachment = (index: number) => {
    const attachment = attachments[index];
    if (attachment.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    const updatedAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(updatedAttachments);
    onFilesChange?.(updatedAttachments.map(att => att.file));
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'outline';
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      onDrop(Array.from(files), []);
    }
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <Card 
        {...getRootProps()} 
        className={`cursor-pointer transition-all duration-200 ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-dashed border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/10' : 'bg-muted'}`}>
              <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">
                {isDragActive ? 'Drop files here' : 'Upload Attachments'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Images, PDFs, documents up to {maxSize}MB • Max {maxFiles} files
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCameraCapture();
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        className="hidden"
      />

      {/* File Previews */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Attached Files ({attachments.length}/{maxFiles})</h4>
          <div className="space-y-2">
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
                    
                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h5 className="font-medium truncate">{attachment.file.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          
                          {/* AI Analysis */}
                          {attachment.analysis && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <Badge variant={getUrgencyColor(attachment.analysis.urgency)} className="text-xs">
                                {attachment.analysis.urgency === 'urgent' && '🚨 '}
                                {attachment.analysis.urgency === 'high' && '⚡ '}
                                {attachment.analysis.urgency?.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {attachment.analysis.category}
                              </Badge>
                            </div>
                          )}
                          
                          {attachment.analysis?.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {attachment.analysis.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Status & Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {attachment.uploaded ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : attachment.error ? (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          ) : attachment.uploading ? (
                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                          ) : requestId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => uploadFile(attachment, index)}
                            >
                              Upload
                            </Button>
                          ) : null}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAttachment(index)}
                            disabled={attachment.uploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      {attachment.uploading && (
                        <div className="mt-2">
                          <Progress value={attachment.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Uploading... {Math.round(attachment.progress)}%
                          </p>
                        </div>
                      )}
                      
                      {/* Error Message */}
                      {attachment.error && (
                        <Alert className="mt-2" variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {attachment.error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pro Tips */}
      {showTips && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h5 className="font-medium mb-2">📸 Pro Tips for Better Resolution:</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Take clear, well-lit photos showing the issue</li>
                  <li>• Capture multiple angles for better diagnosis</li>
                  <li>• Include context (surrounding area, labels, etc.)</li>
                  <li>• AI analysis helps prioritize urgent issues automatically</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DragDropAttachments;