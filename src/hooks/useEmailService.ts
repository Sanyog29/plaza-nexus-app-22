import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  type: 'booking_confirmation' | 'visitor_approval' | 'maintenance_sla' | 'general';
}

export const useEmailService = () => {
  const sendEmail = async (options: EmailOptions) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: options
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Email service error:', error);
      toast({
        title: "Email Error",
        description: "Failed to send email notification",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  const sendBookingConfirmation = async (userEmail: string, bookingDetails: any) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Confirmation</h2>
        <p>Dear Customer,</p>
        <p>Your service booking has been confirmed!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details:</h3>
          <p><strong>Service:</strong> ${bookingDetails.service_name}</p>
          <p><strong>Date:</strong> ${new Date(bookingDetails.booking_date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${bookingDetails.booking_time}</p>
          <p><strong>Status:</strong> ${bookingDetails.status}</p>
          ${bookingDetails.notes ? `<p><strong>Notes:</strong> ${bookingDetails.notes}</p>` : ''}
        </div>
        
        <p>If you need to make any changes, please contact our support team.</p>
        <p>Best regards,<br>AUTOPILOT Team</p>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Booking Confirmed - ${bookingDetails.service_name}`,
      html,
      type: 'booking_confirmation'
    });
  };

  const sendVisitorApproval = async (userEmail: string, visitorDetails: any, qrCode?: string) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Visitor Approved</h2>
        <p>Dear Resident,</p>
        <p>Your visitor request has been approved!</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3>Visitor Details:</h3>
          <p><strong>Name:</strong> ${visitorDetails.name}</p>
          <p><strong>Company:</strong> ${visitorDetails.company || 'N/A'}</p>
          <p><strong>Purpose:</strong> ${visitorDetails.visit_purpose}</p>
          <p><strong>Date:</strong> ${new Date(visitorDetails.visit_date).toLocaleDateString()}</p>
          <p><strong>Contact:</strong> ${visitorDetails.contact_number || 'N/A'}</p>
        </div>
        
        ${qrCode ? `
          <div style="text-align: center; margin: 20px 0;">
            <p><strong>QR Code for Entry:</strong></p>
            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
              <img src="${qrCode}" alt="Visitor QR Code" style="width: 200px; height: 200px;" />
            </div>
          </div>
        ` : ''}
        
        <p>Please share this QR code with your visitor for easy entry.</p>
        <p>Best regards,<br>AUTOPILOT Security Team</p>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Visitor Approved - ${visitorDetails.name}`,
      html,
      type: 'visitor_approval'
    });
  };

  const sendMaintenanceSLAAlert = async (adminEmail: string, requestDetails: any) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">SLA Breach Alert</h2>
        <p>Dear Maintenance Team,</p>
        <p><strong>URGENT:</strong> A maintenance request is approaching or has breached its SLA!</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3>Request Details:</h3>
          <p><strong>Title:</strong> ${requestDetails.title}</p>
          <p><strong>Priority:</strong> ${requestDetails.priority.toUpperCase()}</p>
          <p><strong>Location:</strong> ${requestDetails.location}</p>
          <p><strong>Created:</strong> ${new Date(requestDetails.created_at).toLocaleString()}</p>
          <p><strong>SLA Deadline:</strong> ${new Date(requestDetails.sla_breach_at).toLocaleString()}</p>
          <p><strong>Status:</strong> ${requestDetails.status}</p>
        </div>
        
        <p><strong>Description:</strong></p>
        <p>${requestDetails.description}</p>
        
        <p>Please take immediate action to resolve this request.</p>
        <p>Best regards,<br>AUTOPILOT System</p>
      </div>
    `;

    return sendEmail({
      to: adminEmail,
      subject: `🚨 SLA BREACH ALERT - ${requestDetails.title}`,
      html,
      type: 'maintenance_sla'
    });
  };

  const sendVisitorNotification = async (host: any, visitor: any, status: string) => {
    const statusMessages = {
      checked_in: {
        subject: `Visitor Checked In - ${visitor.name}`,
        title: 'Visitor Checked In',
        color: '#16a34a',
        message: 'Your visitor has successfully checked in at the security desk.'
      },
      checked_out: {
        subject: `Visitor Checked Out - ${visitor.name}`,
        title: 'Visitor Checked Out',
        color: '#2563eb',
        message: 'Your visitor has checked out and left the building.'
      },
      approved: {
        subject: `Visitor Approved - ${visitor.name}`,
        title: 'Visitor Approved',
        color: '#16a34a',
        message: 'Your visitor request has been approved by security.'
      }
    };

    const statusInfo = statusMessages[status as keyof typeof statusMessages];
    if (!statusInfo) return;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusInfo.color};">${statusInfo.title}</h2>
        <p>Dear ${host.first_name || 'Resident'},</p>
        <p>${statusInfo.message}</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color};">
          <h3>Visitor Details:</h3>
          <p><strong>Name:</strong> ${visitor.name}</p>
          <p><strong>Company:</strong> ${visitor.company || 'N/A'}</p>
          <p><strong>Purpose:</strong> ${visitor.visit_purpose}</p>
          <p><strong>Visit Date:</strong> ${new Date(visitor.visit_date).toLocaleDateString()}</p>
          ${visitor.check_in_time ? `<p><strong>Check-in Time:</strong> ${new Date(visitor.check_in_time).toLocaleTimeString()}</p>` : ''}
          ${visitor.check_out_time ? `<p><strong>Check-out Time:</strong> ${new Date(visitor.check_out_time).toLocaleTimeString()}</p>` : ''}
          ${visitor.visitor_badge_number ? `<p><strong>Badge Number:</strong> ${visitor.visitor_badge_number}</p>` : ''}
        </div>
        
        <p>For security inquiries, please contact the front desk.</p>
        <p>Best regards,<br>AUTOPILOT Security Team</p>
      </div>
    `;

    // Get host email from auth.users table via function call
    const { data: userData } = await supabase.auth.admin.getUserById(host.id);
    const hostEmail = userData.user?.email;

    if (hostEmail) {
      return sendEmail({
        to: hostEmail,
        subject: statusInfo.subject,
        html,
        type: 'visitor_approval'
      });
    }
  };

  const sendOverdueAlert = async (host: any, visitor: any, overdueMinutes: number) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Visitor Overdue Alert</h2>
        <p>Dear ${host.first_name || 'Resident'},</p>
        <p>Your visitor was expected but hasn't checked in yet.</p>
        
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3>Visitor Details:</h3>
          <p><strong>Name:</strong> ${visitor.name}</p>
          <p><strong>Company:</strong> ${visitor.company || 'N/A'}</p>
          <p><strong>Expected Time:</strong> ${visitor.entry_time}</p>
          <p><strong>Overdue By:</strong> ${overdueMinutes} minutes</p>
          <p><strong>Visit Purpose:</strong> ${visitor.visit_purpose}</p>
        </div>
        
        <p>Please check with your visitor or contact security if needed.</p>
        <p>Best regards,<br>AUTOPILOT Security Team</p>
      </div>
    `;

    // Get host email from auth.users table via function call
    const { data: userData } = await supabase.auth.admin.getUserById(host.id);
    const hostEmail = userData.user?.email;

    if (hostEmail) {
      return sendEmail({
        to: hostEmail,
        subject: `Visitor Overdue - ${visitor.name}`,
        html,
        type: 'general'
      });
    }
  };

  const sendDailySecurityReport = async (adminEmail: string, reportData: any) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Daily Security Report</h2>
        <p>Security Summary for ${new Date().toLocaleDateString()}</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Visitor Statistics:</h3>
          <p><strong>Total Expected:</strong> ${reportData.totalExpected}</p>
          <p><strong>Checked In:</strong> ${reportData.checkedIn}</p>
          <p><strong>Checked Out:</strong> ${reportData.checkedOut}</p>
          <p><strong>Still In Building:</strong> ${reportData.stillInBuilding}</p>
          <p><strong>No-Shows:</strong> ${reportData.noShows}</p>
          <p><strong>Overdue Visitors:</strong> ${reportData.overdueCount}</p>
        </div>

        ${reportData.activeShifts?.length > 0 ? `
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Active Security Shifts:</h3>
            ${reportData.activeShifts.map((shift: any) => `
              <p><strong>${shift.guard_name}:</strong> Started at ${new Date(shift.shift_start).toLocaleTimeString()}</p>
            `).join('')}
          </div>
        ` : ''}
        
        <p>Best regards,<br>AUTOPILOT Security System</p>
      </div>
    `;

    return sendEmail({
      to: adminEmail,
      subject: `Daily Security Report - ${new Date().toLocaleDateString()}`,
      html,
      type: 'general'
    });
  };

  return {
    sendEmail,
    sendBookingConfirmation,
    sendVisitorApproval,
    sendMaintenanceSLAAlert,
    sendVisitorNotification,
    sendOverdueAlert,
    sendDailySecurityReport
  };
};