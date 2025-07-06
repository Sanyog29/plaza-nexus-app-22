import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, Save, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export const PhotoCapture: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<string>('');
  const [photoType, setPhotoType] = useState<string>('check_in');
  const [visitors, setVisitors] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  React.useEffect(() => {
    fetchTodayVisitors();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchTodayVisitors = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('visitors')
        .select('id, name, company, visit_date, status')
        .eq('visit_date', today)
        .order('entry_time', { ascending: true });

      if (data) setVisitors(data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      toast.error('Failed to access camera');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Flip the image horizontally for selfie-style capture
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataURL);
        stopCamera();
      }
    }
  }, []);

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const uploadPhoto = async () => {
    if (!capturedPhoto || !selectedVisitor) {
      toast.error('Please select a visitor and capture a photo');
      return;
    }

    if (!photoType) {
      toast.error('Please select a photo type');
      return;
    }

    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${selectedVisitor}-${photoType}-${timestamp}.jpg`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('visitor-photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        toast.error('Failed to upload photo');
        return;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('visitor-photos')
        .getPublicUrl(filename);

      // Save photo record to database
      const { error: dbError } = await supabase
        .from('visitor_photos')
        .insert({
          visitor_id: selectedVisitor,
          photo_url: urlData.publicUrl,
          photo_type: photoType,
          captured_by: (await supabase.auth.getUser()).data.user?.id,
          metadata: {
            timestamp: new Date().toISOString(),
            filename: filename
          }
        });

      if (dbError) {
        toast.error('Failed to save photo record');
        return;
      }

      // Log the photo capture action
      await supabase.from('visitor_check_logs').insert({
        visitor_id: selectedVisitor,
        action_type: 'badge_assigned',
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        notes: `Photo captured: ${photoType}`,
        metadata: {
          photo_type: photoType,
          photo_url: urlData.publicUrl
        }
      });

      toast.success('Photo saved successfully');
      setCapturedPhoto(null);
      setSelectedVisitor('');
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to save photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Visitor Photo Capture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visitor Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visitor" className="text-white">Select Visitor</Label>
              <Select value={selectedVisitor} onValueChange={setSelectedVisitor}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Choose a visitor" />
                </SelectTrigger>
                <SelectContent>
                  {visitors.map((visitor) => (
                    <SelectItem key={visitor.id} value={visitor.id}>
                      {visitor.name} - {visitor.company || 'No Company'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoType" className="text-white">Photo Type</Label>
              <Select value={photoType} onValueChange={setPhotoType}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select photo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check_in">Check-in Photo</SelectItem>
                  <SelectItem value="profile">Profile Photo</SelectItem>
                  <SelectItem value="id_verification">ID Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Camera/Photo Display */}
          <div className="flex flex-col items-center space-y-4">
            {!isCapturing && !capturedPhoto && (
              <div className="w-full max-w-md h-60 bg-gray-800 rounded-lg flex items-center justify-center border border-border">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Camera preview will appear here</p>
                </div>
              </div>
            )}

            {isCapturing && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md rounded-lg border border-border"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute inset-0 border-2 border-plaza-blue rounded-lg pointer-events-none opacity-50"></div>
              </div>
            )}

            {capturedPhoto && (
              <div className="relative">
                <img
                  src={capturedPhoto}
                  alt="Captured visitor photo"
                  className="w-full max-w-md rounded-lg border border-border"
                />
                <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                  Captured
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-2">
            {!isCapturing && !capturedPhoto && (
              <Button onClick={startCamera} className="bg-plaza-blue hover:bg-blue-700">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            )}

            {isCapturing && (
              <>
                <Button onClick={capturePhoto} className="bg-green-600 hover:bg-green-700">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Cancel
                </Button>
              </>
            )}

            {capturedPhoto && (
              <>
                <Button onClick={uploadPhoto} disabled={uploading} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  {uploading ? 'Saving...' : 'Save Photo'}
                </Button>
                <Button onClick={retakePhoto} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
              </>
            )}
          </div>

          <div className="text-sm text-gray-400 text-center">
            <p>Capture visitor photos for security records and identification</p>
            <p>Photos are timestamped and stored securely</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};