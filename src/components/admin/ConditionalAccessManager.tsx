import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useTabTransition } from '@/hooks/useTransitionState';
import { 
  Clock, 
  MapPin, 
  Shield, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Key,
  Timer,
  Building,
  Settings,
  Plus,
  Trash2
} from 'lucide-react';

interface TimeRestriction {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  timezone: string;
  emergencyOverride: boolean;
}

interface LocationRestriction {
  id: string;
  name: string;
  type: 'ip_range' | 'geofence' | 'building';
  rules: string[];
  description: string;
  emergencyOverride: boolean;
}

interface ConditionalRule {
  id: string;
  name: string;
  feature: string;
  conditions: {
    timeRestrictions: string[];
    locationRestrictions: string[];
    roleRequirements: string[];
    departmentRequirements: string[];
  };
  action: 'allow' | 'deny' | 'request_approval';
  priority: number;
  isActive: boolean;
  emergencyOverride: boolean;
  auditLog: boolean;
}

interface EmergencyAccess {
  id: string;
  userId: string;
  reason: string;
  features: string[];
  grantedBy: string;
  expiresAt: string;
  isActive: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const SAMPLE_FEATURES = [
  'csvImportEnabled',
  'dataExportEnabled', 
  'forecastingEnabled',
  'realTimeUpdatesEnabled',
  'bulkOperationsEnabled',
  'autoReportingEnabled'
];

export function ConditionalAccessManager() {
  const { isAdmin, userRole } = useAuth();
  const { toast } = useToast();
  
  const [timeRestrictions, setTimeRestrictions] = useState<TimeRestriction[]>([]);
  const [locationRestrictions, setLocationRestrictions] = useState<LocationRestriction[]>([]);
  const [conditionalRules, setConditionalRules] = useState<ConditionalRule[]>([]);
  const [emergencyAccess, setEmergencyAccess] = useState<EmergencyAccess[]>([]);
  const [activeTab, setActiveTab] = useTabTransition('time');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with sample data
  useEffect(() => {
    const sampleTimeRestrictions: TimeRestriction[] = [
      {
        id: '1',
        name: 'Business Hours',
        startTime: '08:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        timezone: 'UTC',
        emergencyOverride: true
      },
      {
        id: '2', 
        name: 'Finance Access Window',
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        timezone: 'UTC',
        emergencyOverride: false
      }
    ];

    const sampleLocationRestrictions: LocationRestriction[] = [
      {
        id: '1',
        name: 'Corporate Network',
        type: 'ip_range',
        rules: ['192.168.1.0/24', '10.0.0.0/16'],
        description: 'Access from corporate IP ranges only',
        emergencyOverride: true
      },
      {
        id: '2',
        name: 'Main Building',
        type: 'geofence',
        rules: ['40.7128,-74.0060,500m'],
        description: 'Within 500m of main building',
        emergencyOverride: false
      }
    ];

    const sampleConditionalRules: ConditionalRule[] = [
      {
        id: '1',
        name: 'Finance Data Export Restriction',
        feature: 'dataExportEnabled',
        conditions: {
          timeRestrictions: ['2'],
          locationRestrictions: ['1'],
          roleRequirements: ['fin_analyst', 'admin'],
          departmentRequirements: ['finance', 'administration']
        },
        action: 'allow',
        priority: 1,
        isActive: true,
        emergencyOverride: false,
        auditLog: true
      },
      {
        id: '2',
        name: 'Bulk Operations Security',
        feature: 'bulkOperationsEnabled',
        conditions: {
          timeRestrictions: ['1'],
          locationRestrictions: ['1'],
          roleRequirements: ['admin', 'ops_supervisor'],
          departmentRequirements: []
        },
        action: 'request_approval',
        priority: 2,
        isActive: true,
        emergencyOverride: true,
        auditLog: true
      }
    ];

    setTimeRestrictions(sampleTimeRestrictions);
    setLocationRestrictions(sampleLocationRestrictions);
    setConditionalRules(sampleConditionalRules);
  }, []);

  const createTimeRestriction = () => {
    const newRestriction: TimeRestriction = {
      id: Date.now().toString(),
      name: 'New Time Restriction',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      timezone: 'UTC',
      emergencyOverride: true
    };
    setTimeRestrictions(prev => [...prev, newRestriction]);
  };

  const updateTimeRestriction = (id: string, updates: Partial<TimeRestriction>) => {
    setTimeRestrictions(prev => 
      prev.map(restriction => 
        restriction.id === id ? { ...restriction, ...updates } : restriction
      )
    );
  };

  const deleteTimeRestriction = (id: string) => {
    setTimeRestrictions(prev => prev.filter(restriction => restriction.id !== id));
  };

  const createLocationRestriction = () => {
    const newRestriction: LocationRestriction = {
      id: Date.now().toString(),
      name: 'New Location Restriction',
      type: 'ip_range',
      rules: [''],
      description: '',
      emergencyOverride: true
    };
    setLocationRestrictions(prev => [...prev, newRestriction]);
  };

  const updateLocationRestriction = (id: string, updates: Partial<LocationRestriction>) => {
    setLocationRestrictions(prev =>
      prev.map(restriction =>
        restriction.id === id ? { ...restriction, ...updates } : restriction
      )
    );
  };

  const deleteLocationRestriction = (id: string) => {
    setLocationRestrictions(prev => prev.filter(restriction => restriction.id !== id));
  };

  const grantEmergencyAccess = async (userId: string, reason: string, features: string[], durationHours: number) => {
    const newAccess: EmergencyAccess = {
      id: Date.now().toString(),
      userId,
      reason,
      features,
      grantedBy: userRole || 'admin',
      expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
      isActive: true
    };

    setEmergencyAccess(prev => [...prev, newAccess]);
    
    toast({
      title: "Emergency Access Granted",
      description: `Access granted for ${durationHours} hours`,
    });
  };

  const revokeEmergencyAccess = (id: string) => {
    setEmergencyAccess(prev =>
      prev.map(access =>
        access.id === id ? { ...access, isActive: false } : access
      )
    );
    
    toast({
      title: "Emergency Access Revoked",
      description: "Access has been revoked successfully",
    });
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground">You need administrator privileges to manage conditional access controls.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Conditional Access Manager
          </h3>
          <p className="text-muted-foreground">
            Configure time-based, location-based, and conditional access controls with emergency override capabilities.
          </p>
        </div>
        <Button>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Emergency Override
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Restrictions
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location Restrictions
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Conditional Rules
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Emergency Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium">Time-Based Access Controls</h4>
            <Button onClick={createTimeRestriction}>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Restriction
            </Button>
          </div>

          <div className="grid gap-4">
            {timeRestrictions.map((restriction) => (
              <Card key={restriction.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Input
                        value={restriction.name}
                        onChange={(e) => updateTimeRestriction(restriction.id, { name: e.target.value })}
                        className="font-medium text-base"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTimeRestriction(restriction.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={restriction.startTime}
                        onChange={(e) => updateTimeRestriction(restriction.id, { startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={restriction.endTime}
                        onChange={(e) => updateTimeRestriction(restriction.id, { endTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={restriction.timezone}
                        onValueChange={(value) => updateTimeRestriction(restriction.id, { timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Override</Label>
                      <Switch
                        checked={restriction.emergencyOverride}
                        onCheckedChange={(checked) => updateTimeRestriction(restriction.id, { emergencyOverride: checked })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Badge
                          key={day.value}
                          variant={restriction.daysOfWeek.includes(day.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const newDays = restriction.daysOfWeek.includes(day.value)
                              ? restriction.daysOfWeek.filter(d => d !== day.value)
                              : [...restriction.daysOfWeek, day.value];
                            updateTimeRestriction(restriction.id, { daysOfWeek: newDays });
                          }}
                        >
                          {day.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="location" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium">Location-Based Access Controls</h4>
            <Button onClick={createLocationRestriction}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location Restriction
            </Button>
          </div>

          <div className="grid gap-4">
            {locationRestrictions.map((restriction) => (
              <Card key={restriction.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Input
                      value={restriction.name}
                      onChange={(e) => updateLocationRestriction(restriction.id, { name: e.target.value })}
                      className="font-medium text-base"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLocationRestriction(restriction.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Restriction Type</Label>
                      <Select
                        value={restriction.type}
                        onValueChange={(value) => updateLocationRestriction(restriction.id, { type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ip_range">IP Range</SelectItem>
                          <SelectItem value="geofence">Geofence</SelectItem>
                          <SelectItem value="building">Building</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Override</Label>
                      <Switch
                        checked={restriction.emergencyOverride}
                        onCheckedChange={(checked) => updateLocationRestriction(restriction.id, { emergencyOverride: checked })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={restriction.description}
                      onChange={(e) => updateLocationRestriction(restriction.id, { description: e.target.value })}
                      placeholder="Describe this location restriction..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Rules ({restriction.type === 'ip_range' ? 'IP Addresses/Ranges' : restriction.type === 'geofence' ? 'Coordinates & Radius' : 'Building IDs'})</Label>
                    {restriction.rules.map((rule, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={rule}
                          onChange={(e) => {
                            const newRules = [...restriction.rules];
                            newRules[index] = e.target.value;
                            updateLocationRestriction(restriction.id, { rules: newRules });
                          }}
                          placeholder={
                            restriction.type === 'ip_range' ? '192.168.1.0/24' :
                            restriction.type === 'geofence' ? '40.7128,-74.0060,500m' :
                            'BUILDING_001'
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newRules = restriction.rules.filter((_, i) => i !== index);
                            updateLocationRestriction(restriction.id, { rules: newRules });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newRules = [...restriction.rules, ''];
                        updateLocationRestriction(restriction.id, { rules: newRules });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium">Emergency Access Grants</h4>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Key className="h-4 w-4 mr-2" />
                  Grant Emergency Access
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Grant Emergency Access</DialogTitle>
                  <DialogDescription>
                    Temporarily grant access to restricted features for emergency situations.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input placeholder="Enter user ID" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea placeholder="Describe the emergency situation..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (hours)</Label>
                    <Input type="number" min="1" max="24" defaultValue="2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Features</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {SAMPLE_FEATURES.map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <input type="checkbox" id={feature} />
                          <Label htmlFor={feature} className="text-sm">{feature}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full">Grant Access</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {emergencyAccess.map((access) => (
              <Card key={access.id} className={!access.isActive ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={access.isActive ? "default" : "secondary"}>
                          {access.isActive ? 'Active' : 'Revoked'}
                        </Badge>
                        <span className="font-medium">User: {access.userId}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{access.reason}</p>
                      <div className="flex flex-wrap gap-1">
                        {access.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Granted by: {access.grantedBy} | Expires: {new Date(access.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    {access.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeEmergencyAccess(access.id)}
                        className="text-red-600"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}