import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  Search,
  Scan
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'entry' | 'exit' | 'alert' | 'verification';
  visitor: string;
  location: string;
  status: 'success' | 'failed' | 'pending';
  details: string;
  image?: string;
}

interface AccessPoint {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  lastActivity: string;
  todayCount: number;
}

export const SecurityConsole: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<string>('main-entrance');

  useEffect(() => {
    // Mock data - in real app, fetch from backend
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        timestamp: '14:23:15',
        type: 'entry',
        visitor: 'John Doe',
        location: 'Main Entrance',
        status: 'success',
        details: 'QR code verified, face match confirmed'
      },
      {
        id: '2',
        timestamp: '14:20:42',
        type: 'alert',
        visitor: 'Unknown Person',
        location: 'Side Entrance',
        status: 'failed',
        details: 'Unauthorized access attempt, no valid QR code'
      },
      {
        id: '3',
        timestamp: '14:18:30',
        type: 'verification',
        visitor: 'Jane Smith',
        location: 'Main Entrance',
        status: 'pending',
        details: 'Face recognition inconclusive, manual verification required'
      },
      {
        id: '4',
        timestamp: '14:15:18',
        type: 'exit',
        visitor: 'Bob Wilson',
        location: 'Main Entrance',
        status: 'success',
        details: 'Normal exit, visit duration: 2h 30m'
      }
    ];

    const mockAccessPoints: AccessPoint[] = [
      {
        id: 'main-entrance',
        name: 'Main Entrance',
        location: 'Building A - Front',
        status: 'online',
        lastActivity: '2 minutes ago',
        todayCount: 47
      },
      {
        id: 'side-entrance',
        name: 'Side Entrance',
        location: 'Building A - East',
        status: 'online',
        lastActivity: '5 minutes ago',
        todayCount: 12
      },
      {
        id: 'loading-bay',
        name: 'Loading Bay',
        location: 'Building B - Rear',
        status: 'maintenance',
        lastActivity: '1 hour ago',
        todayCount: 8
      },
      {
        id: 'emergency-exit',
        name: 'Emergency Exit',
        location: 'Building A - West',
        status: 'online',
        lastActivity: '30 minutes ago',
        todayCount: 2
      }
    ];

    setSecurityEvents(mockEvents);
    setAccessPoints(mockAccessPoints);
  }, []);

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'entry': return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'exit': return <XCircle className="h-4 w-4 text-blue-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'verification': return <Eye className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAccessPointStatus = (status: AccessPoint['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredEvents = securityEvents.filter(event =>
    event.visitor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVerifyVisitor = (eventId: string) => {
    setSecurityEvents(prev => prev.map(event =>
      event.id === eventId
        ? { ...event, status: 'success' as const, details: 'Manually verified by security' }
        : event
    ));
  };

  const handleDenyAccess = (eventId: string) => {
    setSecurityEvents(prev => prev.map(event =>
      event.id === eventId
        ? { ...event, status: 'failed' as const, details: 'Access denied by security' }
        : event
    ));
  };

  return (
    <div className="space-y-6">
      {/* Live Camera Feed */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Live Security Feed
            </CardTitle>
            <div className="flex items-center gap-2">
              <select 
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="bg-background border border-border rounded px-3 py-1 text-sm"
              >
                {accessPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline">
                <Scan className="h-4 w-4 mr-1" />
                Full Screen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Live feed from {accessPoints.find(p => p.id === selectedCamera)?.name}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-500">LIVE</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Points Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {accessPoints.map((point) => (
          <Card key={point.id} className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm">{point.name}</h3>
                  {getAccessPointStatus(point.status)}
                </div>
                <p className="text-xs text-muted-foreground">{point.location}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Today's Count:</span>
                    <span className="font-medium">{point.todayCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Last Activity:</span>
                    <span className="text-muted-foreground">{point.lastActivity}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Events */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Security Events
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div key={event.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getEventIcon(event.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{event.visitor}</span>
                        {getStatusBadge(event.status)}
                        <span className="text-sm text-muted-foreground">{event.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{event.location}</p>
                      <p className="text-sm">{event.details}</p>
                    </div>
                  </div>
                  
                  {event.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerifyVisitor(event.id)}
                        className="h-8"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDenyAccess(event.id)}
                        className="h-8"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Deny
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <div className="space-y-3">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Unauthorized access attempt detected at Side Entrance. Manual verification required.
          </AlertDescription>
        </Alert>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Quick Security Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <AlertTriangle className="h-6 w-6 mb-1" />
              <span className="text-sm">Security Alert</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <UserCheck className="h-6 w-6 mb-1" />
              <span className="text-sm">Manual Check-in</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <Camera className="h-6 w-6 mb-1" />
              <span className="text-sm">Record Event</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <XCircle className="h-6 w-6 mb-1" />
              <span className="text-sm">Lockdown</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};