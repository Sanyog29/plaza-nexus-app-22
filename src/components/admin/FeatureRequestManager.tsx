import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedSearch } from '@/hooks/useDebounce';
import { useFilterTransition, useTabTransition } from '@/hooks/useTransitionState';
import { searchFilter } from '@/utils/searchUtils';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface FeatureRequest {
  id: string;
  feature: string;
  userRole: string;
  reason?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  userId?: string;
  userName?: string;
}

interface FeatureUsageAnalytics {
  feature: string;
  userRole: string;
  timestamp: Date;
  type: 'attempted_access';
}

export const FeatureRequestManager: React.FC = () => {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [analytics, setAnalytics] = useState<FeatureUsageAnalytics[]>([]);
  const [searchQuery, debouncedSearchQuery, setSearchQuery] = useDebouncedSearch('', 300);
  const [statusFilter, setStatusFilter] = useFilterTransition<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject';
    request: FeatureRequest | null;
  }>({ open: false, type: 'approve', request: null });
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
    loadAnalytics();
  }, []);

  const loadRequests = () => {
    const storedRequests = JSON.parse(localStorage.getItem('featureRequests') || '[]');
    const requestsWithStatus = storedRequests.map((req: any) => ({
      ...req,
      id: req.id || `req_${Date.now()}_${Math.random()}`,
      timestamp: new Date(req.timestamp),
      status: req.status || 'pending'
    }));
    setRequests(requestsWithStatus);
  };

  const loadAnalytics = () => {
    const storedAnalytics = JSON.parse(localStorage.getItem('featureAnalytics') || '[]');
    const analyticsWithDates = storedAnalytics.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
    setAnalytics(analyticsWithDates);
  };

  const handleRequestAction = async (request: FeatureRequest, action: 'approve' | 'reject') => {
    const updatedRequests = requests.map(req => 
      req.id === request.id 
        ? { ...req, status: (action === 'approve' ? 'approved' : 'rejected') as FeatureRequest['status'], adminComment }
        : req
    );
    
    setRequests(updatedRequests);
    localStorage.setItem('featureRequests', JSON.stringify(updatedRequests));
    
    toast({
      title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `Feature access request for ${request.feature} has been ${action}d.`,
      variant: action === 'approve' ? 'default' : 'destructive'
    });
    
    setSelectedRequest(null);
    setAdminComment('');
    setConfirmDialog({ open: false, type: 'approve', request: null });
  };

  const filteredRequests = (() => {
    let filtered = requests;
    
    // Apply search filter
    if (debouncedSearchQuery) {
      filtered = searchFilter(
        filtered,
        debouncedSearchQuery,
        ['feature', 'userRole', 'reason']
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    return filtered;
  })();

  const pendingCount = requests.filter(req => req.status === 'pending').length;
  const approvedCount = requests.filter(req => req.status === 'approved').length;
  const rejectedCount = requests.filter(req => req.status === 'rejected').length;

  // Analytics calculations
  const topRequestedFeatures = analytics.reduce((acc, item) => {
    acc[item.feature] = (acc[item.feature] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostActiveRoles = analytics.reduce((acc, item) => {
    acc[item.userRole] = (acc[item.userRole] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Feature Request Management</h2>
          <p className="text-muted-foreground">Review and manage user feature access requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Access granted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Access denied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Attempts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.length}</div>
            <p className="text-xs text-muted-foreground">Feature access attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Requests List */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Access Requests</CardTitle>
              <CardDescription>
                {filteredRequests.length} of {requests.length} requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">No requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{request.feature}</h4>
                          <Badge variant="outline">{request.userRole}</Badge>
                          <Badge variant={
                            request.status === 'pending' ? 'default' :
                            request.status === 'approved' ? 'secondary' : 'destructive'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Reason: {request.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Requested: {request.timestamp.toLocaleDateString()} at {request.timestamp.toLocaleTimeString()}
                        </p>
                        {request.adminComment && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Admin note: {request.adminComment}
                          </p>
                        )}
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setConfirmDialog({ open: true, type: 'approve', request });
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setConfirmDialog({ open: true, type: 'reject', request });
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Requested Features</CardTitle>
                <CardDescription>Features with highest access attempt frequency</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(topRequestedFeatures)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([feature, count]) => (
                    <div key={feature} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium">{feature}</span>
                      <Badge variant="outline">{count} attempts</Badge>
                    </div>
                  ))}
                {Object.keys(topRequestedFeatures).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No usage data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Active Roles</CardTitle>
                <CardDescription>User roles with highest feature request activity</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(mostActiveRoles)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium">{role}</span>
                      <Badge variant="outline">{count} requests</Badge>
                    </div>
                  ))}
                {Object.keys(mostActiveRoles).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No usage data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={`${confirmDialog.type === 'approve' ? 'Approve' : 'Reject'} Feature Request`}
        description={`Are you sure you want to ${confirmDialog.type} the request for ${confirmDialog.request?.feature}?`}
        confirmText={confirmDialog.type === 'approve' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        variant={confirmDialog.type === 'approve' ? 'default' : 'destructive'}
        onConfirm={() => {
          if (confirmDialog.request) {
            handleRequestAction(confirmDialog.request, confirmDialog.type);
          }
        }}
      />

      {/* Admin Comment Modal */}
      {selectedRequest && confirmDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setConfirmDialog({ ...confirmDialog, open: false });
            setSelectedRequest(null);
          }
        }}>
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add Admin Comment</CardTitle>
              <CardDescription>
                Optional comment for {confirmDialog.type === 'approve' ? 'approving' : 'rejecting'} this request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add a comment explaining your decision..."
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmDialog({ ...confirmDialog, open: false });
                    setSelectedRequest(null);
                    setAdminComment('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant={confirmDialog.type === 'approve' ? 'default' : 'destructive'}
                  onClick={() => {
                    if (selectedRequest) {
                      handleRequestAction(selectedRequest, confirmDialog.type);
                    }
                  }}
                >
                  {confirmDialog.type === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};