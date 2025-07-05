import React, { useState, useRef } from 'react';
import { Camera, Upload, User, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarUpdate: (url: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarUpdate,
  size = 'md'
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Delete existing avatar if it exists
      if (currentAvatarUrl && currentAvatarUrl.includes('avatars/')) {
        const oldPath = currentAvatarUrl.split('avatars/')[1];
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      setPreviewUrl(null);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAvatar = async () => {
    if (!user || !currentAvatarUrl) return;

    setIsUploading(true);
    try {
      // Delete from storage if it's a stored avatar
      if (currentAvatarUrl.includes('avatars/')) {
        const path = currentAvatarUrl.split('avatars/')[1];
        await supabase.storage.from('avatars').remove([path]);
      }

      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      onAvatarUpdate(null);
      
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });

    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Error removing avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const fallbackUrl = user?.email ? 
    `https://api.dicebear.com/7.x/avatars/svg?seed=${user.email}` : 
    null;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-4 border-primary/20 hover:border-primary/40 transition-colors group`}>
        {displayUrl || fallbackUrl ? (
          <img
            src={displayUrl || fallbackUrl!}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <User size={iconSizes[size]} className="text-muted-foreground" />
          </div>
        )}
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          {isUploading ? (
            <Loader2 size={iconSizes[size]} className="text-white animate-spin" />
          ) : (
            <Camera size={iconSizes[size]} className="text-white" />
          )}
        </div>

        {/* Remove button */}
        {currentAvatarUrl && !isUploading && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={removeAvatar}
          >
            <X size={12} />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload size={16} />
          {currentAvatarUrl ? 'Change' : 'Upload'}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};