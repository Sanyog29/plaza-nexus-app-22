import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, UserPlus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useSimplifiedTasks } from '@/hooks/useSimplifiedTasks';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';

export const SimplifiedTaskSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [newRequest, setNewRequest] = useState({
    category: '',
    location: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    floor: '',
    zone: ''
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const {
    taskCategories,
    taskAssignments,
    isLoading,
    createSimplifiedRequest,
    assignTask,
    completeTask,
    approveTask,
    bulkAssignTasks,
    getMyAssignments,
    getPendingApprovals,
    getTasksByStatus
  } = useSimplifiedTasks();

  const { profile } = useProfile();

  const handleCreateRequest = async () => {
    if (!newRequest.category || !newRequest.location || !newRequest.description) {
      return;
    }

    const result = await createSimplifiedRequest(newRequest);
    if (result) {
      setNewRequest({
        category: '',
        location: '',
        description: '',
        priority: 'medium',
        floor: '',
        zone: ''
      });
    }
  };

  const handleBulkAssign = async () => {
    if (selectedTasks.length === 0 || !assigneeId) return;

    const success = await bulkAssignTasks(selectedTasks, assigneeId, assignmentNotes);
    if (success) {
      setSelectedTasks([]);
      setAssigneeId('');
      setAssignmentNotes('');
    }
  };

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const myAssignments = getMyAssignments();
  const pendingApprovals = getPendingApprovals();
  const pendingTasks = getTasksByStatus('pending');
  const inProgressTasks = getTasksByStatus('in_progress');
  const completedTasks = getTasksByStatus('completed');

  // Mock staff list - in real app, this would come from profiles
  const staffMembers = [
    { id: 'staff1', name: 'John Doe', role: 'ops_l1' },
    { id: 'staff2', name: 'Jane Smith', role: 'ops_l1' },
    { id: 'staff3', name: 'Mike Johnson', role: 'hk_security' }
  ];

  const isOpsL2 = profile?.role === 'ops_l2' || profile?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Task Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{pendingTasks.length}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{inProgressTasks.length}</div>
            <div className="text-sm text-gray-400">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{completedTasks.length}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{myAssignments.length}</div>
            <div className="text-sm text-gray-400">My Tasks</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 bg-card/50">
          <TabsTrigger value="create">Create Task</TabsTrigger>
          <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
          {isOpsL2 && <TabsTrigger value="assign">Assign Tasks</TabsTrigger>}
          {isOpsL2 && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
        </TabsList>

        {/* Create Task Tab */}
        <TabsContent value="create">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Create Simplified Task Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Task Category *</Label>
                  <Select value={newRequest.category} onValueChange={(value) => setNewRequest({...newRequest, category: value})}>
                    <SelectTrigger className="bg-background/20">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                          {category.estimated_time_minutes && (
                            <span className="text-xs text-gray-400 ml-2">
                              (~{category.estimated_time_minutes} min)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Priority</Label>
                  <Select value={newRequest.priority} onValueChange={(value: any) => setNewRequest({...newRequest, priority: value})}>
                    <SelectTrigger className="bg-background/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Location *</Label>
                  <Select value={newRequest.location} onValueChange={(value) => setNewRequest({...newRequest, location: value})}>
                    <SelectTrigger className="bg-background/20">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Lobby">Main Lobby</SelectItem>
                      <SelectItem value="Floor 1 East Wing">Floor 1 East Wing</SelectItem>
                      <SelectItem value="Floor 1 West Wing">Floor 1 West Wing</SelectItem>
                      <SelectItem value="Basement Utilities">Basement Utilities</SelectItem>
                      <SelectItem value="Cafeteria">Cafeteria</SelectItem>
                      <SelectItem value="Conference Room A">Conference Room A</SelectItem>
                      <SelectItem value="Conference Room B">Conference Room B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Floor</Label>
                  <Select value={newRequest.floor} onValueChange={(value) => setNewRequest({...newRequest, floor: value})}>
                    <SelectTrigger className="bg-background/20">
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basement">Basement</SelectItem>
                      <SelectItem value="ground">Ground</SelectItem>
                      <SelectItem value="1">Floor 1</SelectItem>
                      <SelectItem value="2">Floor 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Description *</Label>
                <Textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  placeholder="Describe the issue or task details..."
                  className="bg-background/20"
                />
              </div>
              <Button
                onClick={handleCreateRequest}
                disabled={isLoading}
                className="w-full bg-plaza-blue hover:bg-blue-700"
              >
                Create Task Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Tasks Tab */}
        <TabsContent value="my-tasks">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                My Assigned Tasks ({myAssignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myAssignments.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No tasks assigned</p>
                ) : (
                  myAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 bg-background/20 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">
                            {assignment.request?.title}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {assignment.request?.location} • {assignment.request?.priority}
                          </p>
                          <p className="text-sm text-gray-300 mt-1">
                            {assignment.request?.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned: {format(new Date(assignment.created_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                          {assignment.assignment_notes && (
                            <p className="text-xs text-blue-400 mt-1">
                              Notes: {assignment.assignment_notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            className={
                              assignment.actual_completion ? (
                                assignment.supervisor_approval ? 'bg-green-600' : 'bg-blue-600'
                              ) : 'bg-yellow-600'
                            }
                          >
                            {assignment.actual_completion ? (
                              assignment.supervisor_approval ? 'Approved' : 'Completed'
                            ) : 'In Progress'}
                          </Badge>
                          {!assignment.actual_completion && (
                            <Button
                              onClick={() => completeTask(assignment.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assign Tasks Tab (Supervisors only) */}
        {isOpsL2 && (
          <TabsContent value="assign">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Assign Tasks
                  </CardTitle>
                  {selectedTasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select value={assigneeId} onValueChange={setAssigneeId}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.name} ({staff.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleBulkAssign}
                        disabled={!assigneeId}
                        size="sm"
                        className="bg-plaza-blue hover:bg-blue-700"
                      >
                        Assign ({selectedTasks.length})
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTasks.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No pending tasks to assign</p>
                  ) : (
                    pendingTasks.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 bg-background/20 rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedTasks.includes(assignment.request_id)}
                            onCheckedChange={(checked) => 
                              handleTaskToggle(assignment.request_id, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-white">
                              {assignment.request?.title}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {assignment.request?.location} • {assignment.request?.priority}
                            </p>
                            <p className="text-sm text-gray-300 mt-1">
                              {assignment.request?.description}
                            </p>
                          </div>
                          <Badge 
                            className={
                              assignment.request?.priority === 'urgent' ? 'bg-red-600' :
                              assignment.request?.priority === 'high' ? 'bg-orange-600' :
                              assignment.request?.priority === 'medium' ? 'bg-yellow-600' :
                              'bg-gray-600'
                            }
                          >
                            {assignment.request?.priority}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Approvals Tab (Supervisors only) */}
        {isOpsL2 && (
          <TabsContent value="approvals">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Pending Approvals ({pendingApprovals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingApprovals.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No tasks awaiting approval</p>
                  ) : (
                    pendingApprovals.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 bg-background/20 rounded-lg border border-blue-500/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-white">
                              {assignment.request?.title}
                            </h4>
                            <p className="text-sm text-gray-400">
                              Completed by: {assignment.assignee?.first_name} {assignment.assignee?.last_name}
                            </p>
                            <p className="text-sm text-blue-400">
                              Completed: {assignment.actual_completion && format(new Date(assignment.actual_completion), 'dd/MM/yyyy HH:mm')}
                            </p>
                            {assignment.approval_notes && (
                              <p className="text-sm text-gray-300 mt-1">
                                Notes: {assignment.approval_notes}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => approveTask(assignment.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};