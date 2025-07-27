import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Camera, CheckCircle, AlertTriangle, MapPin, Clock, User, FileImage } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useAuth } from '@/components/AuthProvider';

interface PatrolLocation {
  id: string;
  name: string;
  location_code: string;
  department: 'security' | 'housekeeping' | 'maintenance';
  required_checks: string[];
  coordinates?: { lat: number; lng: number };
}

interface PatrolSession {
  id: string;
  staff_id: string;
  patrol_type: 'security' | 'housekeeping';
  start_time: string;
  end_time?: string;
  total_locations: number;
  completed_locations: number;
  status: 'active' | 'completed' | 'paused';
}

interface PatrolCheck {
  id: string;
  session_id: string;
  location_id: string;
  check_time: string;
  checklist_completed: boolean;
  images_captured: string[];
  notes?: string;
  gps_coordinates?: { lat: number; lng: number };
}

export const AdvancedQRPatrolSystem: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<PatrolSession | null>(null);
  const [currentLocation, setCurrentLocation] = useState<PatrolLocation | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentChecklist, setCurrentChecklist] = useState<Record<string, boolean>>({});
  const [patrolNotes, setPatrolNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardcoded patrol locations (since database tables don't exist yet)
  const patrolLocations: PatrolLocation[] = [
    {
      id: 'entrance-main',
      name: 'Main Entrance',
      location_code: 'ENT-001',
      department: 'security',
      required_checks: ['Check ID scanners', 'Verify access control', 'Monitor CCTV', 'Log visitor activity']
    },
    {
      id: 'lobby-level1',
      name: 'Ground Floor Lobby',
      location_code: 'LOB-001',
      department: 'housekeeping',
      required_checks: ['Clean reception area', 'Empty trash bins', 'Check lighting', 'Sanitize surfaces']
    },
    {
      id: 'parking-basement',
      name: 'Basement Parking',
      location_code: 'PRK-B01',
      department: 'security',
      required_checks: ['Check vehicle access', 'Verify lighting', 'Inspect emergency exits', 'Monitor security cameras']
    },
    {
      id: 'restroom-floor2',
      name: 'Floor 2 Restrooms',
      location_code: 'RST-002',
      department: 'housekeeping',
      required_checks: ['Restock supplies', 'Clean facilities', 'Check plumbing', 'Sanitize surfaces']
    },
    {
      id: 'emergency-stair-a',
      name: 'Emergency Stairwell A',
      location_code: 'EMR-STA',
      department: 'security',
      required_checks: ['Check emergency lighting', 'Verify exit signs', 'Test door locks', 'Clear pathways']
    }
  ];

  const startPatrolSession = async (patrolType: 'security' | 'housekeeping') => {
    const relevantLocations = patrolLocations.filter(loc => loc.department === patrolType);
    
    const newSession = {
      staff_id: user!.id,
      patrol_type: patrolType,
      start_time: new Date().toISOString(),
      total_locations: relevantLocations.length,
      completed_locations: 0,
      status: 'active' as const
    };

    // For now, just set the session locally (database tables not available)
    const sessionWithId = {
      ...newSession,
      id: `session-${Date.now()}`
    };

    setActiveSession(sessionWithId);
    toast.success(`${patrolType} patrol session started`);
  };

  const startScanning = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not supported on this device');
        return;
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);

        reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            try {
              const locationCode = result.getText();
              const location = patrolLocations.find(loc => loc.location_code === locationCode);
              
              if (location) {
                handleLocationScanned(location);
                stopScanning();
              } else {
                toast.error('Invalid patrol location QR code');
              }
            } catch (err) {
              console.error('Error processing QR code:', err);
              toast.error('Invalid QR code format');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast.error('Failed to start camera');
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleLocationScanned = (location: PatrolLocation) => {
    if (!activeSession) {
      toast.error('No active patrol session');
      return;
    }

    // Check if location is relevant to current patrol type
    if (location.department !== activeSession.patrol_type) {
      toast.error(`This location is for ${location.department} patrol only`);
      return;
    }

    setCurrentLocation(location);
    setCurrentChecklist(
      location.required_checks.reduce((acc, check) => ({
        ...acc,
        [check]: false
      }), {})
    );
    setCapturedImages([]);
    setPatrolNotes('');
    
    toast.success(`Scanned: ${location.name}`);
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setProcessing(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            if (newImages.length === files.length) {
              setCapturedImages(prev => [...prev, ...newImages]);
              setProcessing(false);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const completeLocationCheck = async () => {
    if (!currentLocation || !activeSession) return;

    const allChecked = Object.values(currentChecklist).every(checked => checked);
    
    if (!allChecked) {
      toast.error('Please complete all checklist items');
      return;
    }

    if (capturedImages.length === 0) {
      toast.error('Please capture at least one image for verification');
      return;
    }

    const patrolCheck = {
      session_id: activeSession.id,
      location_id: currentLocation.id,
      check_time: new Date().toISOString(),
      checklist_completed: true,
      images_captured: capturedImages,
      notes: patrolNotes,
      gps_coordinates: await getCurrentLocation()
    };

    // For now, just log the patrol check and update session locally
    console.log('Patrol check completed:', patrolCheck);

    // Update session progress
    const updatedSession = {
      ...activeSession,
      completed_locations: activeSession.completed_locations + 1
    };

    setActiveSession(updatedSession);

    toast.success(`${currentLocation.name} check completed`);
    setCurrentLocation(null);
    setCurrentChecklist({});
    setCapturedImages([]);
    setPatrolNotes('');

    // Check if patrol is complete
    if (updatedSession.completed_locations >= updatedSession.total_locations) {
      await completePatrolSession();
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number } | undefined> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => resolve(undefined)
        );
      } else {
        resolve(undefined);
      }
    });
  };

  const completePatrolSession = async () => {
    if (!activeSession) return;

    // For now, just complete the session locally
    console.log('Patrol session completed:', {
      ...activeSession,
      end_time: new Date().toISOString(),
      status: 'completed'
    });

    setActiveSession(null);
    toast.success('Patrol session completed successfully!');
  };

  const getProgressPercentage = () => {
    if (!activeSession) return 0;
    return (activeSession.completed_locations / activeSession.total_locations) * 100;
  };

  const getRemainingLocations = () => {
    if (!activeSession) return [];
    return patrolLocations.filter(loc => 
      loc.department === activeSession.patrol_type
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Patrol System</h2>
          <p className="text-gray-400">QR-based patrol with checklists and image verification</p>
        </div>
        
        {!activeSession && (
          <div className="flex gap-2">
            <Button onClick={() => startPatrolSession('security')} className="bg-blue-600 hover:bg-blue-700">
              Start Security Patrol
            </Button>
            <Button onClick={() => startPatrolSession('housekeeping')} className="bg-green-600 hover:bg-green-700">
              Start Housekeeping Patrol
            </Button>
          </div>
        )}
      </div>

      {activeSession && (
        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Active {activeSession.patrol_type} Patrol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">
                  {activeSession.completed_locations} / {activeSession.total_locations} locations
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
            
            <div className="text-sm text-gray-400">
              Started: {new Date(activeSession.start_time).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
          <TabsTrigger value="checklist" disabled={!currentLocation}>Current Check</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan Patrol Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {!isScanning ? (
                  <Button 
                    onClick={startScanning} 
                    className="bg-primary hover:bg-primary/90"
                    disabled={!activeSession}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="destructive">
                    Stop Scanning
                  </Button>
                )}
              </div>

              {!activeSession && (
                <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400">Start a patrol session first to begin scanning locations</p>
                </div>
              )}

              {isScanning && (
                <div className="relative max-w-md mx-auto">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border border-border"
                  />
                  <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          {currentLocation ? (
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {currentLocation.name}
                </CardTitle>
                <p className="text-gray-400">Code: {currentLocation.location_code}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-white font-medium mb-3">Required Checks</h4>
                  <div className="space-y-2">
                    {currentLocation.required_checks.map((check) => (
                      <label key={check} className="flex items-center gap-3 p-2 rounded border border-border/20">
                        <input
                          type="checkbox"
                          checked={currentChecklist[check] || false}
                          onChange={(e) => setCurrentChecklist(prev => ({
                            ...prev,
                            [check]: e.target.checked
                          }))}
                          className="rounded"
                        />
                        <span className="text-gray-300">{check}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Verification Images
                  </h4>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full mb-3"
                    disabled={processing}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {processing ? 'Processing...' : 'Capture Images'}
                  </Button>
                  
                  {capturedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {capturedImages.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Verification ${index + 1}`}
                          className="w-full h-20 object-cover rounded border border-border"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Notes (Optional)</label>
                  <textarea
                    value={patrolNotes}
                    onChange={(e) => setPatrolNotes(e.target.value)}
                    placeholder="Add any additional notes or observations..."
                    className="w-full p-3 bg-background border border-border rounded-lg text-foreground"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={completeLocationCheck}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!Object.values(currentChecklist).every(checked => checked) || capturedImages.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Check
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-8 text-gray-400">
              <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Scan a location QR code to start the checklist</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <div className="grid gap-4">
            {getRemainingLocations().map((location) => (
              <Card key={location.id} className="bg-card/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-medium">{location.name}</h4>
                      <p className="text-gray-400 text-sm">Code: {location.location_code}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {location.required_checks.map((check) => (
                          <Badge key={check} variant="secondary" className="text-xs">
                            {check}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge variant={location.department === 'security' ? 'default' : 'secondary'}>
                      {location.department}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};