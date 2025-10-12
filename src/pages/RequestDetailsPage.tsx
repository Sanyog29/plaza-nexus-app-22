
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { formatUserNameFromProfile } from '@/utils/formatters';

const RequestDetailsPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isStaff: userIsStaff } = useAuth();
  const { toast } = useToast();
  
  // UUID validation and sanitization
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValidUuid = requestId && uuidRegex.test(requestId);
  const sanitizedRequestId = isValidUuid ? requestId : undefined;
  
  // Redirect if requestId is "new" or invalid
  useEffect(() => {
    if (requestId === 'new' || !isValidUuid) {
      if (isAdmin) {
        navigate('/admin/requests/new', { replace: true });
      } else if (userIsStaff) {
        navigate('/staff/requests/new', { replace: true });
      } else {
        navigate('/requests/new', { replace: true });
      }
      return;
    }
  }, [requestId, isValidUuid, isAdmin, userIsStaff, navigate]);
  
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [showTimeExtensionModal, setShowTimeExtensionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { extensions } = useTimeExtensions(sanitizedRequestId);
  
  useEffect(() => {
    if (sanitizedRequestId) {
      fetchRequestDetails();
      checkStaffStatus();
    }
  }, [sanitizedRequestId, user]);

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
    if (!sanitizedRequestId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          main_categories!maintenance_requests_category_id_fkey(name),
          maintenance_processes(name, description),
          building_floors(name)
        `)
        .eq('id', sanitizedRequestId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        // Fetch reporter name using the reliable database function
        let reporterName = 'Unknown User';
        if (data.reported_by) {
          const { data: reporterNameData } = await supabase
            .rpc('get_user_display_name', { user_uuid: data.reported_by });
          if (reporterNameData) reporterName = reporterNameData;
        }

        // Fetch assignee name using the reliable database function
        let assigneeName = null;
        if (data.assigned_to) {
          const { data: assigneeNameData } = await supabase
            .rpc('get_user_display_name', { user_uuid: data.assigned_to });
          if (assigneeNameData) assigneeName = assigneeNameData;
        }

        // Enhance the data with fetched names
        const enhancedData = {
          ...data,
          reporter: { 
            first_name: reporterName.split(' ')[0] || reporterName,
            last_name: reporterName.split(' ').slice(1).join(' ') || '',
            email: ''
          },
          assignee: assigneeName ? {
            first_name: assigneeName.split(' ')[0] || assigneeName,
            last_name: assigneeName.split(' ').slice(1).join(' ') || '',
            email: ''
          } : null
        };
        
        setRequest(enhancedData);
      } else {
        setRequest(data);
      }
      
      // Set up real-time subscription for workflow updates
      const channel = supabase
        .channel(`request_${sanitizedRequestId}_workflow`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'maintenance_requests',
            filter: `id=eq.${sanitizedRequestId}`
          },
          (payload) => {
            console.log('Request updated via realtime:', payload.new);
            // If assignment changed, refetch to get updated assignee profile
            if (payload.old?.assigned_to !== payload.new?.assigned_to) {
              fetchRequestDetails();
            } else {
              setRequest((prev: any) => ({ ...prev, ...payload.new }));
            }
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

  // Early return if no valid requestId - component will redirect
  if (!sanitizedRequestId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-center items-center h-40">
          <p className="text-foreground">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-center items-center h-40">
          <p className="text-foreground">Request not found</p>
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
                <h1 className="text-3xl font-bold text-foreground mb-3">{request.title}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline">{request.main_categories?.name || 'Uncategorized'}</Badge>
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
              <h2 className="text-lg font-semibold text-foreground mb-2">Issue Description</h2>
              <p className="text-foreground leading-relaxed mb-4">{request.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Created: {new Date(request.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>Reported by: {formatUserNameFromProfile(request.reporter)}</span>
                </div>
                {request.assignee && (
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4" />
                    <span>Assigned to: {formatUserNameFromProfile(request.assignee)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-foreground">
                  <div className="h-4 w-4 flex items-center justify-center">
                    🏢
                  </div>
                  <span>
                    {request.building_floors?.name && request.location
                      ? `${request.building_floors.name} - ${request.location}`
                      : request.building_floors?.name
                      ? `${request.building_floors.name} - Location not specified`
                      : request.location || 'Location not specified'}
                  </span>
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
          <h3 className="text-xl font-semibold text-foreground mb-4">Request Progress</h3>
          <TicketProgressBar
            status={request.status}
            assignedAt={request.assigned_at}
            workStartedAt={request.work_started_at}
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
          <h3 className="text-xl font-semibold text-foreground mb-3">Attachments</h3>
          <AttachmentViewer requestId={requestId!} />
        </CardContent>
      </Card>

      {/* Feedback System for closed requests */}
      {request.status === 'closed' && requestId && (
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
          <h3 className="text-xl font-bold text-foreground mb-4">Communication</h3>
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
