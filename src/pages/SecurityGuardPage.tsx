import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Users, Camera, QrCode, LogIn, LogOut, Timer, AlertCircle, Settings } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { QRScanner } from '@/components/security/QRScanner';
import { PhotoCapture } from '@/components/security/PhotoCapture';
import { ShiftManagement } from '@/components/security/ShiftManagement';
import { VisitorCheckIn } from '@/components/security/VisitorCheckIn';
import { EmergencyProcedures } from '@/components/security/EmergencyProcedures';
import { BulkVisitorActions } from '@/components/security/BulkVisitorActions';
import { MobileSecurityInterface } from '@/components/security/MobileSecurityInterface';
import { useVisitorNotifications } from '@/hooks/useVisitorNotifications';
import { useAutomatedAlerts } from '@/hooks/useAutomatedAlerts';
import { useOfflineCapability } from '@/hooks/useOfflineCapability';
import { useIsMobile } from '@/hooks/use-mobile';

const SecurityGuardPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [visitors, setVisitors] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [checkedInVisitors, setCheckedInVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize notification systems and capabilities
  useVisitorNotifications();
  useAutomatedAlerts();
  const { isOnline, offlineActions } = useOfflineCapability();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchData();
    checkActiveShift();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('security-guard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_check_logs' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: visitorsData } = await supabase
        .from('visitors')
        .select(`
          *,
          visitor_categories (name, icon, color),
          profiles!visitors_host_id_fkey (first_name, last_name)
        `)
        .eq('visit_date', today)
        .order('entry_time', { ascending: true });

      const { data: checkedInData } = await supabase
        .from('visitors')
        .select(`
          *,
          visitor_categories (name, icon, color),
          profiles!visitors_host_id_fkey (first_name, last_name)
        `)
        .eq('status', 'checked_in')
        .order('check_in_time', { ascending: false });

      if (visitorsData) setVisitors(visitorsData);
      if (checkedInData) setCheckedInVisitors(checkedInData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load visitor data');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveShift = async () => {
    try {
      const { data: shift } = await supabase
        .from('security_shifts')
        .select('*')
        .is('shift_end', null)
        .maybeSingle();
      
      if (shift) setActiveShift(shift);
    } catch (error) {
      // No active shift
    }
  };

  const getStatusBadge = (visitor: any) => {
    if (visitor.status === 'checked_in') {
      return <Badge className="bg-green-600">Checked In</Badge>;
    } else if (visitor.status === 'checked_out') {
      return <Badge variant="secondary">Completed</Badge>;
    } else if (visitor.approval_status === 'approved' && isToday(new Date(visitor.visit_date))) {
      const now = new Date();
      const entryTime = new Date(`${visitor.visit_date}T${visitor.entry_time}`);
      if (now > entryTime) {
        return <Badge className="bg-yellow-600">Expected - Late</Badge>;
      }
      return <Badge className="bg-blue-600">Expected</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const getTodayStats = () => {
    const expected = visitors.filter(v => v.approval_status === 'approved').length;
    const checkedIn = visitors.filter(v => v.status === 'checked_in').length;
    const completed = visitors.filter(v => v.status === 'checked_out').length;
    const pending = visitors.filter(v => {
      const now = new Date();
      const entryTime = new Date(`${v.visit_date}T${v.entry_time}`);
      return v.approval_status === 'approved' && v.status === 'scheduled' && now > entryTime;
    }).length;

    return { expected, checkedIn, completed, pending };
  };

  const stats = getTodayStats();

  if (!activeShift) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Security Guard Dashboard</h2>
          <Card className="bg-card/50 backdrop-blur max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Timer className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-white mb-4">You need to start your shift to access the security dashboard</p>
              <ShiftManagement onShiftStart={() => checkActiveShift()} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Guard Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">
            Shift started: {format(new Date(activeShift.shift_start), 'HH:mm')}
          </p>
        </div>
        <ShiftManagement 
          activeShift={activeShift} 
          onShiftEnd={() => {
            setActiveShift(null);
            toast.success('Shift ended successfully');
          }} 
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.expected}</p>
            <p className="text-sm text-gray-400">Expected Today</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.checkedIn}</p>
            <p className="text-sm text-gray-400">Checked In</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <LogOut className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.completed}</p>
            <p className="text-sm text-gray-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-sm text-gray-400">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Interface */}
      {isMobile && (
        <MobileSecurityInterface
          onTabChange={setActiveTab}
          stats={stats}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-6'} mb-6 bg-card/50`}>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-plaza-blue">
            <Users className="h-4 w-4 mr-1" />
            {isMobile ? 'Home' : 'Dashboard'}
          </TabsTrigger>
          <TabsTrigger value="scanner" className="data-[state=active]:bg-plaza-blue">
            <QrCode className="h-4 w-4 mr-1" />
            {isMobile ? 'QR' : 'QR Scanner'}
          </TabsTrigger>
          <TabsTrigger value="checkin" className="data-[state=active]:bg-plaza-blue">
            <LogIn className="h-4 w-4 mr-1" />
            {isMobile ? 'Check' : 'Check-In'}
          </TabsTrigger>
          {!isMobile && (
            <>
              <TabsTrigger value="camera" className="data-[state=active]:bg-plaza-blue">
                <Camera className="h-4 w-4 mr-1" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="emergency" className="data-[state=active]:bg-plaza-blue">
                <AlertCircle className="h-4 w-4 mr-1" />
                Emergency
              </TabsTrigger>
              <TabsTrigger value="bulk" className="data-[state=active]:bg-plaza-blue">
                <Settings className="h-4 w-4 mr-1" />
                Bulk Actions
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Today's Expected Visitors */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Today's Expected Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-gray-400">Loading...</div>
                ) : visitors.length === 0 ? (
                  <div className="text-center text-gray-400">No visitors expected today</div>
                ) : (
                  <div className="space-y-3">
                    {visitors.slice(0, 10).map((visitor) => (
                      <div key={visitor.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                        <div className="flex items-center space-x-3">
                          <div className="bg-card/60 p-2 rounded-full">
                            <User size={16} className="text-plaza-blue" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{visitor.name}</p>
                            <p className="text-sm text-gray-400">
                              {visitor.entry_time} • {visitor.profiles?.first_name} {visitor.profiles?.last_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(visitor)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Currently Checked In */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Currently Checked In</CardTitle>
              </CardHeader>
              <CardContent>
                {checkedInVisitors.length === 0 ? (
                  <div className="text-center text-gray-400">No visitors currently checked in</div>
                ) : (
                  <div className="space-y-3">
                    {checkedInVisitors.map((visitor) => (
                      <div key={visitor.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-600/20 p-2 rounded-full">
                            <User size={16} className="text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{visitor.name}</p>
                            <p className="text-sm text-gray-400">
                              Checked in: {visitor.check_in_time ? format(new Date(visitor.check_in_time), 'HH:mm') : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-600">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scanner">
          <QRScanner onVisitorScanned={() => fetchData()} />
        </TabsContent>

        <TabsContent value="checkin">
          <VisitorCheckIn onCheckIn={() => fetchData()} />
        </TabsContent>

        <TabsContent value="camera">
          <PhotoCapture />
        </TabsContent>

        <TabsContent value="emergency">
          <EmergencyProcedures />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkVisitorActions />
        </TabsContent>
      </Tabs>

      {/* Connection Status Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Card className="bg-yellow-600/90 backdrop-blur border-yellow-500">
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-white text-sm">
                Working offline - {offlineActions} actions queued
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SecurityGuardPage;