import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmailService } from './useEmailService';

export const useAutomatedAlerts = () => {
  const { sendOverdueAlert, sendDailySecurityReport } = useEmailService();

  useEffect(() => {
    // Check for overdue visitors every 15 minutes
    const overdueCheckInterval = setInterval(checkOverdueVisitors, 15 * 60 * 1000);

    // Send daily reports at 6 PM (18:00)
    const dailyReportInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 18 && now.getMinutes() === 0) {
        generateDailyReport();
      }
    }, 60 * 1000); // Check every minute

    return () => {
      clearInterval(overdueCheckInterval);
      clearInterval(dailyReportInterval);
    };
  }, []);

  const checkOverdueVisitors = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Find visitors who are overdue
      const { data: visitors } = await supabase
        .from('visitors')
        .select(`
          *,
          profiles!inner (*)
        `)
        .eq('visit_date', today)
        .eq('status', 'scheduled')
        .eq('approval_status', 'approved');

      if (!visitors) return;

      for (const visitor of visitors) {
        if (!visitor.entry_time) continue;

        const expectedTime = new Date(`${visitor.visit_date}T${visitor.entry_time}`);
        const overdueDuration = now.getTime() - expectedTime.getTime();
        const overdueMinutes = Math.floor(overdueDuration / (1000 * 60));

        // Alert if visitor is more than 15 minutes overdue
        if (overdueMinutes > 15) {
          // Check if we've already sent an alert for this visitor today
          const { data: existingAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', visitor.host_id)
            .eq('title', 'Visitor Overdue')
            .gte('created_at', today)
            .contains('message', visitor.name)
            .limit(1);

          if (!existingAlert || existingAlert.length === 0) {
            // Create notification
            await supabase.rpc('create_notification', {
              target_user_id: visitor.host_id,
              notification_title: 'Visitor Overdue',
              notification_message: `${visitor.name} was expected at ${visitor.entry_time} but hasn't checked in yet (${overdueMinutes} minutes overdue).`,
              notification_type: 'warning',
              action_url: `/security`
            });

            // Send email alert
            await sendOverdueAlert(visitor.profiles, visitor, overdueMinutes);
          }
        }
      }
    } catch (error) {
      console.error('Error checking overdue visitors:', error);
    }
  };

  const generateDailyReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get visitor statistics
      const { data: allVisitors } = await supabase
        .from('visitors')
        .select('*')
        .eq('visit_date', today);

      const { data: activeShifts } = await supabase
        .from('security_shifts')
        .select(`
          *,
          profiles!security_shifts_guard_id_fkey (first_name, last_name)
        `)
        .is('shift_end', null);

      if (!allVisitors) return;

      const totalExpected = allVisitors.filter(v => v.approval_status === 'approved').length;
      const checkedIn = allVisitors.filter(v => v.status === 'checked_in').length;
      const checkedOut = allVisitors.filter(v => v.status === 'checked_out').length;
      const stillInBuilding = checkedIn - checkedOut;
      const noShows = allVisitors.filter(v => {
        if (v.status !== 'scheduled' || !v.entry_time) return false;
        const expectedTime = new Date(`${v.visit_date}T${v.entry_time}`);
        const now = new Date();
        return now.getTime() - expectedTime.getTime() > 2 * 60 * 60 * 1000; // 2 hours past expected time
      }).length;

      const now = new Date();
      const overdueCount = allVisitors.filter(v => {
        if (v.status !== 'scheduled' || !v.entry_time) return false;
        const expectedTime = new Date(`${v.visit_date}T${v.entry_time}`);
        return now.getTime() - expectedTime.getTime() > 15 * 60 * 1000; // 15 minutes overdue
      }).length;

      const reportData = {
        totalExpected,
        checkedIn,
        checkedOut,
        stillInBuilding,
        noShows,
        overdueCount,
        activeShifts: activeShifts?.map(shift => ({
          guard_name: `${shift.profiles?.first_name || ''} ${shift.profiles?.last_name || ''}`.trim(),
          shift_start: shift.shift_start
        })) || []
      };

      // Get admin emails
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, assigned_role_title')
        .filter('assigned_role_title', 'ilike', '%admin%');

      if (admins) {
        for (const admin of admins) {
          // Get admin email from auth
          const { data: userData } = await supabase.auth.admin.getUserById(admin.id);
          const adminEmail = userData.user?.email;
          
          if (adminEmail) {
            await sendDailySecurityReport(adminEmail, reportData);
          }
        }
      }
    } catch (error) {
      console.error('Error generating daily report:', error);
    }
  };

  return {
    checkOverdueVisitors,
    generateDailyReport
  };
};