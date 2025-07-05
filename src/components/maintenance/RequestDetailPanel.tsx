import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, Clock, CheckCircle, AlertTriangle, MessageSquare, 
  Calendar, MapPin, ChevronDown, ChevronUp, Timer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RequestComments from './RequestComments';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { Database } from '@/integrations/supabase/types';

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
  const { toast } = useToast();
  const { user } = useAuth();

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
          category:category_id(name),
          reporter:reported_by(first_name, last_name),
          assignee:assigned_to(first_name, last_name)
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      
      setRequest(data);
      setUpdatedStatus(data.status);
      setUpdatedAssignee(data.assigned_to);
      setUpdatedPriority(data.priority);
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
      // Fetch users with staff or admin role
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['staff', 'admin']);

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      
      const updates = {
        status: updatedStatus as RequestStatus,
        assigned_to: updatedAssignee,
        priority: updatedPriority as RequestPriority,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // If there's a status note, add it to the history
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
        description: "The maintenance request has been updated successfully.",
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
    
    // If already breached
    if (now > breachDate) {
      return {
        breached: true,
        percentage: 0,
        timeLeft: "SLA Breached"
      };
    }
    
    // Calculate time left in minutes
    const diffMs = breachDate.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    // Assuming SLA is typically 24-48 hours, adjust the percentage accordingly
    // This is a rough estimate - you might want to calculate based on the actual SLA time
    let percentage = 100;
    if (diffMinutes < 60) { // Less than 1 hour
      percentage = 10;
    } else if (diffMinutes < 240) { // Less than 4 hours
      percentage = 25;
    } else if (diffMinutes < 720) { // Less than 12 hours
      percentage = 50;
    } else if (diffMinutes < 1440) { // Less than 24 hours
      percentage = 75;
    }
    
    return {
      breached: false,
      percentage,
      timeLeft: `${hours}h ${minutes}m left`
    };
  }
  
  const slaInfo = request ? getSLAInfo() : null;

  if (loading) {
    return <div className="p-4 text-center text-gray-400">Loading request details...</div>;
  }

  if (!request) {
    return <div className="p-4 text-center text-gray-400">Request not found</div>;
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
      case 'in_progress':
        return <Badge className="bg-blue-600">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Card className="bg-card/50 backdrop-blur mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg text-white">
            Request Details
          </CardTitle>
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
              <h3 className="text-xl font-bold text-white">{request.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} />
                <span>{request.location}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Category</p>
                <p className="font-medium text-white">{request.category?.name || 'Uncategorized'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Reported by</p>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-plaza-blue" />
                  <p className="font-medium text-white">
                    {request.reporter?.first_name ? 
                      `${request.reporter.first_name} ${request.reporter.last_name}` : 
                      'Unknown'}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Created at</p>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-plaza-blue" />
                  <p className="font-medium text-white">{format(new Date(request.created_at), 'PPp')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Updated at</p>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-plaza-blue" />
                  <p className="font-medium text-white">{format(new Date(request.updated_at), 'PPp')}</p>
                </div>
              </div>

              {slaInfo && (
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-400">SLA Status</p>
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
              <p className="text-sm text-gray-400 mb-1">Description</p>
              <p className="text-white whitespace-pre-wrap">{request.description}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t border-gray-700">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white">Status</label>
                <Select 
                  value={updatedStatus || undefined} 
                  onValueChange={(value) => setUpdatedStatus(value as RequestStatus)}
                  disabled={updating}
                >
                  <SelectTrigger className="bg-card border-gray-700">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white">Priority</label>
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
                <label className="text-sm font-medium text-white">Assign To</label>
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
                  <label className="text-sm font-medium text-white">Status Update Note</label>
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
            
            <div className="mt-6">
              <RequestComments requestId={requestId} />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default RequestDetailPanel;
