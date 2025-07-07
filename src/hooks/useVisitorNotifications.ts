import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useEmailService } from './useEmailService';
import { toast } from '@/hooks/use-toast';

export const useVisitorNotifications = () => {
  const { user } = useAuth();
  const { sendVisitorNotification, sendOverdueAlert } = useEmailService();

  useEffect(() => {
    if (!user) return;

    // Subscribe to visitor status changes
    const visitorChannel = supabase
      .channel('visitor-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'visitors',
        },
        async (payload) => {
          const { old: oldVisitor, new: newVisitor } = payload;
          
          // Check if visitor status changed
          if (oldVisitor.status !== newVisitor.status) {
            await handleVisitorStatusChange(oldVisitor, newVisitor);
          }
        }
      )
      .subscribe();

    // Subscribe to new visitor check logs
    const checkLogChannel = supabase
      .channel('visitor-check-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitor_check_logs',
        },
        async (payload) => {
          await handleVisitorCheckLog(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(visitorChannel);
      supabase.removeChannel(checkLogChannel);
    };
  }, [user]);

  const handleVisitorStatusChange = async (oldVisitor: any, newVisitor: any) => {
    try {
      // Get host details
      const { data: host } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', newVisitor.host_id)
        .maybeSingle();

      if (!host) return;

      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info';

      switch (newVisitor.status) {
        case 'checked_in':
          notificationTitle = 'Visitor Checked In';
          notificationMessage = `${newVisitor.name} has checked in at the security desk.`;
          notificationType = 'success';
          break;
        case 'checked_out':
          notificationTitle = 'Visitor Checked Out';
          notificationMessage = `${newVisitor.name} has checked out and left the building.`;
          notificationType = 'info';
          break;
        case 'approved':
          notificationTitle = 'Visitor Approved';
          notificationMessage = `Your visitor ${newVisitor.name} has been approved for ${new Date(newVisitor.visit_date).toLocaleDateString()}.`;
          notificationType = 'success';
          break;
      }

      if (notificationTitle) {
        // Create in-app notification
        await supabase.rpc('create_notification', {
          target_user_id: newVisitor.host_id,
          notification_title: notificationTitle,
          notification_message: notificationMessage,
          notification_type: notificationType,
          action_url: `/security`
        });

        // Send email notification if it's a status change the host should know about
        if (['checked_in', 'checked_out', 'approved'].includes(newVisitor.status)) {
          await sendVisitorNotification(host, newVisitor, newVisitor.status);
        }
      }
    } catch (error) {
      console.error('Error handling visitor status change:', error);
    }
  };

  const handleVisitorCheckLog = async (checkLog: any) => {
    try {
      // Get visitor and host details
      const { data: visitorWithHost } = await supabase
        .from('visitors')
        .select(`
          *,
          profiles!visitors_host_id_fkey (*)
        `)
        .eq('id', checkLog.visitor_id)
        .maybeSingle();

      if (!visitorWithHost) return;

      const actionMessages = {
        check_in: 'has been checked in by security',
        check_out: 'has been checked out by security',
        badge_assigned: 'has been assigned visitor badge',
        access_granted: 'has been granted building access'
      };

      const message = actionMessages[checkLog.action_type as keyof typeof actionMessages];
      if (message) {
        // Create in-app notification
        await supabase.rpc('create_notification', {
          target_user_id: visitorWithHost.host_id,
          notification_title: 'Visitor Update',
          notification_message: `${visitorWithHost.name} ${message}${checkLog.location ? ` at ${checkLog.location}` : ''}.`,
          notification_type: 'info',
          action_url: `/security`
        });
      }
    } catch (error) {
      console.error('Error handling visitor check log:', error);
    }
  };

  const checkOverdueVisitors = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Find visitors who are expected but haven't checked in and are past their expected time
      const { data: overdueVisitors } = await supabase
        .from('visitors')
        .select(`
          *,
          profiles!visitors_host_id_fkey (*)
        `)
        .eq('visit_date', today)
        .eq('status', 'scheduled')
        .eq('approval_status', 'approved');

      if (!overdueVisitors) return;

      for (const visitor of overdueVisitors) {
        const expectedTime = new Date(`${visitor.visit_date}T${visitor.entry_time}`);
        const overdueDuration = now.getTime() - expectedTime.getTime();
        const overdueMinutes = Math.floor(overdueDuration / (1000 * 60));

        // Only alert if visitor is more than 15 minutes overdue
        if (overdueMinutes > 15) {
          // Create notification for host
          await supabase.rpc('create_notification', {
            target_user_id: visitor.host_id,
            notification_title: 'Visitor Overdue',
            notification_message: `${visitor.name} was expected at ${visitor.entry_time} but hasn't checked in yet (${overdueMinutes} minutes overdue).`,
            notification_type: 'warning',
            action_url: `/security`
          });

          // Send overdue alert email
          await sendOverdueAlert(visitor.profiles, visitor, overdueMinutes);
        }
      }
    } catch (error) {
      console.error('Error checking overdue visitors:', error);
    }
  };

  return {
    checkOverdueVisitors
  };
};