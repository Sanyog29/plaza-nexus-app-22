import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface SimpleTaskCategory {
  id: string;
  name: string;
  description?: string;
  estimated_time_minutes?: number;
  required_skills?: string[];
  is_active: boolean;
}

interface TaskAssignment {
  id: string;
  request_id: string;
  assigned_by: string;
  assigned_to: string;
  assignment_notes?: string;
  estimated_completion?: string;
  actual_completion?: string;
  supervisor_approval: boolean;
  approval_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  // Relations
  request?: any;
  assignee?: any;
  assigner?: any;
}

interface SimplifiedMaintenanceRequest {
  category: string;
  location: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  floor?: string;
  zone?: string;
}

export function useSimplifiedTasks() {
  const { user } = useAuth();
  const [taskCategories, setTaskCategories] = useState<SimpleTaskCategory[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTaskCategories();
      fetchTaskAssignments();
    }
  }, [user]);

  const fetchTaskCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('simple_task_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTaskCategories(data || []);
    } catch (error) {
      console.error('Error fetching task categories:', error);
      toast.error('Failed to load task categories');
    }
  };

  const fetchTaskAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          *,
          request:maintenance_requests(*),
          assignee:profiles!task_assignments_assigned_to_fkey(first_name, last_name),
          assigner:profiles!task_assignments_assigned_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTaskAssignments(data || []);
    } catch (error) {
      console.error('Error fetching task assignments:', error);
      toast.error('Failed to load task assignments');
    }
  };

  const createSimplifiedRequest = async (requestData: SimplifiedMaintenanceRequest) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      // Find the category by name
      const category = taskCategories.find(c => c.name === requestData.category);
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          title: `${requestData.category} - ${requestData.location}`,
          description: requestData.description,
          location: requestData.location,
          priority: requestData.priority,
          category_id: category?.id,
          reported_by: user.id,
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      toast.success('Request created successfully');
      return data;
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const assignTask = async (requestId: string, assignedTo: string, notes?: string, estimatedCompletion?: string) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .insert({
          request_id: requestId,
          assigned_by: user.id,
          assigned_to: assignedTo,
          assignment_notes: notes,
          estimated_completion: estimatedCompletion
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Update the maintenance request status
      await supabase
        .from('maintenance_requests')
        .update({ 
          status: 'in_progress',
          assigned_to: assignedTo 
        })
        .eq('id', requestId);

      // Create notification for assigned user
      await supabase.rpc('create_notification', {
        target_user_id: assignedTo,
        notification_title: 'New Task Assigned',
        notification_message: `You have been assigned a new maintenance task.`,
        notification_type: 'task_assignment',
        action_url: `/staff/requests/${requestId}`
      });

      await fetchTaskAssignments();
      toast.success('Task assigned successfully');
      return data;
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = async (assignmentId: string, completionNotes?: string) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const assignment = taskAssignments.find(a => a.id === assignmentId);
      if (!assignment) throw new Error('Assignment not found');

      const { error } = await supabase
        .from('task_assignments')
        .update({
          actual_completion: new Date().toISOString(),
          approval_notes: completionNotes
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Update the maintenance request status
      await supabase
        .from('maintenance_requests')
        .update({ status: 'completed' })
        .eq('id', assignment.request_id);

      // Notify supervisor
      await supabase.rpc('create_notification', {
        target_user_id: assignment.assigned_by,
        notification_title: 'Task Completed',
        notification_message: `A task has been completed and awaits your approval.`,
        notification_type: 'task_completed',
        action_url: `/staff/requests/${assignment.request_id}`
      });

      await fetchTaskAssignments();
      toast.success('Task marked as completed');
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const approveTask = async (assignmentId: string, approvalNotes?: string) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({
          supervisor_approval: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          approval_notes: approvalNotes
        })
        .eq('id', assignmentId);

      if (error) throw error;

      await fetchTaskAssignments();
      toast.success('Task approved successfully');
      return true;
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error('Failed to approve task');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkAssignTasks = async (requestIds: string[], assignedTo: string, notes?: string) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const assignments = requestIds.map(requestId => ({
        request_id: requestId,
        assigned_by: user.id,
        assigned_to: assignedTo,
        assignment_notes: notes
      }));

      const { error } = await supabase
        .from('task_assignments')
        .insert(assignments);

      if (error) throw error;

      // Update all maintenance requests
      await supabase
        .from('maintenance_requests')
        .update({ 
          status: 'in_progress',
          assigned_to: assignedTo 
        })
        .in('id', requestIds);

      // Create notification
      await supabase.rpc('create_notification', {
        target_user_id: assignedTo,
        notification_title: 'Multiple Tasks Assigned',
        notification_message: `You have been assigned ${requestIds.length} new tasks.`,
        notification_type: 'bulk_assignment'
      });

      await fetchTaskAssignments();
      toast.success(`${requestIds.length} tasks assigned successfully`);
      return true;
    } catch (error) {
      console.error('Error bulk assigning tasks:', error);
      toast.error('Failed to assign tasks');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getMyAssignments = () => {
    return taskAssignments.filter(assignment => assignment.assigned_to === user?.id);
  };

  const getPendingApprovals = () => {
    return taskAssignments.filter(assignment => 
      assignment.assigned_by === user?.id && 
      assignment.actual_completion && 
      !assignment.supervisor_approval
    );
  };

  const getTasksByStatus = (status: 'pending' | 'in_progress' | 'completed' | 'approved') => {
    switch (status) {
      case 'pending':
        return taskAssignments.filter(a => !a.actual_completion);
      case 'in_progress':
        return taskAssignments.filter(a => !a.actual_completion);
      case 'completed':
        return taskAssignments.filter(a => a.actual_completion && !a.supervisor_approval);
      case 'approved':
        return taskAssignments.filter(a => a.supervisor_approval);
      default:
        return [];
    }
  };

  return {
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
    getTasksByStatus,
    refetch: () => Promise.all([fetchTaskCategories(), fetchTaskAssignments()])
  };
}