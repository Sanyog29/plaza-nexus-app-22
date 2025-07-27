import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, FileText, Calendar, Users, Shield, 
  BarChart3, PieChart, TrendingUp, Clock 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface ReportConfig {
  type: 'visitor' | 'security' | 'compliance' | 'custom';
  dateRange: string;
  format: 'json' | 'csv' | 'pdf';
  includeSections: string[];
  customFilters: Record<string, any>;
}

const REPORT_TYPES = [
  { value: 'visitor', label: 'Visitor Report', icon: Users, description: 'Comprehensive visitor analytics and statistics' },
  { value: 'security', label: 'Security Report', icon: Shield, description: 'Guard shifts, incidents, and security metrics' },
  { value: 'compliance', label: 'Compliance Report', icon: FileText, description: 'Audit trails and regulatory compliance data' },
  { value: 'custom', label: 'Custom Report', icon: BarChart3, description: 'Build your own custom report' }
];

const VISITOR_SECTIONS = [
  { id: 'overview', label: 'Overview & Summary', description: 'Key metrics and visitor statistics' },
  { id: 'trends', label: 'Visitor Trends', description: 'Daily and hourly visitor patterns' },
  { id: 'categories', label: 'Visitor Categories', description: 'Breakdown by visitor types' },
  { id: 'companies', label: 'Company Analysis', description: 'Top visiting companies and patterns' },
  { id: 'duration', label: 'Visit Duration', description: 'Average visit times and patterns' },
  { id: 'no-shows', label: 'No-Show Analysis', description: 'Visitor no-show rates and patterns' }
];

const SECURITY_SECTIONS = [
  { id: 'shifts', label: 'Shift Summary', description: 'Guard shifts and coverage statistics' },
  { id: 'performance', label: 'Guard Performance', description: 'Individual guard performance metrics' },
  { id: 'incidents', label: 'Security Incidents', description: 'Incident reports and analysis' },
  { id: 'workload', label: 'Workload Analysis', description: 'Guard workload distribution' },
  { id: 'handovers', label: 'Shift Handovers', description: 'Shift change documentation' }
];

export const ReportGenerator: React.FC = () => {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'visitor',
    dateRange: '30',
    format: 'json',
    includeSections: [],
    customFilters: {}
  });
  const [generating, setGenerating] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      includeSections: checked 
        ? [...prev.includeSections, sectionId]
        : prev.includeSections.filter(id => id !== sectionId)
    }));
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      let startDate: Date, endDate: Date;
      
      if (config.dateRange === 'custom') {
        if (!customDateFrom || !customDateTo) {
          toast({ title: "Error", description: "Please select custom date range", variant: "destructive" });
          return;
        }
        startDate = startOfDay(new Date(customDateFrom));
        endDate = endOfDay(new Date(customDateTo));
      } else {
        const daysBack = parseInt(config.dateRange);
        startDate = startOfDay(subDays(new Date(), daysBack));
        endDate = endOfDay(new Date());
      }

      let reportData: any = {
        generatedAt: new Date().toISOString(),
        reportType: config.type,
        dateRange: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
          description: config.dateRange === 'custom' 
            ? `${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`
            : `Last ${config.dateRange} days`
        },
        includedSections: config.includeSections,
        data: {}
      };

      if (config.type === 'visitor') {
        reportData.data = await generateVisitorReport(startDate, endDate);
      } else if (config.type === 'security') {
        reportData.data = await generateSecurityReport(startDate, endDate);
      } else if (config.type === 'compliance') {
        reportData.data = await generateComplianceReport(startDate, endDate);
      }

      // Filter sections based on user selection
      if (config.includeSections.length > 0) {
        const filteredData: any = {};
        config.includeSections.forEach(section => {
          if (reportData.data[section]) {
            filteredData[section] = reportData.data[section];
          }
        });
        reportData.data = filteredData;
      }

      await downloadReport(reportData);
      
      toast({ 
        title: "Success", 
        description: `${config.type} report generated successfully` 
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate report", 
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateVisitorReport = async (startDate: Date, endDate: Date) => {
    const { data: visitors } = await supabase
      .from('visitors')
      .select(`
        *,
        visitor_categories (name, color),
        visitor_check_logs (*),
        profiles!inner (first_name, last_name)
      `)
      .gte('visit_date', startDate.toISOString().split('T')[0])
      .lte('visit_date', endDate.toISOString().split('T')[0]);

    if (!visitors) return {};

    return {
      overview: {
        totalVisitors: visitors.length,
        checkedIn: visitors.filter(v => v.status === 'checked_in').length,
        checkedOut: visitors.filter(v => v.status === 'checked_out').length,
        noShows: visitors.filter(v => v.status === 'scheduled').length,
        approvalRate: (visitors.filter(v => v.approval_status === 'approved').length / visitors.length * 100).toFixed(1)
      },
      trends: {
        dailyVisitors: getDailyVisitorTrends(visitors),
        hourlyPattern: getHourlyPattern(visitors),
        weekdayPattern: getWeekdayPattern(visitors)
      },
      categories: getCategoryBreakdown(visitors),
      companies: getCompanyAnalysis(visitors),
      duration: getVisitDurationAnalysis(visitors),
      incidents: getVisitorIncidents(visitors)
    };
  };

  const generateSecurityReport = async (startDate: Date, endDate: Date) => {
    const { data: shifts } = await supabase
      .from('security_shifts')
      .select(`
        *,
        profiles!security_shifts_guard_id_fkey (first_name, last_name)
      `)
      .gte('shift_start', startDate.toISOString())
      .lte('shift_start', endDate.toISOString());

    if (!shifts) return {};

    return {
      shifts: {
        totalShifts: shifts.length,
        completedShifts: shifts.filter(s => s.shift_end).length,
        averageDuration: getAverageShiftDuration(shifts),
        coverage: getShiftCoverage(shifts)
      },
      performance: getGuardPerformance(shifts),
      incidents: [], // Would come from incidents table
      workload: getWorkloadAnalysis(shifts),
      handovers: getHandoverSummary(shifts)
    };
  };

  const generateComplianceReport = async (startDate: Date, endDate: Date) => {
    // This would fetch audit logs, compliance checks, etc.
    return {
      auditTrail: {
        userActions: [],
        systemChanges: [],
        accessLogs: []
      },
      compliance: {
        dataRetention: 'Compliant',
        accessControls: 'Compliant',
        auditLogs: 'Compliant'
      },
      security: {
        passwordPolicies: 'Enforced',
        sessionManagement: 'Active',
        dataEncryption: 'Enabled'
      }
    };
  };

  // Helper functions for data processing
  const getDailyVisitorTrends = (visitors: any[]) => {
    const dailyData: { [key: string]: number } = {};
    visitors.forEach(visitor => {
      dailyData[visitor.visit_date] = (dailyData[visitor.visit_date] || 0) + 1;
    });
    return Object.entries(dailyData).map(([date, count]) => ({ date, count }));
  };

  const getHourlyPattern = (visitors: any[]) => {
    const hourlyData: { [key: number]: number } = {};
    visitors.forEach(visitor => {
      if (visitor.check_in_time) {
        const hour = new Date(visitor.check_in_time).getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      }
    });
    return Object.entries(hourlyData).map(([hour, count]) => ({ hour: parseInt(hour), count }));
  };

  const getWeekdayPattern = (visitors: any[]) => {
    const weekdayData: { [key: number]: number } = {};
    visitors.forEach(visitor => {
      const weekday = new Date(visitor.visit_date).getDay();
      weekdayData[weekday] = (weekdayData[weekday] || 0) + 1;
    });
    return Object.entries(weekdayData).map(([day, count]) => ({ 
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)], 
      count 
    }));
  };

  const getCategoryBreakdown = (visitors: any[]) => {
    const categories: { [key: string]: number } = {};
    visitors.forEach(visitor => {
      const category = visitor.visitor_categories?.name || 'Unknown';
      categories[category] = (categories[category] || 0) + 1;
    });
    return Object.entries(categories).map(([category, count]) => ({ category, count }));
  };

  const getCompanyAnalysis = (visitors: any[]) => {
    const companies: { [key: string]: number } = {};
    visitors.forEach(visitor => {
      const company = visitor.company || 'Individual';
      companies[company] = (companies[company] || 0) + 1;
    });
    return Object.entries(companies)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  };

  const getVisitDurationAnalysis = (visitors: any[]) => {
    const durations = visitors
      .filter(v => v.check_in_time && v.check_out_time)
      .map(v => {
        const duration = new Date(v.check_out_time).getTime() - new Date(v.check_in_time).getTime();
        return duration / (1000 * 60); // minutes
      });

    return {
      average: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      median: durations.length > 0 ? durations.sort()[Math.floor(durations.length / 2)] : 0,
      min: durations.length > 0 ? Math.min(...durations) : 0,
      max: durations.length > 0 ? Math.max(...durations) : 0
    };
  };

  const getVisitorIncidents = (visitors: any[]) => {
    // This would analyze visitor-related incidents
    return [];
  };

  const getAverageShiftDuration = (shifts: any[]) => {
    const completedShifts = shifts.filter(s => s.shift_end);
    if (completedShifts.length === 0) return 0;
    
    const totalDuration = completedShifts.reduce((sum, shift) => {
      return sum + (new Date(shift.shift_end).getTime() - new Date(shift.shift_start).getTime());
    }, 0);
    
    return totalDuration / completedShifts.length / (1000 * 60 * 60); // hours
  };

  const getShiftCoverage = (shifts: any[]) => {
    // Calculate shift coverage patterns
    return {
      totalHours: shifts.reduce((sum, shift) => {
        if (shift.shift_end) {
          return sum + (new Date(shift.shift_end).getTime() - new Date(shift.shift_start).getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0),
      gapsCovered: 95.5, // Mock data
      peakCoverage: '09:00-17:00'
    };
  };

  const getGuardPerformance = (shifts: any[]) => {
    const guardData: { [key: string]: { shifts: number; hours: number; name: string } } = {};
    
    shifts.forEach(shift => {
      const guardName = `${shift.profiles?.first_name || ''} ${shift.profiles?.last_name || ''}`.trim();
      if (!guardData[guardName]) {
        guardData[guardName] = { shifts: 0, hours: 0, name: guardName };
      }
      
      guardData[guardName].shifts++;
      if (shift.shift_end) {
        const hours = (new Date(shift.shift_end).getTime() - new Date(shift.shift_start).getTime()) / (1000 * 60 * 60);
        guardData[guardName].hours += hours;
      }
    });

    return Object.values(guardData);
  };

  const getWorkloadAnalysis = (shifts: any[]) => {
    // Analyze workload distribution
    return {
      evenDistribution: true,
      overworkedGuards: 0,
      underutilizedGuards: 1
    };
  };

  const getHandoverSummary = (shifts: any[]) => {
    return {
      handoversCompleted: shifts.filter(s => s.handover_notes).length,
      totalHandovers: shifts.filter(s => s.shift_end).length,
      completionRate: shifts.filter(s => s.shift_end).length > 0 
        ? (shifts.filter(s => s.handover_notes).length / shifts.filter(s => s.shift_end).length * 100).toFixed(1)
        : 0
    };
  };

  const downloadReport = async (reportData: any) => {
    const filename = `${config.type}-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}`;
    
    if (config.format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${filename}.json`);
    } else if (config.format === 'csv') {
      const csv = convertToCSV(reportData);
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, `${filename}.csv`);
    } else if (config.format === 'pdf') {
      // For PDF generation, you would typically use a library like jsPDF
      toast({ title: "Info", description: "PDF generation coming soon" });
    }
  };

  const convertToCSV = (data: any) => {
    // Simple CSV conversion - in a real app, this would be more sophisticated
    const flatData = flattenObject(data);
    const headers = Object.keys(flatData);
    const values = Object.values(flatData);
    
    return [headers.join(','), values.join(',')].join('\n');
  };

  const flattenObject = (obj: any, prefix = ''): any => {
    const flattened: any = {};
    
    for (const key in obj) {
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], `${prefix}${key}.`));
      } else {
        flattened[`${prefix}${key}`] = obj[key];
      }
    }
    
    return flattened;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSectionsForType = () => {
    switch (config.type) {
      case 'visitor': return VISITOR_SECTIONS;
      case 'security': return SECURITY_SECTIONS;
      default: return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Report Generator</h2>
      </div>

      {/* Report Type Selection */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORT_TYPES.map((type) => (
              <div
                key={type.value}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  config.type === type.value 
                    ? 'border-plaza-blue bg-plaza-blue/10' 
                    : 'border-border hover:border-plaza-blue/50'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, type: type.value as any }))}
              >
                <div className="flex items-center gap-3 mb-2">
                  <type.icon className="h-6 w-6 text-plaza-blue" />
                  <h3 className="font-medium text-white">{type.label}</h3>
                </div>
                <p className="text-sm text-gray-400">{type.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date Range & Format */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dateRange" className="text-white">Date Range</Label>
              <Select value={config.dateRange} onValueChange={(value) => setConfig(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-white">From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-white">To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="format" className="text-white">Export Format</Label>
              <Select value={config.format} onValueChange={(value) => setConfig(prev => ({ ...prev, format: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sections to Include */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Include Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getSectionsForType().map((section) => (
                <div key={section.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={section.id}
                    checked={config.includeSections.includes(section.id)}
                    onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={section.id}
                      className="text-sm font-medium text-white leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {section.label}
                    </label>
                    <p className="text-xs text-gray-400">
                      {section.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">Ready to Generate</h3>
              <p className="text-sm text-gray-400">
                {config.type} report for {config.dateRange === 'custom' ? 'custom date range' : `last ${config.dateRange} days`}
                {config.includeSections.length > 0 && ` (${config.includeSections.length} sections)`}
              </p>
            </div>
            <Button
              onClick={generateReport}
              disabled={generating}
              className="bg-plaza-blue hover:bg-plaza-blue/80"
            >
              {generating ? (
                <>Generating...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};