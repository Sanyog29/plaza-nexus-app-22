import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Users, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Shield,
  Bell,
  Radio
} from 'lucide-react';

interface EmergencyManagementProps {
  status: 'normal' | 'drill' | 'emergency';
  onStatusChange: (status: 'normal' | 'drill' | 'emergency') => void;
}

interface MusterPoint {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentCount: number;
  wardens: string[];
  status: 'safe' | 'evacuating' | 'critical';
}

interface EvacuationProgress {
  totalPersons: number;
  evacuated: number;
  missing: number;
  visitors: number;
  staff: number;
}

export const EmergencyManagement: React.FC<EmergencyManagementProps> = ({
  status,
  onStatusChange
}) => {
  const [musterPoints, setMusterPoints] = useState<MusterPoint[]>([]);
  const [evacuationProgress, setEvacuationProgress] = useState<EvacuationProgress>({
    totalPersons: 0,
    evacuated: 0,
    missing: 0,
    visitors: 0,
    staff: 0
  });
  const [emergencyStartTime, setEmergencyStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  useEffect(() => {
    // Mock data - in real app, fetch from backend
    const mockMusterPoints: MusterPoint[] = [
      {
        id: '1',
        name: 'North Parking Lot',
        location: 'Building A Side',
        capacity: 100,
        currentCount: 23,
        wardens: ['John Smith', 'Sarah Johnson'],
        status: 'safe'
      },
      {
        id: '2',
        name: 'South Garden Area',
        location: 'Building B Side',
        capacity: 80,
        currentCount: 15,
        wardens: ['Mike Chen'],
        status: 'evacuating'
      },
      {
        id: '3',
        name: 'East Courtyard',
        location: 'Main Building East',
        capacity: 60,
        currentCount: 8,
        wardens: ['Emily Davis', 'Tom Wilson'],
        status: 'safe'
      }
    ];

    setMusterPoints(mockMusterPoints);
    
    const totalEvacuated = mockMusterPoints.reduce((sum, point) => sum + point.currentCount, 0);
    setEvacuationProgress({
      totalPersons: 70,
      evacuated: totalEvacuated,
      missing: 70 - totalEvacuated,
      visitors: 12,
      staff: 58
    });
  }, []);

  useEffect(() => {
    if (status !== 'normal' && !emergencyStartTime) {
      setEmergencyStartTime(new Date());
    } else if (status === 'normal') {
      setEmergencyStartTime(null);
      setElapsedTime('00:00');
    }
  }, [status, emergencyStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (emergencyStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - emergencyStartTime.getTime()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emergencyStartTime]);

  const startEmergencyDrill = () => {
    onStatusChange('drill');
  };

  const startEmergency = () => {
    onStatusChange('emergency');
  };

  const endEmergency = () => {
    onStatusChange('normal');
  };

  const getStatusColor = (pointStatus: MusterPoint['status']) => {
    switch (pointStatus) {
      case 'safe': return 'bg-green-100 text-green-800';
      case 'evacuating': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const evacuationPercentage = (evacuationProgress.evacuated / evacuationProgress.totalPersons) * 100;

  return (
    <div className="space-y-6">
      {/* Emergency Status Header */}
      <Card className={`${status === 'emergency' ? 'border-red-500 bg-red-50' : status === 'drill' ? 'border-yellow-500 bg-yellow-50' : 'bg-card/50'} backdrop-blur`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-6 w-6 ${status === 'emergency' ? 'text-red-500' : status === 'drill' ? 'text-yellow-500' : 'text-gray-500'}`} />
              Emergency Management Center
            </CardTitle>
            <div className="flex items-center gap-2">
              {status !== 'normal' && (
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {elapsedTime}
                </Badge>
              )}
              <Badge className={status === 'emergency' ? 'bg-red-500' : status === 'drill' ? 'bg-yellow-500' : 'bg-green-500'}>
                {status === 'emergency' ? 'EMERGENCY ACTIVE' : status === 'drill' ? 'DRILL IN PROGRESS' : 'NORMAL STATUS'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {status === 'normal' ? (
            <div className="flex gap-4">
              <Button onClick={startEmergencyDrill} variant="outline" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Start Emergency Drill
              </Button>
              <Button onClick={startEmergency} variant="destructive" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Declare Emergency
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {status === 'emergency' 
                    ? 'Real emergency in progress. All personnel must evacuate immediately to designated muster points.'
                    : 'Emergency drill in progress. Please proceed to your assigned muster point calmly and safely.'
                  }
                </AlertDescription>
              </Alert>
              <Button onClick={endEmergency} variant="outline" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                End {status === 'emergency' ? 'Emergency' : 'Drill'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evacuation Progress */}
      {status !== 'normal' && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Evacuation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Evacuation Progress</span>
                <span>{evacuationProgress.evacuated}/{evacuationProgress.totalPersons} ({Math.round(evacuationPercentage)}%)</span>
              </div>
              <Progress value={evacuationPercentage} className="h-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{evacuationProgress.evacuated}</p>
                  <p className="text-sm text-muted-foreground">Evacuated</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{evacuationProgress.missing}</p>
                  <p className="text-sm text-muted-foreground">Missing</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{evacuationProgress.visitors}</p>
                  <p className="text-sm text-muted-foreground">Visitors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{evacuationProgress.staff}</p>
                  <p className="text-sm text-muted-foreground">Staff</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Muster Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {musterPoints.map((point) => (
          <Card key={point.id} className="bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{point.name}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {point.location}
                  </p>
                </div>
                <Badge className={getStatusColor(point.status)}>
                  {point.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Occupancy</span>
                  <span className="font-medium">{point.currentCount}/{point.capacity}</span>
                </div>
                
                <Progress 
                  value={(point.currentCount / point.capacity) * 100} 
                  className="h-2" 
                />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Wardens:</p>
                  <div className="flex flex-wrap gap-1">
                    {point.wardens.map((warden, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {warden}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Radio className="h-3 w-3 mr-1" />
                    Contact
                  </Button>
                  <Button size="sm" variant="outline">
                    <MapPin className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency Procedures */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Emergency Procedures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Staff Responsibilities</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Ensure all visitors in your area are accounted for
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Guide visitors to the nearest muster point
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Report headcount to designated warden
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Do not re-enter building until all-clear is given
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Visitor Guidelines</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Follow your host or nearest staff member
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Move quickly but do not run
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Proceed to designated muster point
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Remain at muster point until accounted for
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};