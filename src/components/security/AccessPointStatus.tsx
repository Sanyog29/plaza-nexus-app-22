
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Key,
  DoorClosed,
  Lock,
  Unlock,
  Shield,
  Settings,
  Search,
  Plus,
  Filter,
  Map as MapIcon,
  List,
  AlertTriangle,
  History,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface AccessPoint {
  id: string;
  name: string;
  status: string;
  last_activity: string | null;
  type: string;
  is_locked: boolean;
  location: string;
  floor: string;
  zone?: string;
}

interface AccessPointStatusProps {
  // Make this optional since we'll fetch data internally
  accessPoints?: AccessPoint[];
}

const AccessPointStatus: React.FC<AccessPointStatusProps> = ({ accessPoints: propAccessPoints }) => {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch access points from database
  useEffect(() => {
    const fetchAccessPoints = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('access_points')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching access points:', error);
          toast.error('Failed to load access points');
          return;
        }

        // Map database fields to our interface
        const mappedData = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          status: item.status,
          last_activity: item.last_ping || null, // Use last_ping as last_activity
          type: item.device_type, // Use device_type as type
          is_locked: false, // Default to false since column doesn't exist yet
          location: item.location,
          floor: item.floor,
          zone: item.zone
        }));
        setAccessPoints(mappedData);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load access points');
      } finally {
        setIsLoading(false);
      }
    };

    // Use prop data if provided, otherwise fetch from database
    if (propAccessPoints) {
      setAccessPoints(propAccessPoints);
      setIsLoading(false);
    } else {
      fetchAccessPoints();
    }
  }, [propAccessPoints]);

  const filteredAccessPoints = accessPoints.filter(point => {
    const matchesSearch = point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         point.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !activeFilter || 
                         (activeFilter === 'online' && point.status === 'online') ||
                         (activeFilter === 'offline' && point.status === 'offline');
    
    return matchesSearch && matchesFilter;
  });

  // Group access points by type
  const accessPointsByType: Record<string, AccessPoint[]> = {};
  filteredAccessPoints.forEach(point => {
    if (!accessPointsByType[point.type]) {
      accessPointsByType[point.type] = [];
    }
    accessPointsByType[point.type].push(point);
  });

  // Handle lock/unlock action
  const handleAccessPointAction = async (point: AccessPoint, action: 'lock' | 'unlock') => {
    try {
      const lockState = action === 'lock';
      const { error } = await supabase.rpc('toggle_access_point_lock', {
        point_id: point.id,
        lock_state: lockState
      });

      if (error) {
        throw error;
      }

      // Update local state
      setAccessPoints(prev => prev.map(p => 
        p.id === point.id ? { ...p, is_locked: lockState } : p
      ));

      toast.success(`${action === 'lock' ? 'Locked' : 'Unlocked'} ${point.name}`);
    } catch (error: any) {
      console.error('Error controlling access point:', error);
      toast.error(`Failed to ${action} ${point.name}: ${error.message}`);
    }
  };

  // Format last activity time
  const formatLastActivity = (timestamp: string | null) => {
    if (!timestamp) {
      return 'No activity';
    }
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search access points..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                {activeFilter ? `Filter: ${activeFilter}` : 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveFilter(null)}>
                All Access Points
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter('online')}>
                Online Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter('offline')}>
                Offline Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger 
              value="list" 
              onClick={() => setView('list')}
              data-state={view === 'list' ? 'active' : ''}
              className="flex items-center gap-1"
            >
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              onClick={() => setView('map')}
              data-state={view === 'map' ? 'active' : ''}
              className="flex items-center gap-1"
            >
              <MapIcon className="h-4 w-4" />
              Map
            </TabsTrigger>
          </TabsList>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Access Point
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Access Points</p>
              <p className="text-2xl font-bold">{accessPoints.length}</p>
            </div>
            <Key className="h-8 w-8 text-primary opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-2xl font-bold">{accessPoints.filter(p => p.status === 'online').length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-2xl font-bold">{accessPoints.filter(p => p.status === 'offline').length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive opacity-80" />
          </CardContent>
        </Card>
      </div>

      {view === 'list' ? (
        <>
          {/* List View */}
          <div className="space-y-6">
            {Object.entries(accessPointsByType).map(([type, points]) => (
              <div key={type} className="space-y-2">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  {type === 'Card Reader' && <Key className="h-5 w-5" />}
                  {type === 'Biometric' && <DoorClosed className="h-5 w-5" />}
                  {type === 'Barrier Gate' && <Lock className="h-5 w-5" />}
                  {type === 'Dual Auth' && <Shield className="h-5 w-5" />}
                  {type === 'Alarm Only' && <AlertTriangle className="h-5 w-5" />}
                  {type}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {points.map((point) => (
                    <Card key={point.id} className="overflow-hidden">
                      <div className={`p-4 ${point.status === 'online' ? 'bg-primary/5' : 'bg-destructive/5'} flex justify-between items-center`}>
                        <p className="font-medium">{point.name}</p>
                         <Badge variant={point.status === 'online' ? 'secondary' : 'destructive'}>
                           {point.status}
                         </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <History className="h-3 w-3" />
                            <span>Last activity: {formatLastActivity(point.last_activity)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleAccessPointAction(point, 'lock')}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Lock
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleAccessPointAction(point, 'unlock')}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            Unlock
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Logs</DropdownMenuItem>
                              <DropdownMenuItem>Edit Settings</DropdownMenuItem>
                              <DropdownMenuItem>Test Connection</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Disable</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        // Map View
        <Card>
          <CardHeader>
            <CardTitle>Building Access Map</CardTitle>
            <CardDescription>Interactive map of all access points</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-video bg-muted/30 rounded-md flex items-center justify-center relative overflow-hidden">
              {/* Placeholder for a real map implementation */}
              <div className="text-center space-y-2">
                <MapIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Interactive building map would be displayed here</p>
                <p className="text-xs text-muted-foreground">
                  The map would show access points with their current status
                </p>
              </div>
              
              {/* Sample access point markers */}
              <div className="absolute top-1/4 left-1/4 p-1 rounded-full bg-primary/70 animate-pulse" 
                   title="Main Entrance - Online">
                <Key className="h-3 w-3 text-white" />
              </div>
              <div className="absolute top-1/2 right-1/3 p-1 rounded-full bg-primary/70" 
                   title="Executive Floor - Online">
                <Key className="h-3 w-3 text-white" />
              </div>
              <div className="absolute bottom-1/4 right-1/4 p-1 rounded-full bg-destructive/70" 
                   title="Emergency Exit - Offline">
                <AlertTriangle className="h-3 w-3 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccessPointStatus;
