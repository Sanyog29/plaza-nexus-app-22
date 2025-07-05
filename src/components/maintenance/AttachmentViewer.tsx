import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, Image, Eye, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

interface AttachmentViewerProps {
  requestId: string;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ requestId }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>('');
  const [previewName, setPreviewName] = useState<string>('');

  useEffect(() => {
    fetchAttachments();
  }, [requestId]);

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('request_attachments')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading attachments",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('maintenance-attachments')
        .download(attachment.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: attachment.file_name
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const previewFile = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('maintenance-attachments')
        .download(attachment.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
      setPreviewType(attachment.file_type);
      setPreviewName(attachment.file_name);
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewType('');
    setPreviewName('');
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-400" />;
    }
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary"></div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No attachments found
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {attachments.map((attachment) => (
          <Card key={attachment.id} className="bg-card/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(attachment.file_type)}
                  <div>
                    <p className="font-medium text-sm">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {attachment.file_type.startsWith('image/') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => previewFile(attachment)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadFile(attachment)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {previewName}
              <Button variant="ghost" size="sm" onClick={closePreview}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewUrl && previewType.startsWith('image/') && (
            <div className="flex justify-center p-4">
              <img 
                src={previewUrl} 
                alt={previewName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttachmentViewer;