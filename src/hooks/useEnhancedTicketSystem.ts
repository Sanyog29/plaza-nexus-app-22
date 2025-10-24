import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { toDBStatus, mapStatusArrayToDB, type UIStatus, type DBRequestStatus } from '@/utils/status';

interface TicketMetrics {
  totalActive: number;
  totalCompleted: number;
  urgentCount: number;
  slaBreaches: number;
  avgCompletionTime: number;
  resolutionRate: number;
}

interface TicketFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  assignedTo?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

interface AutoAssignmentRule {
  id: string;
  categoryId: string;
  priority: string;
  assignToRole: string;
  conditions: any;
  isActive: boolean;
}

export const useEnhancedTicketSystem = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<TicketMetrics>({
    totalActive: 0,
    totalCompleted: 0,
    urgentCount: 0,
    slaBreaches: 0,
    avgCompletionTime: 0,
    resolutionRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [autoAssignmentRules, setAutoAssignmentRules] = useState<AutoAssignmentRule[]>([]);

  // Status mapping is now handled by centralized utility

  useEffect(() => {
    fetchTickets();
    fetchMetrics();
    fetchAutoAssignmentRules();
    setupRealTimeSubscription();
  }, []);

  const fetchTickets = async (filters?: TicketFilters) => {
    setLoading(true);
    try {
      let query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          category:maintenance_categories(name, icon, color),
          assigned_user:profiles!assigned_to(first_name, last_name),
          reporter:profiles!reported_by(first_name, last_name),
          attachments:request_attachments(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status?.length) {
        const dbStatuses = mapStatusArrayToDB(filters.status);
        query = query.in('status', dbStatuses);
      }
      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority as any);
      }
      if (filters?.category?.length) {
        query = query.in('category_id', filters.category);
      }
      if (filters?.assignedTo?.length) {
        query = query.in('assigned_to', filters.assignedTo);
      }
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }
      if (filters?.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Fetch current metrics
      const { data: activeTickets, error: activeError } = await supabase
        .from('maintenance_requests')
        .select('id, priority, sla_breach_at, completed_at, created_at')
        .neq('status', 'completed');

      if (activeError) throw activeError;

      const { data: completedTickets, error: completedError } = await supabase
        .from('maintenance_requests')
        .select('id, completed_at, created_at, sla_breach_at')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (completedError) throw completedError;

      const totalActive = activeTickets?.length || 0;
      const totalCompleted = completedTickets?.length || 0;
      const urgentCount = activeTickets?.filter(t => t.priority === 'urgent').length || 0;
      
      const slaBreaches = activeTickets?.filter(t => 
        t.sla_breach_at && new Date(t.sla_breach_at) < new Date()
      ).length || 0;

      const avgCompletionTime = completedTickets?.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const completed = new Date(ticket.completed_at);
        return sum + (completed.getTime() - created.getTime());
      }, 0) / (completedTickets?.length || 1) / (1000 * 60 * 60); // Convert to hours

      const resolutionRate = totalCompleted / (totalActive + totalCompleted) * 100;

      setMetrics({
        totalActive,
        totalCompleted,
        urgentCount,
        slaBreaches,
        avgCompletionTime,
        resolutionRate
      });

    } catch (error: any) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchAutoAssignmentRules = async () => {
    try {
      // This would fetch from a future auto_assignment_rules table
      // For now, return mock data
      setAutoAssignmentRules([]);
    } catch (error: any) {
      console.error('Error fetching auto assignment rules:', error);
    }
  };

  const createTicket = async (ticketData: any) => {
    try {
      // Auto-assignment logic
      const assignedTo = await getAutoAssignment(ticketData);
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          ...ticketData,
          assigned_to: assignedTo,
          reported_by: user?.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to assigned user
      if (assignedTo) {
        await createNotification(assignedTo, {
          title: 'New Ticket Assigned',
          message: `You have been assigned ticket: ${ticketData.title}`,
          type: 'assignment',
          action_url: `/requests/${data.id}`
        });
      }

      toast({
        title: "Ticket Created",
        description: `Ticket #${data.id.slice(0, 8)} created successfully`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateTicket = async (ticketId: string, updates: any) => {
    try {
        // Map status updates to DB status before sending to Supabase
        const { status, ...otherUpdates } = updates;
        const dbUpdates = {
          ...otherUpdates,
          ...(status ? { status: toDBStatus(status) } : {})
        };

        const { data, error } = await supabase
          .from('maintenance_requests')
          .update(dbUpdates)
          .eq('id', ticketId)
          .select()
          .single();

      if (error) throw error;

        // Update local state with original updates (UI status)
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, ...updates } : ticket
        ));

      toast({
        title: "Ticket Updated",
        description: "Ticket has been updated successfully",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket",
        variant: "destructive"
      });
      throw error;
    }
  };

  const bulkUpdateTickets = async (ticketIds: string[], updates: any) => {
    try {
        // Map status updates to DB status before sending to Supabase
        const { status, ...otherUpdates } = updates;
        const dbUpdates = {
          ...otherUpdates,
          ...(status ? { status: toDBStatus(status) } : {})
        };

        const { data, error } = await supabase
          .from('maintenance_requests')
          .update(dbUpdates)
          .in('id', ticketIds)
          .select();

      if (error) throw error;

        // Update local state with original updates (UI status)
        setTickets(prev => prev.map(ticket => 
          ticketIds.includes(ticket.id) ? { ...ticket, ...updates } : ticket
        ));

      toast({
        title: "Tickets Updated",
        description: `${ticketIds.length} tickets updated successfully`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tickets",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getAutoAssignment = async (ticketData: any): Promise<string | null> => {
    try {
      // Use the existing function for optimal staff assignment
      const { data, error } = await supabase.rpc('suggest_optimal_staff_assignment', {
        task_category: ticketData.category_id,
        required_skills: [],
        priority: ticketData.priority
      });

      if (error) throw error;

      // Return the best match staff ID
      return data?.[0]?.staff_id || null;
    } catch (error) {
      console.error('Auto-assignment error:', error);
      return null;
    }
  };

  const createNotification = async (userId: string, notification: any) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          ...notification
        });

      if (error) throw error;
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  const escalateTicket = async (ticketId: string, reason: string) => {
    try {
      // Find supervisor or admin for escalation  
      const supervisorQuery = supabase
        .from('profiles')
        .select('id')
        .in('role', ['ops_supervisor', 'admin'] as string[])
        .limit(1);
      const { data: supervisors, error: supervisorError } = await supervisorQuery;

      if (supervisorError) throw supervisorError;

      const escalatedTo = supervisors?.[0]?.id;
      
      const { error } = await supabase
        .from('escalation_logs')
        .insert({
          request_id: ticketId,
          escalation_type: 'manual',
          escalated_from: user?.id,
          escalated_to: escalatedTo,
          escalation_reason: reason
        });

      if (error) throw error;

      // Update ticket assignment (keep status as is, just change assignee)
      await updateTicket(ticketId, { 
        assigned_to: escalatedTo
      });

      toast({
        title: "Ticket Escalated",
        description: "Ticket has been escalated to supervisor",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to escalate ticket",
        variant: "destructive"
      });
    }
  };

  const setupRealTimeSubscription = () => {
    const subscription = supabase
      .channel('maintenance_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests'
        },
        () => {
          fetchTickets();
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const generateReport = async (filters: TicketFilters) => {
    try {
      // Fetch tickets with filters for report
      const reportTickets = tickets.filter(ticket => {
        // Apply filters logic
        return true; // Simplified for now
      });

      const reportData = {
        period: filters.dateRange,
        totalTickets: reportTickets.length,
        completedTickets: reportTickets.filter(t => t.status === 'completed').length,
        avgResolutionTime: metrics.avgCompletionTime,
        slaCompliance: (1 - metrics.slaBreaches / metrics.totalActive) * 100,
        ticketsByPriority: {
          urgent: reportTickets.filter(t => t.priority === 'urgent').length,
          high: reportTickets.filter(t => t.priority === 'high').length,
          medium: reportTickets.filter(t => t.priority === 'medium').length,
          low: reportTickets.filter(t => t.priority === 'low').length,
        },
        ticketsByCategory: reportTickets.reduce((acc, ticket) => {
          const category = ticket.category?.name || 'Unknown';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return reportData;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    tickets,
    metrics,
    loading,
    autoAssignmentRules,
    fetchTickets,
    createTicket,
    updateTicket,
    bulkUpdateTickets,
    escalateTicket,
    generateReport
  };
};