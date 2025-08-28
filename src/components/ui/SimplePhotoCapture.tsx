import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';

interface CapturedMedia {
  id: string;
  type: 'photo';
  blob: Blob;
  url: string;
  timestamp: Date;
}

interface SimplePhotoCaptureProps {
  onMediaCaptured: (media: CapturedMedia[]) => void;
  disabled?: boolean;
}

export function SimplePhotoCapture({ onMediaCaptured, disabled }: SimplePhotoCaptureProps) {
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedMedia[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: CapturedMedia[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const photo: CapturedMedia = {
          id: `${Date.now()}-${Math.random()}`,
          type: 'photo',
          blob: file,
          url: URL.createObjectURL(file),
          timestamp: new Date()
        };
        newPhotos.push(photo);
      }
    });

    if (newPhotos.length > 0) {
      const updatedPhotos = [...capturedPhotos, ...newPhotos];
      setCapturedPhotos(updatedPhotos);
      onMediaCaptured(updatedPhotos);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (photoId: string) => {
    const updatedPhotos = capturedPhotos.filter(photo => {
      if (photo.id === photoId) {
        URL.revokeObjectURL(photo.url);
        return false;
      }
      return true;
    });
    setCapturedPhotos(updatedPhotos);
    onMediaCaptured(updatedPhotos);
  };

  const triggerCapture = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={triggerCapture}
          disabled={disabled}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={triggerCapture}
          disabled={disabled}
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose File
        </Button>
      </div>

      {capturedPhotos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {capturedPhotos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url}
                alt="Captured"
                className="w-full h-20 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}