import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard';
import { AdvancedNotificationCenter } from '@/components/notifications/AdvancedNotificationCenter';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRequestOffers } from '@/hooks/useRequestOffers';
import { useProfile } from '@/hooks/useProfile';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Wrench,
  Shield,
  Activity,
  GraduationCap,
  Brain,
  BarChart3,
  FileSpreadsheet,
  Database,
  User
} from 'lucide-react';
import { SystemHealthWidget } from '@/components/common/SystemHealthWidget';
import { toast } from '@/hooks/use-toast';
import { FeatureGuard } from '@/components/common/FeatureGuard';
import { FeatureNotificationSystem } from '@/components/common/FeatureNotificationSystem';
import { SEOHead } from '@/components/seo/SEOHead';
import { RequestPopupNotification } from '@/components/staff/RequestPopupNotification';
import { useNewRequestNotifications } from '@/hooks/useNewRequestNotifications';
import { SoundEffects } from '@/utils/soundEffects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface RequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

const StaffDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requestStats, setRequestStats] = useState<RequestStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptedOffers, setAcceptedOffers] = useState<Set<string>>(new Set());
  
  // Hooks
  const { offers, acceptOffer } = useRequestOffers();
  const { profile } = useProfile();
  const { newRequest, isVisible, handleAccept, handleDismiss } = useNewRequestNotifications();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch maintenance requests statistics
      const { data: requests, error: requestsError } = await supabase
        .from('maintenance_requests')
        .select('status, created_at, title, priority, id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (requestsError) throw requestsError;

      // Calculate stats
      const stats = requests?.reduce((acc, req) => {
        acc.total++;
        if (req.status === 'pending') acc.pending++;
        else if (req.status === 'in_progress') acc.inProgress++;
        else if (req.status === 'completed') acc.completed++;
        return acc;
      }, { total: 0, pending: 0, inProgress: 0, completed: 0 }) || {
        total: 0, pending: 0, inProgress: 0, completed: 0
      };

      setRequestStats(stats);
      setRecentRequests(requests?.slice(0, 5) || []);
    } catch (error: any) {
      toast({
        title: "Error loading dashboard data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'pending': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Staff Dashboard"
        description="Monitor and manage facility operations."
        url={`${window.location.origin}/staff/dashboard`}
        type="website"
        noindex
      />
      <div className="container mx-auto px-4 py-8 pb-20">
      {/* Feature Notification System */}
      <FeatureNotificationSystem />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Staff Dashboard</h1>
        <p className="text-gray-400">Monitor and manage facility operations</p>
      </div>

      {/* Incoming Requests - Compact */}
      <Card className="bg-card/50 backdrop-blur mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Incoming Requests</CardTitle>
          <CardDescription>Tasks available for you to accept</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto space-y-3">
            {offers.length === 0 && recentRequests.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No incoming requests</p>
            ) : (
              <>
                {/* Show offers first (with Accept button) */}
                {offers.slice(0, 5).map((offer) => (
                  <div 
                    key={offer.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{offer.request.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{offer.request.location}</span>
                        <span>•</span>
                        <span>{new Date(offer.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {acceptedOffers.has(offer.request_id) ? (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-green-400">Assigned to you</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/requests/${offer.request_id}`)}
                          >
                            View
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await Haptics.impact({ style: ImpactStyle.Medium });
                            } catch (e) {
                              // Haptics not available, continue silently
                            }
                            
                            const success = await acceptOffer(offer.request_id);
                            if (success) {
                              SoundEffects.playConfirmationBeep();
                              setAcceptedOffers(prev => new Set([...prev, offer.request_id]));
                            }
                          }}
                          className="bg-primary hover:bg-primary/80"
                        >
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Show recent requests without offers (with View button) */}
                {offers.length < 5 && recentRequests
                  .filter(req => !offers.some(offer => offer.request_id === req.id))
                  .slice(0, 5 - offers.length)
                  .map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{request.title}</h4>
                        <p className="text-sm text-gray-400">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/requests/${request.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))
                }
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <CustomizableDashboard userRole="staff" />
      <AdvancedNotificationCenter />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-white">{requestStats.total}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-plaza-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-red-400">{requestStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400">{requestStats.inProgress}</p>
              </div>
              <Wrench className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">{requestStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      <Card className="bg-card/50 backdrop-blur mb-8">
        <CardHeader>
          <CardTitle className="text-white">System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <SystemHealthWidget variant="detailed" />
        </CardContent>
      </Card>

      {/* Quick Actions - Streamlined */}
      <Card className="bg-card/50 backdrop-blur mb-8">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate('/staff/requests')}
              className="h-20 flex flex-col bg-primary/10 hover:bg-primary/20 border border-primary/30"
            >
              <ClipboardList className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm">My Requests</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/staff/alerts')}
              className="h-20 flex flex-col bg-destructive/10 hover:bg-destructive/20 border border-destructive/30"
            >
              <AlertTriangle className="h-6 w-6 text-destructive mb-2" />
              <span className="text-sm">Active Alerts</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/staff/performance')}
              className="h-20 flex flex-col bg-green-500/10 hover:bg-green-500/20 border border-green-500/30"
            >
              <Activity className="h-6 w-6 text-green-400 mb-2" />
              <span className="text-sm">Performance</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/staff/training')}
              className="h-20 flex flex-col bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30"
            >
              <GraduationCap className="h-6 w-6 text-blue-400 mb-2" />
              <span className="text-sm">Training</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics & Tools */}
      <FeatureGuard
        feature="advancedDashboardsEnabled"
        enableFeatureRequest={true}
        showProgressiveDisclosure={true}
        featureDisplayName="Advanced Analytics Dashboard"
        featureDescription="Access comprehensive analytics, forecasting, and performance insights."
        upgradeHint="Available for ops_supervisor and admin roles"
      >
        <Card className="bg-card/50 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-white">Advanced Analytics</CardTitle>
            <CardDescription>Comprehensive facility performance insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/analytics/dashboard')}
                className="h-20 flex flex-col bg-primary/10 hover:bg-primary/20 border border-primary/30"
              >
                <BarChart3 className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm">Analytics</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/analytics/forecasting')}
                className="h-20 flex flex-col bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30"
              >
                <TrendingUp className="h-6 w-6 text-blue-400 mb-2" />
                <span className="text-sm">Forecasting</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/analytics/reports')}
                className="h-20 flex flex-col bg-green-500/10 hover:bg-green-500/20 border border-green-500/30"
              >
                <FileSpreadsheet className="h-6 w-6 text-green-400 mb-2" />
                <span className="text-sm">Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </FeatureGuard>

      {/* Data Management Tools */}
      <FeatureGuard
        feature="dataExportEnabled"
        enableFeatureRequest={true}
        showProgressiveDisclosure={true}
        featureDisplayName="Data Export & Import Tools"
        featureDescription="Export facility data and import bulk updates via CSV files."
        upgradeHint="Contact your supervisor for access to data management tools"
      >
        <Card className="bg-card/50 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-white">Data Management</CardTitle>
            <CardDescription>Import, export, and manage facility data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => navigate('/data/export')}
                className="h-20 flex flex-col bg-primary/10 hover:bg-primary/20 border border-primary/30"
              >
                <Database className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm">Export Data</span>
              </Button>
              
              <FeatureGuard
                feature="csvImportEnabled"
                enableFeatureRequest={true}
                showDisabledState={false}
              >
                <Button 
                  onClick={() => navigate('/data/import')}
                  className="h-20 flex flex-col bg-secondary/10 hover:bg-secondary/20 border border-secondary/30"
                >
                  <FileSpreadsheet className="h-6 w-6 text-secondary mb-2" />
                  <span className="text-sm">Import CSV</span>
                </Button>
              </FeatureGuard>
            </div>
          </CardContent>
        </Card>
      </FeatureGuard>

      {/* AI-Powered Tools */}
      <Card className="bg-card/50 backdrop-blur mb-8">
        <CardHeader>
          <CardTitle className="text-white">AI-Powered Intelligence</CardTitle>
          <CardDescription>Access smart facility management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <Button 
              onClick={() => navigate('/operational-excellence')}
              className="h-24 flex flex-col bg-primary/10 hover:bg-primary/20 border border-primary/30"
            >
              <Brain className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Operational Excellence</span>
              <span className="text-xs text-muted-foreground">AI Analytics & Intelligence</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All Recent Activity - Optional fallback section */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">All Recent Activity</CardTitle>
          <CardDescription>Latest maintenance requests in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recent requests found</p>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer"
                  onClick={() => navigate(`/requests/${request.id}`)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">{request.title}</h4>
                    <p className="text-sm text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/requests/${request.id}`);
                    }}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Request Popup Notification */}
      {newRequest && (
        <RequestPopupNotification
          request={newRequest}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          isVisible={isVisible}
        />
      )}
    </div>
  </>
  );
};

export default StaffDashboardPage;