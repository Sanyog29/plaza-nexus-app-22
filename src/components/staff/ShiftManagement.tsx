import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { 
  Clock, 
  Calendar as CalendarIcon,
  Users, 
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserX,
  Shuffle
} from 'lucide-react';

interface ShiftSchedule {
  id: string;
  staff_id: string;
  shift_start: string;
  shift_end: string;
  shift_type: string;
  status: string;
  break_start?: string;
  break_end?: string;
  notes?: string;
  staff_name?: string;
}

interface ShiftChangeRequest {
  id: string;
  requested_by: string;
  original_shift_start: string;
  original_shift_end: string;
  requested_shift_start: string;
  requested_shift_end: string;
  reason: string;
  status: string;
  created_at: string;
  staff_name?: string;
}

const ShiftManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [changeRequests, setChangeRequests] = useState<ShiftChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');

  // Form states
  const [newShift, setNewShift] = useState({
    staff_id: '',
    shift_start: '',
    shift_end: '',
    shift_type: 'regular',
    notes: ''
  });

  const [changeRequest, setChangeRequest] = useState({
    original_shift_start: '',
    original_shift_end: '',
    requested_shift_start: '',
    requested_shift_end: '',
    reason: ''
  });

  const [staffList, setStaffList] = useState<any[]>([]);

  // Fetch staff list
  useEffect(() => {
    const fetchStaff = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['field_staff', 'ops_supervisor'])
        .eq('approval_status', 'approved');
      
      if (data) {
        setStaffList(data);
      }
    };

    fetchStaff();
  }, []);

  // Fetch shifts for selected week
  useEffect(() => {
    fetchShifts();
    fetchChangeRequests();
  }, [selectedDate]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);

      const { data, error } = await supabase
        .from('shift_schedules')
        .select(`
          *,
          profiles:staff_id(first_name, last_name)
        `)
        .gte('shift_start', weekStart.toISOString())
        .lte('shift_end', weekEnd.toISOString())
        .order('shift_start');

      if (error) throw error;

      const shiftsWithNames = data?.map(shift => ({
        ...shift,
        staff_name: `${shift.profiles?.first_name} ${shift.profiles?.last_name}`
      })) || [];

      setShifts(shiftsWithNames);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shifts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_change_requests')
        .select(`
          *,
          requested_by_profile:profiles!shift_change_requests_requested_by_fkey(first_name, last_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requestsWithNames = data?.map(request => ({
        ...request,
        staff_name: `${request.requested_by_profile?.first_name} ${request.requested_by_profile?.last_name}`
      })) || [];

      setChangeRequests(requestsWithNames);
    } catch (error) {
      console.error('Error fetching change requests:', error);
    }
  };

  const createShift = async () => {
    if (!newShift.staff_id || !newShift.shift_start || !newShift.shift_end) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('shift_schedules')
        .insert({
          staff_id: newShift.staff_id,
          shift_start: newShift.shift_start,
          shift_end: newShift.shift_end,
          shift_type: newShift.shift_type,
          notes: newShift.notes || null
        });

      if (error) throw error;

      toast({
        title: "Shift Created",
        description: "New shift has been scheduled successfully",
      });

      setNewShift({
        staff_id: '',
        shift_start: '',
        shift_end: '',
        shift_type: 'regular',
        notes: ''
      });

      fetchShifts();
    } catch (error) {
      console.error('Error creating shift:', error);
      toast({
        title: "Error",
        description: "Failed to create shift",
        variant: "destructive"
      });
    }
  };

  const requestShiftChange = async () => {
    if (!changeRequest.original_shift_start || !changeRequest.requested_shift_start || !changeRequest.reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('shift_change_requests')
        .insert({
          requested_by: user?.id,
          original_shift_start: changeRequest.original_shift_start,
          original_shift_end: changeRequest.original_shift_end,
          requested_shift_start: changeRequest.requested_shift_start,
          requested_shift_end: changeRequest.requested_shift_end,
          reason: changeRequest.reason
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your shift change request has been submitted for review",
      });

      setChangeRequest({
        original_shift_start: '',
        original_shift_end: '',
        requested_shift_start: '',
        requested_shift_end: '',
        reason: ''
      });

      fetchChangeRequests();
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast({
        title: "Error",
        description: "Failed to submit shift change request",
        variant: "destructive"
      });
    }
  };

  const handleChangeRequest = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const { error } = await supabase
        .from('shift_change_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `Shift change request has been ${action}d`,
      });

      fetchChangeRequests();
    } catch (error) {
      console.error('Error handling change request:', error);
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive"
      });
    }
  };

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'default';
      case 'overtime': return 'secondary';
      case 'emergency': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shift Management</h1>
          <p className="text-muted-foreground">
            Manage staff schedules and shift assignments
          </p>
        </div>
        <Clock className="h-8 w-8 text-primary" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="create">Create Shift</TabsTrigger>
          <TabsTrigger value="change">Request Change</TabsTrigger>
          <TabsTrigger value="requests">
            Change Requests
            {changeRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {changeRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Week Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Week of {format(startOfWeek(selectedDate), 'MMM dd')} - {format(endOfWeek(selectedDate), 'MMM dd, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading shifts...</div>
                  ) : shifts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No shifts scheduled for this week</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {shifts.map((shift) => (
                        <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div 
                              className={`w-4 h-4 rounded-full ${getShiftStatusColor(shift.status)}`}
                              title={`Status: ${shift.status}`}
                            />
                            <div>
                              <p className="font-medium">{shift.staff_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(shift.shift_start), 'MMM dd, HH:mm')} - 
                                {format(new Date(shift.shift_end), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getShiftTypeColor(shift.shift_type)}>
                              {shift.shift_type}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {shift.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Shift</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="staff">Staff Member</Label>
                <Select 
                  value={newShift.staff_id} 
                  onValueChange={(value) => setNewShift(prev => ({ ...prev, staff_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.first_name} {staff.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Shift Start</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={newShift.shift_start}
                    onChange={(e) => setNewShift(prev => ({ ...prev, shift_start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end">Shift End</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={newShift.shift_end}
                    onChange={(e) => setNewShift(prev => ({ ...prev, shift_end: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type">Shift Type</Label>
                <Select 
                  value={newShift.shift_type} 
                  onValueChange={(value) => setNewShift(prev => ({ ...prev, shift_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="overtime">Overtime</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newShift.notes}
                  onChange={(e) => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or instructions"
                  rows={3}
                />
              </div>

              <Button onClick={createShift} className="w-full">
                Create Shift
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="change" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Shift Change</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="original_start">Original Shift Start</Label>
                  <Input
                    id="original_start"
                    type="datetime-local"
                    value={changeRequest.original_shift_start}
                    onChange={(e) => setChangeRequest(prev => ({ ...prev, original_shift_start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="original_end">Original Shift End</Label>
                  <Input
                    id="original_end"
                    type="datetime-local"
                    value={changeRequest.original_shift_end}
                    onChange={(e) => setChangeRequest(prev => ({ ...prev, original_shift_end: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requested_start">Requested Shift Start</Label>
                  <Input
                    id="requested_start"
                    type="datetime-local"
                    value={changeRequest.requested_shift_start}
                    onChange={(e) => setChangeRequest(prev => ({ ...prev, requested_shift_start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="requested_end">Requested Shift End</Label>
                  <Input
                    id="requested_end"
                    type="datetime-local"
                    value={changeRequest.requested_shift_end}
                    onChange={(e) => setChangeRequest(prev => ({ ...prev, requested_shift_end: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Change</Label>
                <Textarea
                  id="reason"
                  value={changeRequest.reason}
                  onChange={(e) => setChangeRequest(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please explain why you need this shift change"
                  rows={3}
                />
              </div>

              <Button onClick={requestShiftChange} className="w-full">
                Submit Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Change Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {changeRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending change requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {changeRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{request.staff_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Requested {format(new Date(request.created_at || ''), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {request.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <p className="font-medium">Original:</p>
                          <p className="text-muted-foreground">
                            {format(new Date(request.original_shift_start), 'MMM dd, HH:mm')} - 
                            {format(new Date(request.original_shift_end), 'HH:mm')}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Requested:</p>
                          <p className="text-muted-foreground">
                            {format(new Date(request.requested_shift_start), 'MMM dd, HH:mm')} - 
                            {format(new Date(request.requested_shift_end), 'HH:mm')}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="font-medium text-sm mb-1">Reason:</p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleChangeRequest(request.id, 'approve')}
                            className="flex-1"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeRequest(request.id, 'reject')}
                            className="flex-1"
                          >
                            <UserX className="h-4 w-4 mr-2" />
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
      </Tabs>
    </div>
  );
};

export default ShiftManagement;