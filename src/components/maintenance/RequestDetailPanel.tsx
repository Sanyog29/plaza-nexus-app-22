import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RequestWorkflowManager from './RequestWorkflowManager';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Clock, CheckCircle, AlertTriangle, MessageSquare, Calendar, MapPin, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RequestComments from './RequestComments';
import AssignedTechnicianInfo from './AssignedTechnicianInfo';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { Database } from '@/integrations/supabase/types';
import { formatUserNameFromProfile } from '@/utils/formatters';

type RequestPriority = Database['public']['Enums']['request_priority'];
type RequestStatus = Database['public']['Enums']['request_status'];

interface RequestDetailPanelProps {
  requestId: string;
  onUpdate?: () => void;
}

const RequestDetailPanel: React.FC<RequestDetailPanelProps> = ({
  requestId,
  onUpdate
}) => {
  const [request, setRequest] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState<RequestStatus | null>(null);
  const [updatedAssignee, setUpdatedAssignee] = useState<string | null>(null);
  const [updatedPriority, setUpdatedPriority] = useState<RequestPriority | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<{ url: string; title: string } | null>(null);
  const { toast } = useToast();
  const { user, isL1, isStaff } = useAuth();

  useEffect(() => {
    fetchRequestDetails();
    fetchStaff();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          main_categories!maintenance_requests_main_category_id_fkey(name),
          reporter:profiles!maintenance_requests_reported_by_fkey(first_name, last_name, email),
          assignee:profiles!maintenance_requests_assigned_to_fkey(first_name, last_name, email),
          maintenance_processes(name, description),
          building_floors(name)
        `)
        .eq('id', requestId)
        .maybeSingle();

      if (error) throw error;
      
      // Process data to prefer main_category_id over category_id
      if (data) {
        const processedData = {
          ...data,
          main_categories: (data as any).main_categories || (data as any).main_categories_fallback
        };
        setRequest(processedData);
        setUpdatedStatus(processedData.status);
        setUpdatedAssignee(processedData.assigned_to);
        setUpdatedPriority(processedData.priority);
      } else {
        setRequest(data);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching request details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_public')
        .select('*')
        .in('role', ['admin', 'mst', 'fe', 'hk', 'se', 'assistant_manager', 'assistant_floor_manager']);

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      
      // Auto-update status to 'assigned' when assigning someone to a pending ticket
      let finalStatus = updatedStatus;
      const isNewAssignment = updatedAssignee && !request.assigned_to;
      if (isNewAssignment && updatedStatus === 'pending') {
        finalStatus = 'assigned' as RequestStatus;
        setUpdatedStatus(finalStatus);
      }
      
      const updates: Record<string, any> = {
        status: finalStatus as RequestStatus,
        assigned_to: updatedAssignee,
        priority: updatedPriority as RequestPriority,
        updated_at: new Date().toISOString(),
        // Set assigned_at when first assigned
        ...(isNewAssignment && { assigned_at: new Date().toISOString() })
      };

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      if (statusNote.trim() && updatedStatus !== request.status) {
        const { error: historyError } = await supabase
          .from('request_status_history')
          .insert({
            request_id: requestId,
            status: updatedStatus as RequestStatus,
            notes: statusNote,
            changed_by: user?.id
          });

        if (historyError) throw historyError;
      }

      toast({
        title: "Request updated",
        description: "The maintenance request has been updated successfully."
      });
      
      fetchRequestDetails();
      if (onUpdate) onUpdate();
      setStatusNote('');
    } catch (error: any) {
      toast({
        title: "Error updating request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getSLAInfo = () => {
    if (!request || !request.sla_breach_at) return null;
    const now = new Date();
    const breachDate = new Date(request.sla_breach_at);

    if (now > breachDate) {
      return {
        breached: true,
        percentage: 0,
        timeLeft: "SLA Breached"
      };
    }

    const diffMs = breachDate.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    let percentage = 100;
    if (diffMinutes < 60) {
      percentage = 10;
    } else if (diffMinutes < 240) {
      percentage = 25;
    } else if (diffMinutes < 720) {
      percentage = 50;
    } else if (diffMinutes < 1440) {
      percentage = 75;
    }

    return {
      breached: false,
      percentage,
      timeLeft: `${hours}h ${minutes}m left`
    };
  };

  const slaInfo = request ? getSLAInfo() : null;

  if (loading) {
    return <div className="p-4 text-center text-foreground">Loading request details...</div>;
  }

  if (!request) {
    return <div className="p-4 text-center text-foreground">Request not found</div>;
  }

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-600">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-600">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-600">Accepted</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-600">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'closed':
        return <Badge className="bg-green-600">Closed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // isStaff is now from useAuth hook

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <CardTitle className="text-lg text-foreground">Request Details</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </CardHeader>
        
        {expanded && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-foreground">{request.title}</h3>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <MapPin size={14} />
                  <span>
                    {request.building_floors?.name && request.location
                      ? `${request.building_floors.name} - ${request.location}`
                      : request.building_floors?.name
                      ? `${request.building_floors.name} - Location not specified`
                      : request.location || 'Location not specified'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-foreground mb-1">Category</p>
                  <p className="font-medium text-foreground">{request.main_categories?.name || 'Uncategorized'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-foreground mb-1">Process</p>
                  <Badge variant="outline" className="bg-primary/20 text-primary">
                    {request.maintenance_processes?.name || 'No Process Assigned'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-foreground mb-1">Priority</p>
                  {renderPriorityBadge(request.priority)}
                </div>
                
                <div>
                  <p className="text-sm text-foreground mb-1">Status</p>
                  {renderStatusBadge(request.status)}
                </div>
                
                <div>
                  <p className="text-sm text-foreground mb-1">Reported by</p>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-plaza-blue" />
                    <p className="font-medium text-foreground">
                      {formatUserNameFromProfile(request.reporter)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-foreground mb-1">Created at</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-plaza-blue" />
                    <p className="font-medium text-foreground">{format(new Date(request.created_at), 'PPp')}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-foreground mb-1">Updated at</p>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-plaza-blue" />
                    <p className="font-medium text-foreground">{format(new Date(request.updated_at), 'PPp')}</p>
                  </div>
                </div>

                {slaInfo && (
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-foreground">SLA Status</p>
                      <Badge
                        className={`${slaInfo.breached ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}
                        variant="outline"
                      >
                        {slaInfo.breached ? <AlertTriangle size={12} className="mr-1" /> : <Timer size={12} className="mr-1" />}
                        {slaInfo.timeLeft}
                      </Badge>
                    </div>
                    <Progress
                      value={slaInfo.percentage}
                      className="h-2"
                      indicatorClassName={slaInfo.percentage < 25 ? "bg-red-600" : "bg-yellow-600"}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm text-foreground mb-1">Description</p>
                <p className="text-foreground whitespace-pre-wrap">{request.description}</p>
              </div>

              {/* Photos Section */}
              {(request.before_photo_url || request.after_photo_url) && (
                <div>
                  <p className="text-sm text-foreground mb-2">Photos</p>
                  <div className="grid grid-cols-2 gap-4">
                    {request.before_photo_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Before</p>
                        <img
                          src={request.before_photo_url}
                          alt="Before"
                          className="w-full h-64 object-contain rounded-lg border cursor-pointer hover:opacity-90 transition-opacity bg-muted/30"
                          onClick={() => setPhotoPreview({ url: request.before_photo_url!, title: 'Before' })}
                        />
                      </div>
                    )}
                    {request.after_photo_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">After</p>
                        <img
                          src={request.after_photo_url}
                          alt="After"
                          className="w-full h-64 object-contain rounded-lg border cursor-pointer hover:opacity-90 transition-opacity bg-muted/30"
                          onClick={() => setPhotoPreview({ url: request.after_photo_url!, title: 'After' })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photo Preview Dialog */}
              <Dialog open={!!photoPreview} onOpenChange={() => setPhotoPreview(null)}>
                <DialogContent className="max-w-5xl">
                  <DialogHeader>
                    <DialogTitle>{photoPreview?.title} Photo</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-center p-4">
                    <img
                      src={photoPreview?.url}
                      alt={photoPreview?.title}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Admin/Staff Update Section */}
              {isStaff && (
                <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t border-gray-700">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground">Priority</label>
                    <Select
                      value={updatedPriority || undefined}
                      onValueChange={(value) => setUpdatedPriority(value as RequestPriority)}
                      disabled={updating}
                    >
                      <SelectTrigger className="bg-card border-gray-700">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground">Assign To</label>
                    <Select
                      value={updatedAssignee || 'unassigned'}
                      onValueChange={(value) => setUpdatedAssignee(value === 'unassigned' ? null : value)}
                      disabled={updating}
                    >
                      <SelectTrigger className="bg-card border-gray-700">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {updatedStatus !== request.status && (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-foreground">Status Update Note</label>
                      <Textarea
                        placeholder="Add a note about this status change..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="bg-card border-gray-700"
                        disabled={updating}
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleUpdate}
                      disabled={updating}
                      className="bg-plaza-blue hover:bg-blue-700"
                    >
                      {updating ? 'Updating...' : 'Update Request'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>


      {/* Assigned Technician Info */}
      <AssignedTechnicianInfo
        assignedToUserId={request.assigned_to}
        acceptedAt={request.assigned_at}
        startedAt={request.work_started_at}
        status={request.status}
      />

      {/* Unified Workflow Manager - For all staff */}
      {isStaff && (
        <div id="workflow-manager-section">
          <RequestWorkflowManager
            requestId={requestId}
            requestStatus={request.status}
            assignedToUserId={request.assigned_to}
            beforePhotoUrl={request.before_photo_url}
            afterPhotoUrl={request.after_photo_url}
            onUpdate={fetchRequestDetails}
          />
        </div>
      )}

      {/* Comments Section */}
      <div className="mt-6">
        <RequestComments requestId={requestId} />
      </div>
    </div>
  );
};

export default RequestDetailPanel;
