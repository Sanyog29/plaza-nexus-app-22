
import React, { useState, useRef } from 'react';
import { Image, Paperclip, X, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface AttachmentFile {
  file: File;
  preview?: string;
  uploading: boolean;
}

interface RequestAttachmentsProps {
  isLoading: boolean;
  onFilesChange?: (files: File[]) => void;
  requestId?: string;
}

const RequestAttachments: React.FC<RequestAttachmentsProps> = ({ 
  isLoading, 
  onFilesChange,
  requestId 
}) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null, isPhoto: boolean = false) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (isPhoto) {
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

    const newAttachments: AttachmentFile[] = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      uploading: false
    }));

    const updatedAttachments = [...attachments, ...newAttachments];
    setAttachments(updatedAttachments);
    onFilesChange?.(updatedAttachments.map(att => att.file));
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
        title: "File uploaded successfully",
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

  const handlePhotoClick = () => photoInputRef.current?.click();
  const handleAttachClick = () => fileInputRef.current?.click();

  return (
    <div className="space-y-4">
      <Label>Attachments</Label>
      
      {/* Upload Buttons */}
      <div className="flex space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handlePhotoClick}
          disabled={isLoading}
        >
          <Image size={20} className="mr-2" />
          Photo
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleAttachClick}
          disabled={isLoading}
        >
          <Paperclip size={20} className="mr-2" />
          Attach File
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files, true)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
        multiple
        onChange={(e) => handleFileSelect(e.target.files, false)}
        className="hidden"
      />

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Selected Files:</Label>
          <div className="grid grid-cols-1 gap-2">
            {attachments.map((attachment, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-lg bg-card/30"
              >
                <div className="flex items-center space-x-3">
                  {attachment.preview ? (
                    <img 
                      src={attachment.preview} 
                      alt="Preview" 
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{attachment.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestAttachments;
