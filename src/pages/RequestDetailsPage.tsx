
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ArrowLeft, Timer, AlertTriangle, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RequestDetailPanel from '@/components/maintenance/RequestDetailPanel';
import AttachmentViewer from '@/components/maintenance/AttachmentViewer';
import RequestFeedbackSystem from '@/components/maintenance/RequestFeedbackSystem';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ClaimedTaskBanner } from '@/components/maintenance/ClaimedTaskBanner';

const RequestDetailsPage = () => {
  const { requestId } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
      checkStaffStatus();
    }
  }, [requestId, user]);

  const checkStaffStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('is_staff', { uid: user.id });
      if (error) throw error;
      setIsStaff(!!data);
    } catch (error) {
      console.error('Error checking staff status:', error);
    }
  };

  const fetchRequestDetails = async () => {
    if (!requestId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          category:category_id(name)
        `)
        .eq('id', requestId)
        .maybeSingle();
        
      if (error) throw error;
      setRequest(data);
    } catch (error: any) {
      toast({
        title: "Error fetching request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-400">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-400">Request not found</p>
        </div>
      </div>
    );
  }

  const handleStartTask = async () => {
    if (!requestId) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;


      setRequest(prev => ({ ...prev, status: 'in_progress' }));
      toast({
        title: "Task Started",
        description: "You have started working on this task.",
      });
    } catch (error) {
      console.error('Error starting task:', error);
      toast({
        title: "Error",
        description: "Failed to start task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadPhotos = () => {
    // Navigate to photo upload or open a modal
    toast({
      title: "Photo Upload",
      description: "Photo upload feature coming soon!",
    });
  };

  const formatSlaTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m left`;
  };

  const isCurrentUserAssigned = user && request?.assigned_to === user.id;

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Link to="/requests">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>

      {/* Claimed Task Banner - Show if current user is assigned to this task */}
      {isCurrentUserAssigned && (
        <div className="mb-6">
          <ClaimedTaskBanner
            request={request}
            onStartTask={handleStartTask}
            onUploadPhotos={handleUploadPhotos}
            isProcessing={isProcessing}
          />
        </div>
      )}

      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{request.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Badge variant="outline">{request.category?.name || 'Uncategorized'}</Badge>
                  <Badge 
                    variant={request.priority === 'high' ? 'destructive' : 'default'}
                    className="capitalize"
                  >
                    {request.priority} Priority
                  </Badge>
                </div>
              </div>
              <Badge 
                className="capitalize"
                variant={request.status === 'in_progress' ? 'default' : 'secondary'}
              >
                {request.status?.replace('_', ' ')}
              </Badge>
            </div>

            {/* SLA Timer Card */}
            {request.status !== 'completed' && request.sla_breach_at && (
              <Card className="bg-card/50 border-yellow-800/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Timer size={18} className="text-yellow-500" />
                      <div>
                        <h3 className="font-medium text-white">SLA Timer</h3>
                        <p className="text-sm text-yellow-400">
                          Resolution by: {new Date(request.sla_breach_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400">
                      Due: {new Date(request.sla_breach_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                  </div>
                  <Progress 
                    value={35} 
                    className="mt-3 h-2" 
                  />
                </CardContent>
              </Card>
            )}

            {/* Auto Escalation Rules */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-2 gap-2 bg-card/50 border-red-800/30 hover:bg-red-950/20">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-sm text-red-400">View Auto-Escalation Workflow</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Auto-Escalation Workflow</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    This request will automatically escalate if not resolved within the SLA.
                  </DialogDescription>
                </DialogHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Condition</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        condition: 'SLA < 30 min', 
                        action: 'Notify Maintenance Manager',
                        status: 'Pending'
                      },
                      {
                        condition: 'SLA Breach', 
                        action: 'Boost Priority to Critical',
                        status: 'Pending'
                      },
                      {
                        condition: 'SLA Breach + 30 min', 
                        action: 'Escalate to Building Manager',
                        status: 'Pending'
                      }
                    ].map((rule, index) => (
                      <TableRow key={index}>
                        <TableCell>{rule.condition}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <User size={14} className="text-plaza-blue" />
                          {rule.action}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-800/50">
                            {rule.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(request.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MessageSquare className="h-4 w-4" />
                <span>Reported by: {request.reported_by}</span>
              </div>
              {request.assigned_to && (
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="h-4 w-4" />
                  <span>Assigned to: {request.assigned_to}</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-400">{request.description}</p>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
              <p className="text-gray-400">{request.location}</p>
            </div>

            {/* Attachments Section */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Attachments</h3>
              <AttachmentViewer requestId={requestId!} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback System for completed requests */}
      {request.status === 'completed' && requestId && (
        <div className="mt-6">
          <RequestFeedbackSystem
            requestId={requestId}
            requestTitle={request.title}
            completedAt={request.completed_at}
            onFeedbackSubmitted={fetchRequestDetails}
          />
        </div>
      )}
      
      {/* For staff, show the detailed management panel */}
      {isStaff && requestId && (
        <RequestDetailPanel 
          requestId={requestId} 
          onUpdate={fetchRequestDetails}
        />
      )}
      
      {/* For tenants, show just the comments component */}
      {!isStaff && requestId && (
        <div className="mt-6">
          <h3 className="text-xl font-bold text-white mb-4">Communication</h3>
          <RequestDetailPanel 
            requestId={requestId} 
            onUpdate={fetchRequestDetails}
          />
        </div>
      )}
    </div>
  );
};

export default RequestDetailsPage;
