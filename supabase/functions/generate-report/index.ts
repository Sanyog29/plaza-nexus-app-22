import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  reportType: string;
  exportFormats: string[];
  emailRecipients: string[];
  dateRange: {
    from: string;
    to: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reportType, exportFormats, emailRecipients, dateRange }: ReportRequest = await req.json();

    console.log('Generating report:', { reportType, exportFormats, user: user.email });

    // Calculate metrics for the report
    const { data: analyticsData, error: analyticsError } = await supabaseClient.rpc(
      'calculate_advanced_metrics',
      {
        p_start_date: dateRange.from.split('T')[0],
        p_end_date: dateRange.to.split('T')[0]
      }
    );

    if (analyticsError) {
      console.error('Analytics error:', analyticsError);
      throw analyticsError;
    }

    // Fetch detailed ticket data
    const { data: tickets, error: ticketsError } = await supabaseClient
      .from('maintenance_requests')
      .select('*, assignee:profiles!maintenance_requests_assigned_to_fkey(first_name, last_name)')
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to)
      .order('created_at', { ascending: false });

    if (ticketsError) throw ticketsError;

    // Generate report content based on type
    const reportContent = generateReportContent(reportType, analyticsData, tickets);

    // For now, create a simple CSV report (PDF/Excel would require additional libraries)
    let fileContent = '';
    let contentType = 'text/csv';
    let fileExtension = 'csv';

    if (exportFormats.includes('csv') || exportFormats.includes('excel')) {
      fileContent = generateCSVReport(reportContent, tickets);
    } else if (exportFormats.includes('json')) {
      fileContent = JSON.stringify({ metrics: analyticsData, tickets, reportType }, null, 2);
      contentType = 'application/json';
      fileExtension = 'json';
    } else {
      // Default to CSV
      fileContent = generateCSVReport(reportContent, tickets);
    }

    // Store report in history
    const { error: historyError } = await supabaseClient
      .from('report_history')
      .insert({
        report_type: reportType,
        generated_by: user.id,
        status: 'success',
        metrics_snapshot: analyticsData,
        filter_config: dateRange,
        export_format: exportFormats[0] || 'csv',
        file_size_bytes: new Blob([fileContent]).size
      });

    if (historyError) {
      console.error('Error saving to history:', historyError);
    }

    // Send email if recipients provided (would need email service integration)
    if (emailRecipients.length > 0) {
      console.log('Would send email to:', emailRecipients);
      // TODO: Integrate with Resend or similar email service
    }

    // Return the report file
    return new Response(fileContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="report_${reportType}_${new Date().toISOString().split('T')[0]}.${fileExtension}"`
      }
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateReportContent(reportType: string, metrics: any, tickets: any[]) {
  const content: any = {
    reportType,
    generatedAt: new Date().toISOString(),
    summary: {
      totalTickets: metrics.total_requests,
      completedTickets: metrics.completed_requests,
      completionRate: metrics.completion_rate,
      slaCompliance: metrics.sla_compliance_rate,
      slaBreaches: metrics.sla_breaches,
      avgCompletionHours: metrics.avg_completion_hours,
      avgFirstResponseMinutes: metrics.avg_first_response_minutes,
      reopenedTickets: metrics.reopened_tickets,
      efficiencyScore: metrics.efficiency_score
    },
    tickets: tickets.length
  };

  return content;
}

function generateCSVReport(content: any, tickets: any[]): string {
  let csv = 'Maintenance Analytics Report\n\n';
  csv += `Generated At: ${format(new Date(), 'PPP p')}\n\n`;
  
  csv += 'SUMMARY METRICS\n';
  csv += 'Metric,Value\n';
  csv += `Total Tickets,${content.summary.totalTickets}\n`;
  csv += `Completed Tickets,${content.summary.completedTickets}\n`;
  csv += `Completion Rate,${content.summary.completionRate}%\n`;
  csv += `SLA Compliance Rate,${content.summary.slaCompliance}%\n`;
  csv += `SLA Breaches,${content.summary.slaBreaches}\n`;
  csv += `Avg Completion Time,${content.summary.avgCompletionHours} hours\n`;
  csv += `Avg First Response Time,${content.summary.avgFirstResponseMinutes} minutes\n`;
  csv += `Reopened Tickets,${content.summary.reopenedTickets}\n`;
  csv += `Efficiency Score,${content.summary.efficiencyScore}/100\n\n`;
  
  csv += 'DETAILED TICKET LIST\n';
  csv += 'ID,Title,Priority,Status,Created At,Completed At,Assigned To\n';
  
  tickets.forEach(ticket => {
    const assigneeName = ticket.assignee 
      ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` 
      : 'Unassigned';
    csv += `${ticket.id},"${ticket.title}",${ticket.priority},${ticket.status},${ticket.created_at},${ticket.completed_at || 'N/A'},${assigneeName}\n`;
  });

  return csv;
}

function format(date: Date, formatStr: string): string {
  // Simple formatter for Deno environment
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  if (formatStr === 'PPP p') {
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  return `${year}-${month}-${day}`;
}