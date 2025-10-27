import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, Calendar, User, CheckCircle, XCircle, 
  AlertCircle, MessageSquare 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';

interface ShiftChangeRequest {
  id: string;
  requested_by: string;
  original_shift_start: string;
  original_shift_end: string;
  requested_shift_start: string;
  requested_shift_end: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  requester_name?: string;
  reviewer_name?: string;
}

export const ShiftChangeManagement: React.FC = () => {
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchShiftChangeRequests();
  }, []);

  const fetchShiftChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_change_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get requester and reviewer names separately to avoid join issues
      const formattedRequests = [];
      for (const request of data || []) {
        const { data: requester } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', request.requested_by)
          .maybeSingle();

        let reviewer = null;
        if (request.reviewed_by) {
          const { data: reviewerData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', request.reviewed_by)
            .maybeSingle();
          reviewer = reviewerData;
        }

        formattedRequests.push({
          ...request,
          status: request.status as 'pending' | 'approved' | 'rejected',
          requester_name: requester 
            ? `${requester.first_name} ${requester.last_name}`.trim()
            : 'Unknown',
          reviewer_name: reviewer 
            ? `${reviewer.first_name} ${reviewer.last_name}`.trim()
            : undefined,
        });
      }

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching shift change requests:', error);
      toast.error('Failed to load shift change requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: string, decision: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to review requests');
        return;
      }

      const { error } = await supabase
        .from('shift_change_requests')
        .update({
          status: decision,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[requestId] || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Shift change request ${decision}`);
      
      // Clear the review notes for this request
      setReviewNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });

      // Refresh the requests
      await fetchShiftChangeRequests();
    } catch (error) {
      console.error('Error reviewing shift change request:', error);
      toast.error('Failed to review request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'pending': return AlertCircle;
      default: return Clock;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Shift Change Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Review and approve staff shift change requests
          </p>
        </div>
        <Badge className="bg-primary/20 text-primary">
          {requests.filter(r => r.status === 'pending').length} Pending
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {requests.filter(r => r.status === 'pending').length}
            </p>
            <p className="text-sm text-muted-foreground">Pending Requests</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {requests.filter(r => r.status === 'approved').length}
            </p>
            <p className="text-sm text-muted-foreground">Approved This Month</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {requests.filter(r => r.status === 'rejected').length}
            </p>
            <p className="text-sm text-muted-foreground">Rejected This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Shift Change Requests */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Shift Change Requests</h3>
              <p className="text-muted-foreground">All shift change requests will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            
            return (
              <Card key={request.id} className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {request.requester_name}
                    </CardTitle>
                    <Badge className={getStatusColor(request.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-foreground">Original Shift</h5>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(request.original_shift_start), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(request.original_shift_start), 'HH:mm')} - 
                          {format(new Date(request.original_shift_end), 'HH:mm')}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-foreground">Requested Shift</h5>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(request.requested_shift_start), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(request.requested_shift_start), 'HH:mm')} - 
                          {format(new Date(request.requested_shift_end), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-2">Reason</h5>
                    <p className="text-sm text-muted-foreground bg-background/20 p-3 rounded-lg">
                      {request.reason}
                    </p>
                  </div>

                  {/* Review Section */}
                  {request.status === 'pending' && (
                    <div className="space-y-3 border-t border-border pt-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Review Notes (Optional)
                        </label>
                        <Textarea
                          placeholder="Add any notes about your decision..."
                          value={reviewNotes[request.id] || ''}
                          onChange={(e) => setReviewNotes(prev => ({
                            ...prev,
                            [request.id]: e.target.value
                          }))}
                          className="min-h-[80px]"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReviewRequest(request.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReviewRequest(request.id, 'rejected')}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Review Details */}
                  {request.status !== 'pending' && (
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-foreground">Review Details</h5>
                        <span className="text-xs text-muted-foreground">
                          {request.reviewed_at && format(new Date(request.reviewed_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Reviewed by: {request.reviewer_name || 'Unknown'}</p>
                        {request.review_notes && (
                          <div className="mt-2 p-3 bg-background/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 mt-0.5" />
                              <span>{request.review_notes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Request Date */}
                  <div className="text-xs text-muted-foreground border-t border-border pt-2">
                    Requested on {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};