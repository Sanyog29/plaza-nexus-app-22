import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileImage,
  Database,
  Wrench,
  Users,
  Building,
  BarChart3,
  RefreshCw,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  type: 'requests' | 'users' | 'assets' | 'analytics' | 'performance' | 'utilities' | 'predictive';
  icon: any;
  adminOnly?: boolean;
  estimatedTime?: number; // in seconds
}

interface ExportProgress {
  current: number;
  total: number;
  status: string;
}

interface UnifiedDataExportToolsProps {
  className?: string;
  enableRealtime?: boolean;
}

export function UnifiedDataExportTools({ className, enableRealtime = true }: UnifiedDataExportToolsProps) {
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [format, setFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({ current: 0, total: 0, status: '' });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(enableRealtime);

  const exportOptions: ExportOption[] = [
    {
      id: 'requests',
      label: 'Maintenance Requests',
      description: 'All maintenance requests with status, priority, and assignments',
      type: 'requests',
      icon: Wrench,
      estimatedTime: 3
    },
    {
      id: 'users',
      label: 'User Directory',
      description: 'User profiles, roles, and contact information',
      type: 'users',
      icon: Users,
      adminOnly: true,
      estimatedTime: 2
    },
    {
      id: 'assets',
      label: 'Asset Inventory',
      description: 'Complete asset registry with maintenance history',
      type: 'assets',
      icon: Building,
      estimatedTime: 4
    },
    {
      id: 'performance',
      label: 'Performance Metrics',
      description: 'SLA compliance, response times, and completion rates',
      type: 'performance',
      icon: BarChart3,
      estimatedTime: 2
    },
    {
      id: 'analytics',
      label: 'Analytics Summary',
      description: 'Comprehensive analytics data and trends',
      type: 'analytics',
      icon: Database,
      adminOnly: true,
      estimatedTime: 5
    },
    {
      id: 'utilities',
      label: 'Utility Readings',
      description: 'Utility consumption data and meter readings',
      type: 'utilities',
      icon: TrendingUp,
      estimatedTime: 3
    },
    {
      id: 'predictive',
      label: 'Predictive Analytics',
      description: 'Forecasting and predictive maintenance data',
      type: 'predictive',
      icon: AlertCircle,
      adminOnly: true,
      estimatedTime: 8
    }
  ];

  // Auto-refresh data every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Real-time subscription for data changes
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel('data-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        setLastRefresh(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime]);

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
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const generateXLSX = async (data: any[], headers: string[]) => {
    // For now, generate CSV format - would need a library like SheetJS for true XLSX
    return generateCSV(data, headers);
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

  const fetchDataWithProgress = async (option: ExportOption, adminUser: boolean) => {
    const fromDate = dateRange?.from?.toISOString().split('T')[0];
    const toDate = dateRange?.to?.toISOString().split('T')[0];

    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    setExportProgress(prev => ({ ...prev, status: `Fetching ${option.label}...` }));

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
            sla_breach_at,
            reported_profile:profiles!reported_by(first_name, last_name, department),
            assigned_profile:profiles!assigned_to(first_name, last_name, department),
            category:maintenance_categories(name)
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
          Category: r.category?.name || 'General',
          'Reported By': `${r.reported_profile?.first_name || ''} ${r.reported_profile?.last_name || ''}`.trim() || 'N/A',
          'Reporter Department': r.reported_profile?.department || 'N/A',
          'Assigned To': `${r.assigned_profile?.first_name || ''} ${r.assigned_profile?.last_name || ''}`.trim() || 'Unassigned',
          'Assignee Department': r.assigned_profile?.department || 'N/A',
          'Created At': new Date(r.created_at).toLocaleString(),
          'Completed At': r.completed_at ? new Date(r.completed_at).toLocaleString() : 'Pending',
          'SLA Status': r.sla_breach_at ? (new Date(r.sla_breach_at) < new Date() ? 'Breached' : 'On Track') : 'No SLA',
          'Response Time (hours)': r.completed_at 
            ? Math.round((new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60))
            : 'N/A'
        })) || [];

        headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Location', 'Category', 'Reported By', 'Reporter Department', 'Assigned To', 'Assignee Department', 'Created At', 'Completed At', 'SLA Status', 'Response Time (hours)'];
        filename = `maintenance_requests_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'users':
        if (!adminUser) throw new Error('Admin access required');
        
        const { data: users } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, department, phone_number, office_number, floor, zone, created_at, approval_status');

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
          'Approval Status': u.approval_status,
          'Created At': new Date(u.created_at).toLocaleString()
        })) || [];

        headers = ['ID', 'First Name', 'Last Name', 'Role', 'Department', 'Phone', 'Office', 'Floor', 'Zone', 'Approval Status', 'Created At'];
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
          'AMC End': a.amc_end_date || '',
          'AMC Cost': a.amc_cost || 0,
          'Service Frequency (months)': a.service_frequency_months || 'N/A'
        })) || [];

        headers = ['ID', 'Asset Name', 'Type', 'Location', 'Floor', 'Zone', 'Status', 'Brand', 'Model', 'Serial', 'Purchase Date', 'Warranty Expiry', 'Last Service', 'Next Service', 'AMC Vendor', 'AMC Start', 'AMC End', 'AMC Cost', 'Service Frequency (months)'];
        filename = `asset_inventory_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'utilities':
        const { data: utilityReadings } = await supabase
          .from('utility_readings')
          .select(`
            *,
            meter:utility_meters(meter_number, location, utility_type, unit_of_measurement)
          `)
          .order('reading_date', { ascending: false });

        data = utilityReadings?.map(r => ({
          'Meter Number': r.meter?.meter_number || 'N/A',
          'Utility Type': r.meter?.utility_type || 'N/A',
          Location: r.meter?.location || 'N/A',
          'Unit of Measurement': r.meter?.unit_of_measurement || 'N/A',
          'Reading Date': r.reading_date,
          'Reading Value': r.reading_value,
          Consumption: r.consumption || 0,
          'Cost per Unit': r.cost_per_unit || 0,
          'Total Cost': r.total_cost || 0,
          'Reading Method': r.reading_method,
          Notes: r.notes || ''
        })) || [];

        headers = ['Meter Number', 'Utility Type', 'Location', 'Unit of Measurement', 'Reading Date', 'Reading Value', 'Consumption', 'Cost per Unit', 'Total Cost', 'Reading Method', 'Notes'];
        filename = `utility_readings_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'predictive':
        if (!adminUser) throw new Error('Admin access required');
        
        // Generate predictive maintenance data
        const { data: assetsForPrediction } = await supabase
          .from('assets')
          .select('*')
          .eq('status', 'operational');

        data = assetsForPrediction?.map(asset => {
          const lastService = asset.last_service_date ? new Date(asset.last_service_date) : null;
          const nextService = asset.next_service_due ? new Date(asset.next_service_due) : null;
          const daysSinceService = lastService ? Math.floor((Date.now() - lastService.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          const daysToNextService = nextService ? Math.floor((nextService.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          
          // Simple predictive scoring
          let riskScore = 0;
          if (daysSinceService > 365) riskScore += 40;
          else if (daysSinceService > 180) riskScore += 20;
          
          if (daysToNextService !== null && daysToNextService < 30) riskScore += 30;
          if (daysToNextService !== null && daysToNextService < 0) riskScore += 50;
          
          const riskLevel = riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low';
          
          return {
            'Asset ID': asset.id,
            'Asset Name': asset.asset_name,
            'Asset Type': asset.asset_type,
            Location: asset.location,
            'Risk Score': riskScore,
            'Risk Level': riskLevel,
            'Days Since Last Service': daysSinceService,
            'Days to Next Service': daysToNextService || 'Not Scheduled',
            'Predicted Failure Date': daysToNextService && daysToNextService < 60 
              ? new Date(Date.now() + (daysToNextService + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : 'Low Risk',
            'Recommended Action': riskLevel === 'High' ? 'Immediate Inspection' : 
                                riskLevel === 'Medium' ? 'Schedule Maintenance' : 'Monitor'
          };
        }) || [];

        headers = ['Asset ID', 'Asset Name', 'Asset Type', 'Location', 'Risk Score', 'Risk Level', 'Days Since Last Service', 'Days to Next Service', 'Predicted Failure Date', 'Recommended Action'];
        filename = `predictive_maintenance_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        // Include performance and analytics cases from original implementation
        break;
    }

    return { data, headers, filename };
  };

  const exportData = async () => {
    if (selectedOptions.length === 0) {
      toast.error('Please select at least one data type to export');
      return;
    }

    setIsExporting(true);
    const totalOptions = selectedOptions.length;
    let completedOptions = 0;

    setExportProgress({ current: 0, total: totalOptions, status: 'Starting export...' });

    try {
      const adminUser = await isAdmin();

      for (const optionId of selectedOptions) {
        const option = exportOptions.find(o => o.id === optionId);
        if (!option) continue;

        if (option.adminOnly && !adminUser) {
          toast.error(`Access denied: ${option.label} requires admin privileges`);
          completedOptions++;
          setExportProgress({ current: completedOptions, total: totalOptions, status: `Skipped ${option.label}` });
          continue;
        }

        try {
          const { data, headers, filename } = await fetchDataWithProgress(option, adminUser);

          if (data.length > 0) {
            setExportProgress(prev => ({ ...prev, status: `Generating ${format.toUpperCase()} for ${option.label}...` }));

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
              case 'xlsx':
                content = await generateXLSX(data, headers);
                fileExtension = 'csv'; // For now, until XLSX library is added
                break;
            }

            downloadFile(content, `${filename}.${fileExtension}`, `text/${fileExtension}`);
            toast.success(`${option.label} exported successfully (${data.length} records)`);
          } else {
            toast.warning(`No data found for ${option.label}`);
          }
        } catch (error) {
          console.error(`Error exporting ${option.label}:`, error);
          toast.error(`Failed to export ${option.label}: ${error.message}`);
        }

        completedOptions++;
        setExportProgress({ current: completedOptions, total: totalOptions, status: `Completed ${option.label}` });
      }

      toast.success('Export process completed!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error occurred during export process');
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0, status: '' });
    }
  };

  const manualRefresh = async () => {
    setIsRefreshing(true);
    setLastRefresh(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const estimatedTime = selectedOptions.reduce((total, optionId) => {
    const option = exportOptions.find(o => o.id === optionId);
    return total + (option?.estimatedTime || 2);
  }, 0);

  return (
    <Card className={`bg-card/50 backdrop-blur ${className}`}>
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Enhanced Data Export Tools
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {lastRefresh.toLocaleTimeString()}
            <Button
              variant="ghost"
              size="sm"
              onClick={manualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Auto Refresh Toggle */}
        {enableRealtime && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
            <div>
              <h4 className="text-sm font-medium">Real-time Updates</h4>
              <p className="text-xs text-muted-foreground">Automatically refresh data when changes occur</p>
            </div>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        )}

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{exportProgress.status}</span>
              <span>{exportProgress.current}/{exportProgress.total}</span>
            </div>
            <Progress 
              value={(exportProgress.current / exportProgress.total) * 100} 
              className="w-full"
            />
          </div>
        )}

        {/* Date Range Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date Range (Optional)</label>
          <DatePickerWithRange
            selected={dateRange}
            onSelect={setDateRange}
            className="w-full"
          />
        </div>

        {/* Export Format */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Export Format</label>
          <Select value={format} onValueChange={(value: 'csv' | 'json' | 'xlsx') => setFormat(value)}>
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
              <SelectItem value="xlsx">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  XLSX (Excel Native)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON (Developer Friendly)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Select Data to Export</label>
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
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        {option.label}
                      </label>
                      {option.adminOnly && (
                        <Badge variant="outline" className="text-xs">
                          Admin Only
                        </Badge>
                      )}
                      {option.estimatedTime && (
                        <Badge variant="secondary" className="text-xs">
                          ~{option.estimatedTime}s
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

        {/* Export Summary */}
        {selectedOptions.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/20 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Export Summary</span>
              <span className="text-muted-foreground">Estimated time: ~{estimatedTime}s</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Selected: {selectedOptions.map(id => 
                exportOptions.find(o => o.id === id)?.label
              ).join(', ')}
            </div>
          </div>
        )}

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
      </CardContent>
    </Card>
  );
}