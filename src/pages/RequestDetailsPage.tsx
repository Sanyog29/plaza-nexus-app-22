
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ArrowLeft, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import RequestDetailPanel from '@/components/maintenance/RequestDetailPanel';
import AttachmentViewer from '@/components/maintenance/AttachmentViewer';
import RequestFeedbackSystem from '@/components/maintenance/RequestFeedbackSystem';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ClaimedTaskBanner } from '@/components/maintenance/ClaimedTaskBanner';
import TicketProgressBar from '@/components/maintenance/TicketProgressBar';
import { AssignToMeButton } from '@/components/maintenance/AssignToMeButton';
import { TimeExtensionModal } from '@/components/maintenance/TimeExtensionModal';
import { useTimeExtensions } from '@/hooks/useTimeExtensions';

const RequestDetailsPage = () => {
  const { requestId } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [showTimeExtensionModal, setShowTimeExtensionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { extensions } = useTimeExtensions(requestId);
  
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
      
      // Set up real-time subscription for workflow updates
      const channel = supabase
        .channel(`request_${requestId}_workflow`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'maintenance_requests',
            filter: `id=eq.${requestId}`
          },
          (payload) => {
            setRequest((prev: any) => ({ ...prev, ...payload.new }));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
    // Scroll to the TechnicianWorkflowButtons section for photo upload
    const workflowSection = document.getElementById('technician-workflow-section');
    if (workflowSection) {
      workflowSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    } else {
      toast({
        title: "Photo Upload",
        description: "Please scroll down to the workflow section to upload photos.",
      });
    }
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

      {/* Issue Information - Showcased at the top */}
      <Card className="bg-card mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-3">{request.title}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline">{request.category?.name || 'Uncategorized'}</Badge>
                  <Badge 
                    variant={request.priority === 'high' ? 'destructive' : 'default'}
                    className="capitalize"
                  >
                    {request.priority} Priority
                  </Badge>
                  <Badge 
                    className="capitalize"
                    variant={request.status === 'in_progress' ? 'default' : 'secondary'}
                  >
                    {request.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-card/50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-2">Issue Description</h2>
              <p className="text-gray-300 leading-relaxed mb-4">{request.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="h-4 w-4 flex items-center justify-center">
                    📍
                  </div>
                  <span>Location: {request.location}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Assign Button for L1 Staff */}
      <AssignToMeButton
        requestId={requestId!}
        requestStatus={request.status}
        priority={request.priority}
        location={request.location}
        assignedTo={request.assigned_to}
        userId={user?.id}
        isStaff={isStaff}
        onSuccess={fetchRequestDetails}
      />

      {/* Request Progress Tracker */}
      <Card className="bg-card mb-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Request Progress</h3>
          <TicketProgressBar
            status={request.status}
            acceptedAt={request.assigned_at}
            startedAt={request.work_started_at}
            beforePhotoUrl={request.before_photo_url}
            afterPhotoUrl={request.after_photo_url}
            completedAt={request.completed_at}
          />
        </CardContent>
      </Card>

      {/* Claimed Task Banner - Show if current user is assigned to this task */}
      {isCurrentUserAssigned && (
        <div className="mb-6">
          <ClaimedTaskBanner
            request={request}
            onUploadPhotos={handleUploadPhotos}
            isProcessing={isProcessing}
          />
        </div>
      )}

      {/* Attachments Section */}
      <Card className="bg-card mb-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-white mb-3">Attachments</h3>
          <AttachmentViewer requestId={requestId!} />
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

      {/* Time Extension Modal */}
      <TimeExtensionModal
        open={showTimeExtensionModal}
        onOpenChange={setShowTimeExtensionModal}
        requestId={requestId!}
        onSuccess={fetchRequestDetails}
      />
    </div>
  );
};

export default RequestDetailsPage;
