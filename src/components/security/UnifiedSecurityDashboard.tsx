import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Camera, 
  AlertTriangle,
  Activity,
  QrCode,
  Lock,
  Eye
} from 'lucide-react';
import AccessPointStatus from './AccessPointStatus';
import { EnhancedQRScanner } from '@/components/qr/EnhancedQRScanner';
import { StaffAttendanceSystem } from '@/components/operations/StaffAttendanceSystem';
import { useAuth } from '@/components/AuthProvider';
import { useTabTransition } from '@/hooks/useTransitionState';

export const UnifiedSecurityDashboard: React.FC = () => {
  const { user, permissions } = useAuth();
  const [activeTab, setActiveTab] = useTabTransition('overview');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const securityMetrics = {
    activeVisitors: 12,
    securityAlerts: 3,
    accessPoints: 8,
    staffOnDuty: 5
  };

  const handleQRScanResult = (result: any) => {
    console.log('Security QR scan result:', result);
    // Handle different QR types in security context
    setShowQRScanner(false);
  };

  if (!permissions.can_view_security_dashboard) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            You don't have permission to view the security dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">Active Visitors</p>
                <p className="text-2xl font-bold text-white">{securityMetrics.activeVisitors}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-200">Security Alerts</p>
                <p className="text-2xl font-bold text-white">{securityMetrics.securityAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-200">Access Points</p>
                <p className="text-2xl font-bold text-white">{securityMetrics.accessPoints}</p>
              </div>
              <Lock className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-200">Staff on Duty</p>
                <p className="text-2xl font-bold text-white">{securityMetrics.staffOnDuty}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Security Dashboard Tabs */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5" />
            Security Control Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-background/20">
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-primary">
                <Eye className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="access" className="text-white data-[state=active]:bg-primary">
                <Lock className="h-4 w-4 mr-2" />
                Access Control
              </TabsTrigger>
              <TabsTrigger value="qr-scanner" className="text-white data-[state=active]:bg-primary">
                <QrCode className="h-4 w-4 mr-2" />
                QR Scanner
              </TabsTrigger>
              <TabsTrigger value="attendance" className="text-white data-[state=active]:bg-primary">
                <Users className="h-4 w-4 mr-2" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="text-white data-[state=active]:bg-primary">
                <Camera className="h-4 w-4 mr-2" />
                Monitoring
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Security Events */}
                <Card className="bg-background/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Recent Security Events</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { type: 'visitor_checkin', user: 'John Doe', time: '2 minutes ago', status: 'success' },
                      { type: 'access_denied', user: 'Unknown Card', time: '5 minutes ago', status: 'warning' },
                      { type: 'visitor_checkout', user: 'Jane Smith', time: '8 minutes ago', status: 'success' },
                    ].map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{event.user}</p>
                          <p className="text-sm text-gray-400 capitalize">{event.type.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            className={event.status === 'success' ? 'bg-green-600' : 'bg-yellow-600'}
                          >
                            {event.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card className="bg-background/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: 'Main Entrance Camera', status: 'online', uptime: '99.9%' },
                      { name: 'Visitor Management', status: 'online', uptime: '100%' },
                      { name: 'Access Control System', status: 'online', uptime: '98.5%' },
                      { name: 'Emergency Systems', status: 'online', uptime: '100%' },
                    ].map((system, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{system.name}</p>
                          <p className="text-sm text-gray-400">Uptime: {system.uptime}</p>
                        </div>
                        <Badge className="bg-green-600">
                          {system.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="access">
              <AccessPointStatus />
            </TabsContent>

            <TabsContent value="qr-scanner">
              <Card className="bg-background/20">
                <CardHeader>
                  <CardTitle className="text-white">Security QR Scanner</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedQRScanner
                    onScanResult={handleQRScanResult}
                    supportedTypes={['visitor', 'asset', 'attendance']}
                    autoProcess={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <StaffAttendanceSystem />
            </TabsContent>

            <TabsContent value="monitoring">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-background/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Camera Feeds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        'Main Entrance',
                        'Lobby',
                        'Elevator Bank',
                        'Emergency Exit'
                      ].map((location, index) => (
                        <div key={index} className="aspect-video bg-background/50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">{location}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Alert Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { alert: 'Visitor overstay detected', severity: 'medium', time: '10 minutes ago' },
                      { alert: 'Unauthorized access attempt', severity: 'high', time: '25 minutes ago' },
                      { alert: 'Camera offline - Floor 3', severity: 'low', time: '1 hour ago' },
                    ].map((alert, index) => (
                      <div key={index} className="p-3 bg-background/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            className={
                              alert.severity === 'high' ? 'bg-red-600' :
                              alert.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                            }
                          >
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">{alert.time}</span>
                        </div>
                        <p className="text-white text-sm">{alert.alert}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};