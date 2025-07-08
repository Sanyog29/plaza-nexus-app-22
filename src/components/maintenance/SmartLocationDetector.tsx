import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Building, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LocationWithDistance {
  id: string;
  name: string;
  zone: string;
  coordinates: { lat: number; lng: number };
  distance?: number;
}

interface SmartLocationDetectorProps {
  onLocationDetected: (location: string) => void;
  currentLocation: string;
}

// Mock building locations - in real implementation, this would come from a database
const buildingLocations = [
  { id: '1', name: 'Ground Floor - Lobby', zone: 'A1', coordinates: { lat: 40.7128, lng: -74.0060 } },
  { id: '2', name: 'Ground Floor - Reception', zone: 'A2', coordinates: { lat: 40.7129, lng: -74.0061 } },
  { id: '3', name: '1st Floor - Office 101', zone: 'B1', coordinates: { lat: 40.7130, lng: -74.0062 } },
  { id: '4', name: '1st Floor - Conference Room A', zone: 'B2', coordinates: { lat: 40.7131, lng: -74.0063 } },
  { id: '5', name: '2nd Floor - Office 201', zone: 'C1', coordinates: { lat: 40.7132, lng: -74.0064 } },
  { id: '6', name: '2nd Floor - Break Room', zone: 'C2', coordinates: { lat: 40.7133, lng: -74.0065 } },
  { id: '7', name: 'Basement - Storage', zone: 'D1', coordinates: { lat: 40.7127, lng: -74.0059 } },
  { id: '8', name: 'Rooftop - HVAC Area', zone: 'E1', coordinates: { lat: 40.7134, lng: -74.0066 } },
];

const SmartLocationDetector: React.FC<SmartLocationDetectorProps> = ({
  onLocationDetected,
  currentLocation
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [nearbyLocations, setNearbyLocations] = useState<LocationWithDistance[]>([]);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
      } catch (error) {
        setPermissionStatus('unknown');
      }
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const detectLocation = async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsDetecting(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setUserCoordinates({ lat: latitude, lng: longitude });

      // Find nearby locations
      const locationsWithDistance = buildingLocations.map(location => ({
        ...location,
        distance: calculateDistance(latitude, longitude, location.coordinates.lat, location.coordinates.lng)
      }));

      // Sort by distance and get closest locations
      const sortedLocations = locationsWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3); // Show top 3 closest locations

      setNearbyLocations(sortedLocations);

      // Auto-select the closest location if it's very close (within 10 meters)
      if (sortedLocations[0] && sortedLocations[0].distance < 10) {
        onLocationDetected(sortedLocations[0].name);
      }

    } catch (error: any) {
      console.error('Location detection failed:', error);
      
      let errorMessage = 'Location detection failed. ';
      if (error.code === 1) {
        errorMessage += 'Please allow location access and try again.';
        setPermissionStatus('denied');
      } else if (error.code === 2) {
        errorMessage += 'Location information is unavailable.';
      } else if (error.code === 3) {
        errorMessage += 'Location request timed out.';
      }
      
      // Fallback to showing all locations for manual selection
      setNearbyLocations(buildingLocations.slice(0, 5));
    } finally {
      setIsDetecting(false);
    }
  };

  const selectLocation = (location: string) => {
    onLocationDetected(location);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Smart Location Detection</h3>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={detectLocation}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              {isDetecting ? 'Detecting...' : 'Detect Location'}
            </Button>
          </div>

          {permissionStatus === 'denied' && (
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
              📍 Location access denied. Please enable location services to use automatic detection.
            </div>
          )}

          {nearbyLocations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                {userCoordinates ? 'Nearby Locations' : 'Building Locations'}
              </h4>
              <div className="grid gap-2">
                {nearbyLocations.map((location) => (
                  <div
                    key={location.id}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                      currentLocation === location.name 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => selectLocation(location.name)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-muted-foreground">Zone: {location.zone}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {userCoordinates && location.distance !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {location.distance < 1000 
                            ? `${Math.round(location.distance)}m` 
                            : `${(location.distance / 1000).toFixed(1)}km`}
                        </Badge>
                      )}
                      {currentLocation === location.name && (
                        <Badge className="text-xs">Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nearbyLocations.length === 0 && !isDetecting && (
            <div className="text-center text-muted-foreground text-sm py-4">
              <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Click "Detect Location" to find nearby areas, or manually enter your location above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartLocationDetector;