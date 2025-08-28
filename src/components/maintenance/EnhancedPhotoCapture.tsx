import React, { useState, useRef, useCallback } from 'react';
import { Camera, Video, X, Zap, ZapOff, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

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

interface EnhancedPhotoCaptureProps {
  onMediaCaptured: (media: CapturedMedia[]) => void;
  disabled?: boolean;
}

const EnhancedPhotoCapture: React.FC<EnhancedPhotoCaptureProps> = ({
  onMediaCaptured,
  disabled = false
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Enhanced AI analysis for maintenance issues
  const analyzeMedia = async (blob: Blob, type: 'photo' | 'video'): Promise<CapturedMedia['analysis']> => {
    // Mock AI analysis - in real implementation, this would call an AI service
    const size = blob.size;
    
    // Simulate analysis based on file characteristics
    if (size > 2000000) { // Large file, likely detailed
      return {
        category: 'structural',
        urgency: 'high',
        description: 'Detailed visual documentation captured - potential structural issue'
      };
    } else if (type === 'video') {
      return {
        category: 'mechanical',
        urgency: 'medium',
        description: 'Video documentation of mechanical issue'
      };
    } else {
      return {
        category: 'general',
        urgency: 'medium',
        description: 'Visual documentation of maintenance issue'
      };
    }
  };

  const startCamera = useCallback(async () => {
    try {
      // Check for secure context
      if (!navigator.mediaDevices || window.isSecureContext === false) {
        console.error('Camera requires HTTPS or localhost');
        toast({
          title: "Camera Error",
          description: "Camera requires HTTPS or localhost",
          variant: "destructive"
        });
        return;
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const baseConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false // Remove audio to avoid permission issues
      };

      let stream: MediaStream;
      
      try {
        // Try preferred facing mode
        stream = await navigator.mediaDevices.getUserMedia(baseConstraints);
      } catch (error) {
        console.warn('getUserMedia failed with preferred facing, trying fallback...', error);
        // Fallback to any available camera
        const fallbackConstraints = {
          video: { 
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // iOS/Safari requirements
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        video.autoplay = true;
        
        video.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for metadata to load before playing
        await new Promise<void>((resolve) => {
          const onLoaded = () => {
            resolve();
          };
          video.addEventListener('loadedmetadata', onLoaded, { once: true });
        });
        
        // Explicit play call
        try {
          await video.play();
          setIsStreaming(true);
        } catch (playError) {
          console.warn('video.play() was blocked:', playError);
          setIsStreaming(true); // Still set streaming, user might need to interact
        }
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Trying alternative methods...",
        variant: "destructive"
      });
      
      // Show native camera as fallback for mobile
      if (Capacitor.isNativePlatform()) {
        try {
          await captureWithNativeCamera();
        } catch (nativeError) {
          console.error('Native camera failed:', nativeError);
          // Final fallback: file input
          captureWithFileInput();
        }
      } else {
        // Web fallback: file input
        captureWithFileInput();
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
  }, []);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Camera Error",
        description: "Camera not ready. Please try again in a moment.",
        variant: "destructive"
      });
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply flash effect if enabled
    if (flashEnabled) {
      const flashOverlay = document.createElement('div');
      flashOverlay.style.position = 'fixed';
      flashOverlay.style.top = '0';
      flashOverlay.style.left = '0';
      flashOverlay.style.width = '100%';
      flashOverlay.style.height = '100%';
      flashOverlay.style.backgroundColor = 'white';
      flashOverlay.style.zIndex = '9999';
      flashOverlay.style.pointerEvents = 'none';
      document.body.appendChild(flashOverlay);

      setTimeout(() => {
        document.body.removeChild(flashOverlay);
      }, 100);
    }

    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const analysis = await analyzeMedia(blob, 'photo');
      
      const media: CapturedMedia = {
        id: Date.now().toString(),
        type: 'photo',
        blob,
        url: URL.createObjectURL(blob),
        timestamp: new Date(),
        analysis
      };

      setCapturedMedia(prev => [...prev, media]);
      
      toast({
        title: "📸 Photo Captured",
        description: analysis.description || "Photo captured successfully"
      });
    }, 'image/jpeg', 0.92);
  };

  const captureWithNativeCamera = async () => {
    try {
      const photo = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        correctOrientation: true,
        saveToGallery: false,
      });

      if (photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const analysis = await analyzeMedia(blob, 'photo');
        
        const media: CapturedMedia = {
          id: Date.now().toString(),
          type: 'photo',
          blob,
          url: URL.createObjectURL(blob),
          timestamp: new Date(),
          analysis
        };

        setCapturedMedia(prev => [...prev, media]);
        
        toast({
          title: "📸 Photo Captured",
          description: analysis.description || "Photo captured successfully"
        });
      }
    } catch (error) {
      console.error('Native camera capture failed:', error);
      toast({
        title: "Camera Error",
        description: "Native camera capture failed",
        variant: "destructive"
      });
    }
  };

  const captureWithFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const analysis = await analyzeMedia(file, 'photo');
        
        const media: CapturedMedia = {
          id: Date.now().toString(),
          type: 'photo',
          blob: file,
          url: URL.createObjectURL(file),
          timestamp: new Date(),
          analysis
        };

        setCapturedMedia(prev => [...prev, media]);
        
        toast({
          title: "📸 Photo Selected",
          description: analysis.description || "Photo selected successfully"
        });
      }
    };
    
    input.click();
  };

  const startVideoRecording = async () => {
    if (!streamRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const analysis = await analyzeMedia(blob, 'video');
        
        const media: CapturedMedia = {
          id: Date.now().toString(),
          type: 'video',
          blob,
          url: URL.createObjectURL(blob),
          timestamp: new Date(),
          analysis
        };

        setCapturedMedia(prev => [...prev, media]);
        
        toast({
          title: "🎥 Video Recorded",
          description: analysis.description || "Video recorded successfully"
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Unable to start video recording",
        variant: "destructive"
      });
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeMedia = (id: string) => {
    setCapturedMedia(prev => {
      const updated = prev.filter(media => media.id !== id);
      // Revoke object URL to free memory
      const toRemove = prev.find(media => media.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.url);
      }
      return updated;
    });
  };

  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    if (isStreaming) {
      stopCamera();
      // Small delay to ensure cleanup is complete
      setTimeout(() => startCamera(), 200);
    }
  };

  const finishCapture = () => {
    onMediaCaptured(capturedMedia);
    stopCamera();
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
      {!isStreaming ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Enhanced Photo & Video Capture</h3>
            <p className="text-muted-foreground mb-4">
              Capture high-quality photos and videos with AI-powered analysis
            </p>
            <Button onClick={startCamera} disabled={disabled}>
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Camera View */}
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover bg-black"
                playsInline
                muted
                autoPlay
                style={{ background: '#000' }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setFlashEnabled(!flashEnabled)}
                >
                  {flashEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={switchCamera}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                <Button
                  size="lg"
                  onClick={capturePhoto}
                  className="rounded-full w-16 h-16 p-0"
                  disabled={disabled}
                >
                  <Camera className="w-6 h-6" />
                </Button>
                
                <Button
                  size="lg"
                  variant={isRecording ? "destructive" : "secondary"}
                  onClick={isRecording ? stopVideoRecording : startVideoRecording}
                  className="rounded-full w-16 h-16 p-0"
                  disabled={disabled}
                >
                  <Video className="w-6 h-6" />
                </Button>
              </div>
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-medium">REC</span>
                </div>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={stopCamera}
                className="absolute top-4 left-4"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Captured Media Preview */}
      {capturedMedia.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Captured Media ({capturedMedia.length})</h4>
          <div className="grid grid-cols-2 gap-3">
            {capturedMedia.map((media) => (
              <Card key={media.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="aspect-video bg-muted rounded-lg mb-2 relative overflow-hidden">
                    {media.type === 'photo' ? (
                      <img 
                        src={media.url} 
                        alt="Captured" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video 
                        src={media.url} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeMedia(media.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {/* AI Analysis */}
                  {media.analysis && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Badge variant={getUrgencyColor(media.analysis.urgency)} className="text-xs">
                          {media.analysis.urgency === 'urgent' && '🚨 '}
                          {media.analysis.urgency === 'high' && '⚡ '}
                          {media.analysis.urgency?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {media.analysis.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {media.analysis.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={finishCapture} disabled={disabled} className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Use Captured Media ({capturedMedia.length})
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCapturedMedia([])}
              disabled={disabled}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPhotoCapture;