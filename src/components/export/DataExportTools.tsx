import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileImage,
  Database,
  Calendar,
  Filter,
  Users,
  Wrench,
  Building,
  BarChart3
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  type: 'requests' | 'users' | 'assets' | 'analytics' | 'performance';
  icon: any;
  adminOnly?: boolean;
}

interface DataExportToolsProps {
  className?: string;
}

export function DataExportTools({ className }: DataExportToolsProps) {
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions: ExportOption[] = [
    {
      id: 'requests',
      label: 'Maintenance Requests',
      description: 'All maintenance requests with status, priority, and assignments',
      type: 'requests',
      icon: Wrench
    },
    {
      id: 'users',
      label: 'User Directory',
      description: 'User profiles, roles, and contact information',
      type: 'users',
      icon: Users,
      adminOnly: true
    },
    {
      id: 'assets',
      label: 'Asset Inventory',
      description: 'Complete asset registry with maintenance history',
      type: 'assets',
      icon: Building
    },
    {
      id: 'performance',
      label: 'Performance Metrics',
      description: 'SLA compliance, response times, and completion rates',
      type: 'performance',
      icon: BarChart3
    },
    {
      id: 'analytics',
      label: 'Analytics Summary',
      description: 'Comprehensive analytics data and trends',
      type: 'analytics',
      icon: Database,
      adminOnly: true
    }
  ];

  const isAdmin = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .maybeSingle();
    return profile?.role === 'admin';
  };

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const generateCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportData = async () => {
    if (selectedOptions.length === 0) {
      toast.error('Please select at least one data type to export');
      return;
    }

    setIsExporting(true);

    try {
      const adminUser = await isAdmin();
      const fromDate = dateRange?.from?.toISOString().split('T')[0];
      const toDate = dateRange?.to?.toISOString().split('T')[0];

      for (const optionId of selectedOptions) {
        const option = exportOptions.find(o => o.id === optionId);
        if (!option) continue;

        if (option.adminOnly && !adminUser) {
          toast.error(`Access denied: ${option.label} requires admin privileges`);
          continue;
        }

        let data: any[] = [];
        let headers: string[] = [];
        let filename = '';

        switch (option.type) {
          case 'requests':
            const requestsQuery = supabase
              .from('maintenance_requests')
              .select(`
                id,
                title,
                description,
                status,
                priority,
                location,
                created_at,
                completed_at,
                reported_profile:profiles!reported_by(first_name, last_name),
                assigned_profile:profiles!assigned_to(first_name, last_name)
              `);

            if (fromDate) requestsQuery.gte('created_at', fromDate);
            if (toDate) requestsQuery.lte('created_at', toDate);

            const { data: requests } = await requestsQuery;
            
            data = requests?.map(r => ({
              ID: r.id,
              Title: r.title,
              Description: r.description,
              Status: r.status,
              Priority: r.priority,
              Location: r.location,
              Category: 'General',
              'Reported By': `${r.reported_profile?.first_name || ''} ${r.reported_profile?.last_name || ''}`.trim() || 'N/A',
              'Assigned To': `${r.assigned_profile?.first_name || ''} ${r.assigned_profile?.last_name || ''}`.trim() || 'Unassigned',
              'Created At': new Date(r.created_at).toLocaleDateString(),
              'Completed At': r.completed_at ? new Date(r.completed_at).toLocaleDateString() : 'Pending'
            })) || [];

            headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Location', 'Category', 'Reported By', 'Assigned To', 'Created At', 'Completed At'];
            filename = `maintenance_requests_${new Date().toISOString().split('T')[0]}`;
            break;

          case 'users':
            if (!adminUser) break;
            
            const { data: users } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, role, department, phone_number, office_number, floor, zone, created_at');

            data = users?.map(u => ({
              ID: u.id,
              'First Name': u.first_name || '',
              'Last Name': u.last_name || '',
              Role: u.role,
              Department: u.department || '',
              Phone: u.phone_number || '',
              Office: u.office_number || '',
              Floor: u.floor || '',
              Zone: u.zone || '',
              'Created At': new Date(u.created_at).toLocaleDateString()
            })) || [];

            headers = ['ID', 'First Name', 'Last Name', 'Role', 'Department', 'Phone', 'Office', 'Floor', 'Zone', 'Created At'];
            filename = `user_directory_${new Date().toISOString().split('T')[0]}`;
            break;

          case 'assets':
            const { data: assets } = await supabase
              .from('assets')
              .select('*');

            data = assets?.map(a => ({
              ID: a.id,
              'Asset Name': a.asset_name,
              Type: a.asset_type,
              Location: a.location,
              Floor: a.floor,
              Zone: a.zone || '',
              Status: a.status,
              Brand: a.brand || '',
              Model: a.model_number || '',
              Serial: a.serial_number || '',
              'Purchase Date': a.purchase_date || '',
              'Warranty Expiry': a.warranty_expiry || '',
              'Last Service': a.last_service_date || '',
              'Next Service': a.next_service_due || '',
              'AMC Vendor': a.amc_vendor || '',
              'AMC Start': a.amc_start_date || '',
              'AMC End': a.amc_end_date || ''
            })) || [];

            headers = ['ID', 'Asset Name', 'Type', 'Location', 'Floor', 'Zone', 'Status', 'Brand', 'Model', 'Serial', 'Purchase Date', 'Warranty Expiry', 'Last Service', 'Next Service', 'AMC Vendor', 'AMC Start', 'AMC End'];
            filename = `asset_inventory_${new Date().toISOString().split('T')[0]}`;
            break;

          case 'performance':
            const { data: metrics, error: metricsError } = await supabase
              .from('performance_metrics')
              .select('*')
              .order('metric_date', { ascending: false });

            if (metricsError) {
              console.error('Error fetching performance metrics:', metricsError);
              throw metricsError;
            }

            data = metrics?.map(m => ({
              Date: m.metric_date,
              'Total Requests': m.total_requests,
              'Completed Requests': m.completed_requests,
              'Completion Rate': `${((m.completed_requests / m.total_requests) * 100).toFixed(1)}%`,
              'Avg Completion Time (min)': Math.round(m.average_completion_time_minutes),
              'SLA Breaches': m.sla_breaches,
              'SLA Compliance': `${(((m.total_requests - m.sla_breaches) / m.total_requests) * 100).toFixed(1)}%`
            })) || [];

            headers = ['Date', 'Total Requests', 'Completed Requests', 'Completion Rate', 'Avg Completion Time (min)', 'SLA Breaches', 'SLA Compliance'];
            filename = `performance_metrics_${new Date().toISOString().split('T')[0]}`;
            break;

          case 'analytics':
            if (!adminUser) break;
            
            const { data: analytics, error: analyticsError } = await supabase
              .from('analytics_summaries')
              .select('*')
              .order('summary_date', { ascending: false });

            if (analyticsError) {
              console.error('Error fetching analytics summaries:', analyticsError);
              throw analyticsError;
            }

            data = analytics?.map(a => ({
              Date: a.summary_date,
              Type: a.summary_type,
              Category: a.metric_category,
              Data: JSON.stringify(a.metric_data),
              'Calculated At': new Date(a.calculated_at).toLocaleDateString()
            })) || [];

            headers = ['Date', 'Type', 'Category', 'Data', 'Calculated At'];
            filename = `analytics_summary_${new Date().toISOString().split('T')[0]}`;
            break;
        }

        if (data.length > 0) {
          let content = '';
          let fileExtension = '';

          switch (format) {
            case 'csv':
              content = generateCSV(data, headers);
              fileExtension = 'csv';
              break;
            case 'json':
              content = JSON.stringify(data, null, 2);
              fileExtension = 'json';
              break;
            case 'pdf':
              // For PDF, we'd need a PDF library - for now, fall back to CSV
              content = generateCSV(data, headers);
              fileExtension = 'csv';
              break;
          }

          downloadFile(content, `${filename}.${fileExtension}`, `text/${fileExtension}`);
          toast.success(`${option.label} exported successfully`);
        } else {
          toast.warning(`No data found for ${option.label}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className={`bg-card/50 backdrop-blur ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export Tools
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date Range Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Date Range (Optional)</label>
          <DatePickerWithRange
            selected={dateRange}
            onSelect={setDateRange}
            className="w-full"
          />
        </div>

        {/* Export Format */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Export Format</label>
          <Select value={format} onValueChange={(value: 'csv' | 'json' | 'pdf') => setFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Excel Compatible)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON (Developer Friendly)
                </div>
              </SelectItem>
              <SelectItem value="pdf" disabled>
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  PDF (Coming Soon)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-white">Select Data to Export</label>
          <div className="space-y-2">
            {exportOptions.map(option => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <Checkbox
                    id={option.id}
                    checked={selectedOptions.includes(option.id)}
                    onCheckedChange={() => toggleOption(option.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-primary" />
                      <label 
                        htmlFor={option.id}
                        className="text-sm font-medium text-white cursor-pointer"
                      >
                        {option.label}
                      </label>
                      {option.adminOnly && (
                        <Badge variant="outline" className="text-xs">
                          Admin Only
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={exportData}
          disabled={isExporting || selectedOptions.length === 0}
          className="w-full"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Selected Data ({selectedOptions.length})
            </>
          )}
        </Button>

        {selectedOptions.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Selected: {selectedOptions.map(id => 
              exportOptions.find(o => o.id === id)?.label
            ).join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}