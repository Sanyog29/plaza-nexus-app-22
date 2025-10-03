import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard';
import { AdvancedNotificationCenter } from '@/components/notifications/AdvancedNotificationCenter';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { useRequestOffers } from '@/hooks/useRequestOffers';
import { useProfile } from '@/hooks/useProfile';
import { useRealtimeMaintenanceRequests } from '@/hooks/useRealtimeMaintenanceRequests';
import { TaskCompletionNotifier } from '@/components/realtime/TaskCompletionNotifier';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, TrendingUp, Users, Wrench, Shield, Activity, GraduationCap, Brain, BarChart3, FileSpreadsheet, Database, User, Plus } from 'lucide-react';
import { SystemHealthWidget } from '@/components/common/SystemHealthWidget';
import { FeatureGuard } from '@/components/common/FeatureGuard';
import { FeatureNotificationSystem } from '@/components/common/FeatureNotificationSystem';
import { SEOHead } from '@/components/seo/SEOHead';
import { RequestPopupNotification } from '@/components/staff/RequestPopupNotification';
import { useNewRequestNotifications } from '@/hooks/useNewRequestNotifications';
interface RequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}
const StaffDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [acceptedOffers, setAcceptedOffers] = useState<Set<string>>(new Set());

  // Hooks
  const { offers, acceptOffer } = useRequestOffers();
  const { profile } = useProfile();
  const { requestStats, recentRequests, isLoading } = useRealtimeMaintenanceRequests();
  const {
    newRequest,
    isVisible,
    handleAccept,
    handleDismiss
  } = useNewRequestNotifications();
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'in_progress':
        return 'text-warning';
      case 'pending':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>;
  }
  return (
    <>
      <SEOHead title="Staff Dashboard" description="Monitor and manage facility operations." url={`${window.location.origin}/staff/dashboard`} type="website" noindex />
      
      {/* Real-time Task Completion Notifier */}
      <TaskCompletionNotifier />
      
      <div className="w-full space-y-6 pb-20">
      {/* Feature Notification System */}
      <FeatureNotificationSystem />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Staff Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage facility operations</p>
      </div>

      {/* Incoming Requests - Compact */}
      <Card className="bg-card/50 backdrop-blur mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-lg">Incoming Requests</CardTitle>
          <CardDescription>Tasks available for you to accept</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto space-y-3">
            {offers.length === 0 && recentRequests.length === 0 ? <p className="text-muted-foreground text-center py-4">No incoming requests</p> : <>
                {/* Show offers first (with Accept button) */}
                {offers.slice(0, 5).map(offer => <div key={offer.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg hover:bg-accent/70 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{offer.request.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{offer.request.location}</span>
                        <span>•</span>
                        <span>{new Date(offer.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {acceptedOffers.has(offer.request_id) ? <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-success">Assigned to you</span>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/requests/${offer.request_id}`)}>
                            View
                          </Button>
                        </div> : <Button size="sm" onClick={async () => {
                    const success = await acceptOffer(offer.request_id);
                    if (success) {
                      setAcceptedOffers(prev => new Set([...prev, offer.request_id]));
                    }
                  }} className="bg-primary hover:bg-primary/80">
                          Accept
                        </Button>}
                    </div>
                  </div>)}
                
                {/* Show recent requests without offers (with View button) */}
                {offers.length < 5 && recentRequests.filter(req => !offers.some(offer => offer.request_id === req.id)).slice(0, 5 - offers.length).map(request => <div key={request.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">{request.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/requests/${request.id}`)}>
                        View
                      </Button>
                    </div>)}
              </>}
          </div>
        </CardContent>
      </Card>

      <CustomizableDashboard userRole="staff" />
      <AdvancedNotificationCenter />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{requestStats.total}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-destructive">{requestStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-warning">{requestStats.inProgress}</p>
              </div>
              <Wrench className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{requestStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      

      {/* Quick Actions - Streamlined */}
      <Card className="bg-card/50 backdrop-blur mb-8">
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            <Button onClick={() => navigate('/requests/new')} className="h-20 flex flex-col bg-success/10 hover:bg-success/20 border border-success/30">
              <Plus className="h-6 w-6 text-success mb-2" />
              <span className="text-sm">Raise Request</span>
            </Button>
            
            <Button onClick={() => navigate('/staff/requests')} className="h-20 flex flex-col bg-primary/10 hover:bg-primary/20 border border-primary/30">
              <ClipboardList className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">My Requests</span>
            </Button>
            
            <Button onClick={() => navigate('/staff/alerts')} className="h-20 flex flex-col bg-destructive/10 hover:bg-destructive/20 border border-destructive/30">
              <AlertTriangle className="h-6 w-6 text-destructive mb-2" />
              <span className="text-sm">Active Alerts</span>
            </Button>
            
            <Button onClick={() => navigate('/staff/performance')} className="h-20 flex flex-col bg-success/10 hover:bg-success/20 border border-success/30">
              <Activity className="h-6 w-6 text-success mb-2" />
              <span className="text-sm">Performance</span>
            </Button>
            
            <Button onClick={() => navigate('/staff/training')} className="h-20 flex flex-col bg-primary/10 hover:bg-primary/20 border border-primary/30">
              <GraduationCap className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">Training</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics & Tools */}
      <FeatureGuard feature="advancedDashboardsEnabled" enableFeatureRequest={false} showDisabledState={false} featureDisplayName="Advanced Analytics Dashboard" featureDescription="Access comprehensive analytics, forecasting, and performance insights." upgradeHint="Available for ops_supervisor and admin roles">
        <Card className="bg-card/50 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Advanced Analytics</CardTitle>
            <CardDescription>Comprehensive facility performance insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => navigate('/analytics/dashboard')} className="h-20 flex flex-col bg-primary/10 hover:bg-primary/20 border border-primary/30">
                <BarChart3 className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm">Analytics</span>
              </Button>
              
              <Button onClick={() => navigate('/analytics/forecasting')} className="h-20 flex flex-col bg-primary/10 hover:bg-primary/20 border border-primary/30">
                <TrendingUp className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm">Forecasting</span>
              </Button>
              
              <Button onClick={() => navigate('/analytics/reports')} className="h-20 flex flex-col bg-success/10 hover:bg-success/20 border border-success/30">
                <FileSpreadsheet className="h-6 w-6 text-success mb-2" />
                <span className="text-sm">Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </FeatureGuard>

      {/* Data Management Tools */}
      <FeatureGuard feature="dataExportEnabled" enableFeatureRequest={false} showDisabledState={false} featureDisplayName="Data Export & Import Tools" featureDescription="Export facility data and import bulk updates via CSV files." upgradeHint="Contact your supervisor for access to data management tools">
        <Card className="bg-card/50 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Data Management</CardTitle>
            <CardDescription>Import, export, and manage facility data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={() => navigate('/data/export')} className="h-20 flex flex-col bg-primary/10 hover:bg-primary/20 border border-primary/30">
                <Database className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm">Export Data</span>
              </Button>
              
              <FeatureGuard feature="csvImportEnabled" enableFeatureRequest={true} showDisabledState={false}>
                <Button onClick={() => navigate('/data/import')} className="h-20 flex flex-col bg-secondary/10 hover:bg-secondary/20 border border-secondary/30">
                  <FileSpreadsheet className="h-6 w-6 text-secondary mb-2" />
                  <span className="text-sm">Import CSV</span>
                </Button>
              </FeatureGuard>
            </div>
          </CardContent>
        </Card>
      </FeatureGuard>

      {/* AI-Powered Tools */}
      

      {/* All Recent Activity - Optional fallback section */}
      <Card className="bg-card/50 backdrop-blur">
        
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No recent requests found</p>
        </CardContent>
      </Card>
      
      {/* Request Popup Notification */}
      {newRequest && <RequestPopupNotification request={newRequest} onAccept={handleAccept} onDismiss={handleDismiss} isVisible={isVisible} />}
    </div>
  </>
  );
};
export default StaffDashboardPage;