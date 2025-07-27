
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Users, Camera, Key, Clock, AlertTriangle, 
  CheckCircle, UserCheck, Building, RefreshCw, Search,
  Map, Filter, MoreHorizontal, Plus, Settings, Lock
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SecurityIncidentModal from '@/components/security/SecurityIncidentModal';
import SecurityGuardShifts from '@/components/security/SecurityGuardShifts';
import AccessPointStatus from '@/components/security/AccessPointStatus';
import { SecurityAnalytics } from '@/components/analytics/SecurityAnalytics';
import { RoleFeatureMatrix } from '@/components/admin/RoleFeatureMatrix';
import AdvancedPermissionsManager from '@/components/admin/AdvancedPermissionsManager';
import { FeatureRequestManager } from '@/components/admin/FeatureRequestManager';

const AdminSecurityPage = () => {
  const { user, isAdmin, userRole } = useAuth();
  // States for data
  const [visitors, setVisitors] = useState<any[]>([]);
  const [guards, setGuards] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [accessPoints, setAccessPoints] = useState<any[]>([]);
  const [securitySystems, setSecuritySystems] = useState<any[]>([]);
  
  // States for UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsFilter, setAnalyticsFilter] = useState('30');
  const [error, setError] = useState<Error | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'guard' | 'staff'>('admin');

  // Auto-detect view mode based on user role
  React.useEffect(() => {
    if (userRole === 'security_guard') {
      setViewMode('guard');
    } else if (userRole === 'field_staff') {
      setViewMode('staff');
    } else {
      setViewMode('admin');
    }
  }, [userRole]);

  // Fetch data
  const fetchSecurityData = async () => {
    setRefreshing(true);
    try {
      // Fetch visitors
      const { data: visitorsData, error: visitorsError } = await supabase
        .from('visitors')
        .select(`
          *,
          visitor_categories (name, icon, color),
          profiles!visitors_host_id_fkey (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (visitorsError) throw visitorsError;
      
      // Fetch security staff (using profiles table with role filter)
      const { data: guardsData, error: guardsError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['field_staff', 'ops_supervisor'])
        .order('created_at', { ascending: false });
      
      if (guardsError) throw guardsError;

      // Fetch active security shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('security_shifts')
        .select('*')
        .is('shift_end', null);
      
      if (shiftsError) throw shiftsError;

      // Fetch security incidents
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('visitor_check_logs')
        .select(`
          *,
          visitors (name, company, category_id, host_id),
          profiles (first_name, last_name)
        `)
        .in('action_type', ['security_incident', 'emergency_alert', 'access_denied'])
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (incidentsError) throw incidentsError;
      
      // Simulate access points (could be replaced with a real table later)
      const accessPointsData = [
        { id: 1, name: 'Main Entrance', status: 'Online', last_activity: new Date().toISOString(), type: 'Card Reader' },
        { id: 2, name: 'Parking Garage', status: 'Online', last_activity: new Date().toISOString(), type: 'Barrier Gate' },
        { id: 3, name: 'Executive Floor', status: 'Online', last_activity: new Date().toISOString(), type: 'Biometric' },
        { id: 4, name: 'Server Room', status: 'Online', last_activity: new Date().toISOString(), type: 'Dual Auth' },
        { id: 5, name: 'Loading Dock', status: 'Online', last_activity: new Date().toISOString(), type: 'Card Reader' },
        { id: 6, name: 'Emergency Exit', status: 'Offline', last_activity: new Date(Date.now() - 86400000).toISOString(), type: 'Alarm Only' },
        { id: 7, name: 'Roof Access', status: 'Online', last_activity: new Date().toISOString(), type: 'Card Reader' },
        { id: 8, name: 'Cafeteria', status: 'Online', last_activity: new Date().toISOString(), type: 'Card Reader' },
        { id: 9, name: 'Data Center', status: 'Online', last_activity: new Date().toISOString(), type: 'Biometric' },
        { id: 10, name: 'West Wing', status: 'Online', last_activity: new Date().toISOString(), type: 'Card Reader' },
        { id: 11, name: 'East Wing', status: 'Online', last_activity: new Date().toISOString(), type: 'Card Reader' },
        { id: 12, name: 'North Wing', status: 'Online', last_activity: new Date().toISOString(), type: 'Card Reader' },
      ];
      
      // Simulate security systems status
      const securitySystemsData = [
        { id: 1, system: 'CCTV Network', status: 'Online', details: '24/24 cameras active' },
        { id: 2, system: 'Access Control', status: 'Online', details: 'All readers functional' },
        { id: 3, system: 'Fire Safety', status: 'Online', details: 'All sensors active' },
        { id: 4, system: 'Intrusion Detection', status: 'Armed', details: 'Perimeter secured' },
      ];

      // Update state with fetched data
      setVisitors(visitorsData || []);
      setGuards(guardsData || []);
      setIncidents(incidentsData || []);
      setAccessPoints(accessPointsData);
      setSecuritySystems(securitySystemsData);
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching security data:', err);
      setError(err);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchSecurityData();

    // Set up subscription for visitor changes
    const visitorChannel = supabase
      .channel('admin-security-visitors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, () => {
        fetchSecurityData();
      })
      .subscribe();

    // Set up subscription for security shifts
    const shiftsChannel = supabase
      .channel('admin-security-shifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security_shifts' }, () => {
        fetchSecurityData();
      })
      .subscribe();

    // Set up subscription for security incidents
    const incidentsChannel = supabase
      .channel('admin-security-incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_check_logs' }, () => {
        fetchSecurityData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(visitorChannel);
      supabase.removeChannel(shiftsChannel);
      supabase.removeChannel(incidentsChannel);
    };
  }, []);

  // Create a security alert
  const handleSecurityAlert = () => {
    setIncidentModalOpen(true);
  };

  // Calculate active guards (those with active shifts)
  const activeGuards = guards.filter(guard => 
    guards.some(g => g.id === guard.id && g.shift_end === null)
  );

  // Filter incidents by resolved status
  const resolvedIncidents = incidents.filter(incident => incident.metadata?.resolved);
  
  // Count access points by status
  const onlineAccessPoints = accessPoints.filter(ap => ap.status === 'Online').length;

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Management</h1>
          <p className="text-muted-foreground">Comprehensive security oversight and visitor management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSecurityData} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSecurityAlert}>
            <Shield className="mr-2 h-4 w-4" />
            Security Alert
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <LoadingWrapper
        loading={loading && !refreshing}
        error={error}
        onRetry={fetchSecurityData}
        skeleton={
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-6 w-12 bg-muted rounded mb-2"></div>
                  <div className="h-3 w-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visitors.length}</div>
              <p className="text-xs text-muted-foreground">
                {visitors.filter(v => v.approval_status === 'pending').length} pending approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Guards</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guards.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeGuards.length} on duty
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Access Points</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accessPoints.length}</div>
              <p className="text-xs text-muted-foreground">
                {onlineAccessPoints} operational
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incidents Today</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incidents.length}</div>
              <p className="text-xs text-muted-foreground">
                {resolvedIncidents.length} resolved
              </p>
            </CardContent>
          </Card>
        </div>
      </LoadingWrapper>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="guards">Guards</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Visitor Activity</CardTitle>
                <CardDescription>Latest visitor check-ins and approvals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                      <div className="w-2/3 h-12 bg-muted rounded"></div>
                      <div className="w-1/4 h-6 bg-muted rounded"></div>
                    </div>
                  ))
                ) : visitors.length === 0 ? (
                  <div className="text-center p-6">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">No recent visitors</p>
                  </div>
                ) : (
                  visitors.slice(0, 3).map((visitor) => (
                    <div key={visitor.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{visitor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {visitor.company} • {new Date(visitor.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <Badge variant={
                        visitor.status === 'checked_in' ? 'secondary' : 
                        visitor.approval_status === 'pending' ? 'outline' : 
                        'destructive'
                      }>
                        {visitor.status === 'checked_in' ? 'Checked In' : 
                         visitor.approval_status === 'pending' ? 'Pending Approval' : 
                         'Checked Out'}
                      </Badge>
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('visitors')}>
                  View All Visitors
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
                <CardDescription>Current security system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {securitySystems.map((system, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{system.system}</p>
                      <p className="text-sm text-muted-foreground">{system.details}</p>
                    </div>
                    <Badge variant={system.status === 'Online' || system.status === 'Armed' ? 'secondary' : 'destructive'}>
                      {system.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('access')}>
                  View Security Systems
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Incidents Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Incidents</CardTitle>
              <CardDescription>Latest reported security issues</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="p-4 border rounded-lg animate-pulse">
                      <div className="w-full h-6 bg-muted rounded mb-2"></div>
                      <div className="w-3/4 h-4 bg-muted rounded mb-2"></div>
                      <div className="w-1/2 h-4 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : incidents.length === 0 ? (
                <div className="text-center p-6">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">No recent incidents</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {incidents.slice(0, 3).map((incident) => (
                    <div key={incident.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={
                          incident.action_type === 'emergency_alert' ? 'destructive' : 
                          incident.action_type === 'security_incident' ? 'default' : 
                          'outline'
                        }>
                          {incident.action_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(incident.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium">
                        {incident.visitors?.name || 'Unknown'} - {incident.location || 'Unspecified location'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {incident.notes || 'No details provided'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {incidents.length > 0 && (
                <div className="mt-4">
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('incidents')}>
                    View All Incidents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Visitor Management</CardTitle>
                <CardDescription>Manage visitor registrations, approvals, and access</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search visitors..."
                    className="pl-8 w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>All Visitors</DropdownMenuItem>
                    <DropdownMenuItem>Today's Visitors</DropdownMenuItem>
                    <DropdownMenuItem>Checked In</DropdownMenuItem>
                    <DropdownMenuItem>Pending Approval</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Visitor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Company</th>
                        <th className="text-left p-3 font-medium">Host</th>
                        <th className="text-left p-3 font-medium">Visit Date</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array(5).fill(0).map((_, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3"><div className="h-6 w-32 bg-muted rounded animate-pulse"></div></td>
                            <td className="p-3"><div className="h-6 w-24 bg-muted rounded animate-pulse"></div></td>
                            <td className="p-3"><div className="h-6 w-24 bg-muted rounded animate-pulse"></div></td>
                            <td className="p-3"><div className="h-6 w-28 bg-muted rounded animate-pulse"></div></td>
                            <td className="p-3"><div className="h-6 w-20 bg-muted rounded animate-pulse"></div></td>
                            <td className="p-3"><div className="h-6 w-20 bg-muted rounded animate-pulse"></div></td>
                          </tr>
                        ))
                      ) : visitors.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-6 text-muted-foreground">
                            No visitors found
                          </td>
                        </tr>
                      ) : (
                        visitors
                          .filter(visitor => 
                            searchQuery ? 
                            visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            visitor.company?.toLowerCase().includes(searchQuery.toLowerCase()) : 
                            true
                          )
                          .map(visitor => (
                            <tr key={visitor.id} className="border-t">
                              <td className="p-3 font-medium">{visitor.name}</td>
                              <td className="p-3 text-muted-foreground">{visitor.company || '-'}</td>
                              <td className="p-3 text-muted-foreground">
                                {visitor.profiles?.first_name} {visitor.profiles?.last_name}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {new Date(visitor.visit_date).toLocaleDateString()}
                              </td>
                              <td className="p-3">
                                <Badge variant={
                                  visitor.status === 'checked_in' ? 'secondary' : 
                                  visitor.approval_status === 'pending' ? 'outline' : 
                                  'default'
                                }>
                                  {visitor.status === 'checked_in' ? 'Checked In' : 
                                  visitor.approval_status === 'pending' ? 'Pending Approval' : 
                                  'Scheduled'}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Approve</DropdownMenuItem>
                                    <DropdownMenuItem>Deny</DropdownMenuItem>
                                    <DropdownMenuItem>Check In</DropdownMenuItem>
                                    <DropdownMenuItem>Check Out</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
                {visitors.length > 10 && (
                  <div className="flex justify-center">
                    <Button variant="outline">Load More</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Manage access permissions, cards, and entry points</CardDescription>
            </CardHeader>
            <CardContent>
              <AccessPointStatus accessPoints={accessPoints} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guards">
          <Card>
            <CardHeader>
              <CardTitle>Security Guards</CardTitle>
              <CardDescription>Manage guard schedules, shifts, and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityGuardShifts guards={guards} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Security Incidents</CardTitle>
                <CardDescription>Track and manage security incidents and reports</CardDescription>
              </div>
              <Button onClick={handleSecurityAlert}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report Incident
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="p-4 border rounded-lg animate-pulse">
                      <div className="flex justify-between mb-2">
                        <div className="w-1/4 h-6 bg-muted rounded"></div>
                        <div className="w-1/5 h-6 bg-muted rounded"></div>
                      </div>
                      <div className="w-3/4 h-4 bg-muted rounded mb-2"></div>
                      <div className="w-1/2 h-4 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : incidents.length === 0 ? (
                <div className="text-center p-6">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">No incidents reported</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            incident.action_type === 'emergency_alert' ? 'destructive' : 
                            incident.action_type === 'security_incident' ? 'default' : 
                            'outline'
                          }>
                            {incident.action_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm font-medium">
                            {incident.location || 'Unspecified location'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(incident.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Reported by: {incident.profiles?.first_name} {incident.profiles?.last_name || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Involving: {incident.visitors?.name || 'No visitor involved'}
                        </span>
                      </div>
                      <p className="text-sm mt-2 p-2 bg-muted/30 rounded">
                        {incident.notes || 'No details provided'}
                      </p>
                      <div className="flex justify-end mt-2 gap-2">
                        <Button variant="outline" size="sm">Mark Resolved</Button>
                        <Button size="sm">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Security Analytics</CardTitle>
                <CardDescription>Security metrics and performance analysis</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">Time period:</div>
                <TabsList className="bg-muted">
                  <TabsTrigger 
                    value="7" 
                    className="text-xs h-8"
                    onClick={() => setAnalyticsFilter('7')}
                    data-state={analyticsFilter === '7' ? 'active' : ''}
                  >
                    7d
                  </TabsTrigger>
                  <TabsTrigger 
                    value="30" 
                    className="text-xs h-8" 
                    onClick={() => setAnalyticsFilter('30')}
                    data-state={analyticsFilter === '30' ? 'active' : ''}
                  >
                    30d
                  </TabsTrigger>
                  <TabsTrigger 
                    value="90" 
                    className="text-xs h-8"
                    onClick={() => setAnalyticsFilter('90')}
                    data-state={analyticsFilter === '90' ? 'active' : ''}
                  >
                    90d
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <SecurityAnalytics period={analyticsFilter} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <AdvancedPermissionsManager />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <RoleFeatureMatrix />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <FeatureRequestManager />
        </TabsContent>
      </Tabs>

      {/* Security Incident Modal */}
      <SecurityIncidentModal 
        isOpen={incidentModalOpen} 
        onClose={() => setIncidentModalOpen(false)}
        onIncidentReported={() => {
          fetchSecurityData();
          setIncidentModalOpen(false);
          toast.success('Incident reported successfully');
        }}
      />
    </div>
  );
};

export default AdminSecurityPage;
