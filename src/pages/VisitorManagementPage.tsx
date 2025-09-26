import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  QrCode, 
  Clock, 
  Shield,
  Camera,
  MapPin,
  Bell
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { VisitorRegistration } from '@/components/visitor/VisitorRegistration';
import { VisitorDashboard } from '@/components/visitor/VisitorDashboard';
import { EmergencyManagement } from '@/components/visitor/EmergencyManagement';
import { SecurityConsole } from '@/components/visitor/SecurityConsole';
import { VisitorAnalytics } from '@/components/visitor/VisitorAnalytics';

const VisitorManagementPage: React.FC = () => {
  const { isAdmin, isStaff, userRole } = useAuth();
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [emergencyStatus, setEmergencyStatus] = useState<'normal' | 'drill' | 'emergency'>('normal');

  // Access control
  if (!isAdmin && !isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Access Denied</h3>
            <p className="text-muted-foreground">Visitor management requires staff privileges.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    // Mock data - in real app, fetch from backend
    setActiveVisitors(23);
    setPendingApprovals(5);
  }, []);

  const getEmergencyStatusColor = () => {
    switch (emergencyStatus) {
      case 'emergency': return 'bg-red-500';
      case 'drill': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Visitor Management System
          </h1>
          <p className="text-muted-foreground">
            Comprehensive visitor tracking, security management, and emergency preparedness
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Visitors</p>
                  <p className="text-2xl font-bold text-foreground">{activeVisitors}</p>
                </div>
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold text-foreground">{pendingApprovals}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Security Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-3 h-3 rounded-full ${getEmergencyStatusColor()}`} />
                    <span className="text-sm font-medium capitalize">{emergencyStatus}</span>
                  </div>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Visits</p>
                  <p className="text-2xl font-bold text-foreground">47</p>
                </div>
                <QrCode className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Alert */}
        {emergencyStatus !== 'normal' && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">
                    {emergencyStatus === 'emergency' ? 'Emergency Active' : 'Emergency Drill in Progress'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {emergencyStatus === 'emergency' 
                      ? 'Real emergency situation. Follow evacuation procedures immediately.'
                      : 'Scheduled emergency drill. All staff should participate as planned.'
                    }
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-card/50">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="registration" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Registration</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Emergency</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <VisitorDashboard />
          </TabsContent>

          <TabsContent value="registration">
            <VisitorRegistration />
          </TabsContent>

          <TabsContent value="security">
            <SecurityConsole />
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencyManagement 
              status={emergencyStatus}
              onStatusChange={setEmergencyStatus}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <VisitorAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VisitorManagementPage;