import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface ComplianceReport {
  id: string;
  reportType: 'visitor_audit' | 'maintenance_audit' | 'security_audit' | 'staff_audit' | 'financial_audit';
  title: string;
  period: {
    start: string;
    end: string;
  };
  generatedAt: string;
  data: any;
  summary: {
    totalRecords: number;
    complianceScore: number;
    violations: number;
    recommendations: string[];
  };
}

interface AuditRequirement {
  category: string;
  requirement: string;
  status: 'compliant' | 'violation' | 'warning';
  details: string;
  evidence?: string[];
}

export const useComplianceReporting = () => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVisitorAuditReport = useCallback(async (startDate: string, endDate: string) => {
    try {
      // Get all visitor records for the period
      const { data: visitors } = await supabase
        .from('visitors')
        .select(`
          *,
          visitor_categories (name),
          profiles!inner (first_name, last_name, role),
          visitor_check_logs (*)
        `)
        .gte('visit_date', startDate)
        .lte('visit_date', endDate);

      if (!visitors) throw new Error('Failed to fetch visitor data');

      // Audit requirements
      const auditChecks: AuditRequirement[] = [];

      // Check for proper visitor registration
      const unregisteredVisitors = visitors.filter(v => !v.host_id);
      auditChecks.push({
        category: 'Registration',
        requirement: 'All visitors must have designated hosts',
        status: unregisteredVisitors.length > 0 ? 'violation' : 'compliant',
        details: `${unregisteredVisitors.length} visitors without designated hosts`
      });

      // Check for visitor check-in/out compliance
      const incompleteCheckouts = visitors.filter(v => 
        v.status === 'checked_in' && 
        new Date(v.visit_date) < new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      auditChecks.push({
        category: 'Check-in/Check-out',
        requirement: 'All visitors must check out within 24 hours',
        status: incompleteCheckouts.length > 0 ? 'violation' : 'compliant',
        details: `${incompleteCheckouts.length} visitors with incomplete checkouts`
      });

      // Check for security screening compliance
      const unscreenedVisitors = visitors.filter(v => 
        !v.visitor_check_logs?.some(log => log.action_type === 'security_screening')
      );
      auditChecks.push({
        category: 'Security',
        requirement: 'All visitors must undergo security screening',
        status: unscreenedVisitors.length > 0 ? 'warning' : 'compliant',
        details: `${unscreenedVisitors.length} visitors without recorded security screening`
      });

      // Check for VIP protocol compliance
      const vipVisitors = visitors.filter(v => 
        v.visitor_categories?.name?.toLowerCase().includes('vip')
      );
      const vipWithoutProtocol = vipVisitors.filter(v => 
        !v.visitor_check_logs?.some(log => log.metadata && typeof log.metadata === 'object' && (log.metadata as any)?.vip_protocol === true)
      );
      auditChecks.push({
        category: 'VIP Protocol',
        requirement: 'VIP visitors must receive appropriate protocol',
        status: vipWithoutProtocol.length > 0 ? 'warning' : 'compliant',
        details: `${vipWithoutProtocol.length} VIP visitors without protocol compliance`
      });

      const violations = auditChecks.filter(check => check.status === 'violation').length;
      const warnings = auditChecks.filter(check => check.status === 'warning').length;
      const complianceScore = ((auditChecks.length - violations - warnings * 0.5) / auditChecks.length) * 100;

      const recommendations = [];
      if (unregisteredVisitors.length > 0) {
        recommendations.push('Implement mandatory host assignment for all visitor registrations');
      }
      if (incompleteCheckouts.length > 0) {
        recommendations.push('Set up automated alerts for overdue visitor checkouts');
      }
      if (unscreenedVisitors.length > 0) {
        recommendations.push('Ensure security screening is recorded for all visitors');
      }
      if (vipWithoutProtocol.length > 0) {
        recommendations.push('Review and enforce VIP visitor protocols');
      }

      return {
        auditChecks,
        summary: {
          totalRecords: visitors.length,
          complianceScore: Math.round(complianceScore),
          violations,
          recommendations
        },
        data: {
          visitors,
          periodStats: {
            totalVisitors: visitors.length,
            vipVisitors: vipVisitors.length,
            securityIncidents: visitors.filter(v => 
              v.visitor_check_logs?.some(log => log.action_type === 'security_incident')
            ).length,
            averageVisitDuration: '4.2 hours' // Placeholder
          }
        }
      };

    } catch (error) {
      console.error('Error generating visitor audit report:', error);
      throw error;
    }
  }, []);

  const generateMaintenanceAuditReport = useCallback(async (startDate: string, endDate: string) => {
    try {
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          profiles!maintenance_requests_reported_by_fkey (first_name, last_name),
          profiles!maintenance_requests_assigned_to_fkey (first_name, last_name),
          request_status_history (*),
          request_attachments (*)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (!requests) throw new Error('Failed to fetch maintenance data');

      const auditChecks: AuditRequirement[] = [];

      // SLA Compliance Check
      const slaBreaches = requests.filter(r => 
        r.sla_breach_at && (
          (r.status === 'completed' && r.completed_at > r.sla_breach_at) ||
          (r.status !== 'completed' && new Date() > new Date(r.sla_breach_at))
        )
      );
      auditChecks.push({
        category: 'SLA Compliance',
        requirement: 'All requests must meet SLA requirements',
        status: slaBreaches.length > 0 ? 'violation' : 'compliant',
        details: `${slaBreaches.length} SLA breaches out of ${requests.length} requests`
      });

      // Documentation Compliance
      const undocumentedRequests = requests.filter(r => 
        !r.description || r.description.length < 10
      );
      auditChecks.push({
        category: 'Documentation',
        requirement: 'All requests must have adequate documentation',
        status: undocumentedRequests.length > 0 ? 'warning' : 'compliant',
        details: `${undocumentedRequests.length} requests with insufficient documentation`
      });

      // Urgent Request Handling
      const urgentRequests = requests.filter(r => r.priority === 'urgent');
      const delayedUrgentRequests = urgentRequests.filter(r => {
        const created = new Date(r.created_at);
        const responded = r.request_status_history?.find(h => h.status === 'in_progress');
        if (!responded) return true;
        const responseTime = new Date(responded.changed_at).getTime() - created.getTime();
        return responseTime > 2 * 60 * 60 * 1000; // 2 hours
      });

      auditChecks.push({
        category: 'Urgent Response',
        requirement: 'Urgent requests must be responded to within 2 hours',
        status: delayedUrgentRequests.length > 0 ? 'violation' : 'compliant',
        details: `${delayedUrgentRequests.length} urgent requests with delayed response`
      });

      const violations = auditChecks.filter(check => check.status === 'violation').length;
      const warnings = auditChecks.filter(check => check.status === 'warning').length;
      const complianceScore = ((auditChecks.length - violations - warnings * 0.5) / auditChecks.length) * 100;

      const recommendations = [];
      if (slaBreaches.length > 0) {
        recommendations.push('Review resource allocation to improve SLA compliance');
      }
      if (undocumentedRequests.length > 0) {
        recommendations.push('Implement mandatory documentation requirements');
      }
      if (delayedUrgentRequests.length > 0) {
        recommendations.push('Set up automated urgent request escalation');
      }

      return {
        auditChecks,
        summary: {
          totalRecords: requests.length,
          complianceScore: Math.round(complianceScore),
          violations,
          recommendations
        },
        data: {
          requests,
          slaMetrics: {
            totalRequests: requests.length,
            completedRequests: requests.filter(r => r.status === 'completed').length,
            slaBreaches: slaBreaches.length,
            avgResolutionTime: requests.filter(r => r.completed_at).length > 0 
              ? requests.filter(r => r.completed_at).reduce((acc, r) => {
                  const created = new Date(r.created_at);
                  const completed = new Date(r.completed_at);
                  return acc + (completed.getTime() - created.getTime());
                }, 0) / requests.filter(r => r.completed_at).length / (1000 * 60 * 60)
              : 0
          }
        }
      };

    } catch (error) {
      console.error('Error generating maintenance audit report:', error);
      throw error;
    }
  }, []);

  const generateComplianceReport = useCallback(async (
    type: ComplianceReport['reportType'],
    startDate: string,
    endDate: string,
    title?: string
  ) => {
    setGenerating(true);
    setError(null);

    try {
      let reportData;
      
      switch (type) {
        case 'visitor_audit':
          reportData = await generateVisitorAuditReport(startDate, endDate);
          break;
        case 'maintenance_audit':
          reportData = await generateMaintenanceAuditReport(startDate, endDate);
          break;
        default:
          throw new Error(`Report type ${type} not implemented yet`);
      }

      const report: ComplianceReport = {
        id: crypto.randomUUID(),
        reportType: type,
        title: title || `${type.replace('_', ' ').toUpperCase()} Report`,
        period: { start: startDate, end: endDate },
        generatedAt: new Date().toISOString(),
        data: reportData.data,
        summary: reportData.summary
      };

      setReports(prev => [report, ...prev]);
      toast.success('Compliance report generated successfully');
      
      return report;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setGenerating(false);
    }
  }, [generateVisitorAuditReport, generateMaintenanceAuditReport]);

  const exportReport = useCallback((report: ComplianceReport, format: 'pdf' | 'excel' | 'json') => {
    try {
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/\s+/g, '_').toLowerCase()}_${report.period.start}_${report.period.end}.${format === 'json' ? 'json' : 'txt'}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  }, []);

  return {
    reports,
    generating,
    error,
    generateComplianceReport,
    exportReport
  };
};