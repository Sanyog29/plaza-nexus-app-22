
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Download, 
  FileText, 
  Database, 
  Filter,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { extractCategoryName } from '@/utils/categoryUtils';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExportConfig {
  type: 'maintenance_requests' | 'analytics' | 'users' | 'assets';
  format: 'csv' | 'json' | 'pdf';
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  filters: {
    category?: string;
    status?: string;
    priority?: string;
    department?: string;
  };
}

const UnifiedDataExportTools: React.FC = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [config, setConfig] = useState<ExportConfig>({
    type: 'maintenance_requests',
    format: 'csv',
    dateRange: { from: undefined, to: undefined },
    filters: {}
  });

  const exportData = async () => {
    if (!user || (!isAdmin && !isStaff)) {
      toast({
        title: "Access Denied",
        description: "Only staff and administrators can export data",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setExportProgress(0);

    try {
      let data: any[] = [];
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Fetch data based on export type
      switch (config.type) {
        case 'maintenance_requests':
          const { data: requests } = await supabase
            .from('maintenance_requests')
            .select(`
              *,
              main_categories(name, icon),
              profiles!maintenance_requests_reported_by_fkey(first_name, last_name, email),
              profiles!maintenance_requests_assigned_to_fkey(first_name, last_name, email)
            `)
            .gte('created_at', config.dateRange.from?.toISOString() || '2020-01-01')
            .lte('created_at', config.dateRange.to?.toISOString() || new Date().toISOString());
          
          data = requests?.map(req => ({
            ...req,
            category_name: extractCategoryName(req.main_categories),
            reporter_name: req.profiles ? 
              `${req.profiles.first_name || ''} ${req.profiles.last_name || ''}`.trim() || req.profiles.email :
              'Unknown',
            assignee_name: req.profiles ? 
              `${req.profiles.first_name || ''} ${req.profiles.last_name || ''}`.trim() || req.profiles.email :
              'Unassigned'
          })) || [];
          break;

        case 'analytics':
          const { data: analytics } = await supabase
            .from('analytics_summaries')
            .select('*')
            .gte('summary_date', config.dateRange.from?.toISOString() || '2020-01-01')
            .lte('summary_date', config.dateRange.to?.toISOString() || new Date().toISOString());
          data = analytics || [];
          break;

        case 'users':
          if (!isAdmin) {
            throw new Error('Only administrators can export user data');
          }
          const { data: users } = await supabase
            .from('profiles')
            .select('*');
          data = users || [];
          break;

        case 'assets':
          const { data: assets } = await supabase
            .from('assets')
            .select('*');
          data = assets || [];
          break;

        default:
          throw new Error('Invalid export type');
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      // Generate and download file
      const fileName = `${config.type}_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.${config.format}`;
      
      if (config.format === 'csv') {
        downloadCSV(data, fileName);
      } else if (config.format === 'json') {
        downloadJSON(data, fileName);
      }

      toast({
        title: "Export Complete",
        description: `Successfully exported ${data.length} records`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setExportProgress(0);
    }
  };

  const downloadCSV = (data: any[], fileName: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const downloadJSON = (data: any[], fileName: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  if (!isAdmin && !isStaff) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            Data export tools are only available to staff and administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Export Tools</h1>
        <p className="text-muted-foreground">
          Export system data in various formats for analysis and reporting
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
          <CardDescription>Configure your data export settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Type</label>
              <Select
                value={config.type}
                onValueChange={(value) => setConfig(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance_requests">Maintenance Requests</SelectItem>
                  <SelectItem value="analytics">Analytics Data</SelectItem>
                  {isAdmin && <SelectItem value="users">User Data</SelectItem>}
                  <SelectItem value="assets">Asset Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select
                value={config.format}
                onValueChange={(value) => setConfig(prev => ({ ...prev, format: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !config.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.from ? format(config.dateRange.from, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.from}
                    onSelect={(date) => setConfig(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, from: date } 
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !config.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.to ? format(config.dateRange.to, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.to}
                    onSelect={(date) => setConfig(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, to: date } 
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Export Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Export Progress</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} />
            </div>
          )}

          {/* Export Button */}
          <Button 
            onClick={exportData} 
            disabled={loading}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {loading ? 'Exporting...' : 'Export Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle>Export Guidelines</CardTitle>
          <CardDescription>Important information about data exports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Data Privacy</h4>
                <p className="text-sm text-muted-foreground">
                  Exported data contains sensitive information. Handle according to privacy policies.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Export Limits</h4>
                <p className="text-sm text-muted-foreground">
                  Large datasets may take several minutes to process. Maximum 10,000 records per export.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium">File Formats</h4>
                <p className="text-sm text-muted-foreground">
                  CSV files are recommended for spreadsheet analysis. JSON for technical integrations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedDataExportTools;
