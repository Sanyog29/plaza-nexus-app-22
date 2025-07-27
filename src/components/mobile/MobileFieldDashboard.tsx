import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import {
  MapPin,
  Clock,
  CheckCircle,
  Camera,
  MessageSquare,
  Navigation,
  Battery,
  Signal,
  User,
  AlertTriangle,
  QrCode,
  Clipboard,
  Navigation2
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  estimatedTime: number; // minutes
  status: 'pending' | 'in_progress' | 'completed';
  assignedAt: string;
  dueAt: string;
  checklistItems?: string[];
  requiresPhoto?: boolean;
}

interface LocationInfo {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export const MobileFieldDashboard = () => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Mock tasks data
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'HVAC Filter Replacement',
      description: 'Replace air filters in 5th floor HVAC units',
      priority: 'high',
      location: 'Building A - Floor 5',
      estimatedTime: 45,
      status: 'pending',
      assignedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      checklistItems: ['Turn off HVAC unit', 'Remove old filter', 'Install new filter', 'Test operation'],
      requiresPhoto: true
    },
    {
      id: '2',
      title: 'Emergency Exit Inspection',
      description: 'Check all emergency exits and lighting',
      priority: 'medium',
      location: 'All Floors',
      estimatedTime: 30,
      status: 'in_progress',
      assignedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      dueAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      checklistItems: ['Check door mechanism', 'Test emergency lighting', 'Verify exit signs'],
      requiresPhoto: true
    },
    {
      id: '3',
      title: 'Restroom Supply Check',
      description: 'Restock supplies in all restrooms',
      priority: 'low',
      location: 'All Floors',
      estimatedTime: 20,
      status: 'completed',
      assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      dueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      checklistItems: ['Check toilet paper', 'Refill soap dispensers', 'Check towels'],
      requiresPhoto: false
    }
  ]);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          });
        },
        (error) => console.log('Location error:', error)
      );
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get battery info (if supported)
    if ('getBattery' in navigator) {
      // @ts-ignore
      navigator.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const startTask = (task: Task) => {
    setActiveTask(task);
    // Update task status to in_progress
  };

  const completeTask = () => {
    // Mark task as completed
    setActiveTask(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Status Bar */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {user?.user_metadata?.first_name || 'Field Worker'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  {currentLocation ? 'Location Active' : 'Getting Location...'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {batteryLevel && (
                <div className="flex items-center gap-1">
                  <Battery className="h-4 w-4" />
                  <span className="text-sm">{batteryLevel}%</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Signal className={`h-4 w-4 ${isOnline ? 'text-green-400' : 'text-red-400'}`} />
                <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Task (if any) */}
      {activeTask && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Active Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">{activeTask.title}</h3>
              <p className="text-sm text-muted-foreground">{activeTask.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{activeTask.location}</span>
              </div>
            </div>
            
            {activeTask.checklistItems && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Checklist:</h4>
                {activeTask.checklistItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              {activeTask.requiresPhoto && (
                <Button size="sm" variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              )}
              
              <Button size="sm" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              
              <Button size="sm" onClick={completeTask}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="patrol">Patrol</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-card/30 backdrop-blur">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{task.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{task.estimatedTime} min</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    
                    {task.status === 'pending' && (
                      <Button size="sm" onClick={() => startTask(task)}>
                        Start Task
                      </Button>
                    )}
                    
                    {task.status === 'in_progress' && (
                      <Button size="sm" variant="outline" onClick={() => setActiveTask(task)}>
                        Continue
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="patrol" className="space-y-4">
          <Card className="bg-card/30 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Patrol
              </CardTitle>
              <CardDescription>
                Scan checkpoints and complete inspections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">
                <QrCode className="h-4 w-4 mr-2" />
                Start Patrol Session
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Clipboard className="h-4 w-4 mr-2" />
                  Checklist
                </Button>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card/30 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Navigation2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">Navigation</h3>
                <p className="text-sm text-muted-foreground">Get directions</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                <h3 className="font-medium">Emergency</h3>
                <p className="text-sm text-muted-foreground">Report incident</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                <h3 className="font-medium">Support</h3>
                <p className="text-sm text-muted-foreground">Contact team</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Clipboard className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <h3 className="font-medium">Reports</h3>
                <p className="text-sm text-muted-foreground">Submit report</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};