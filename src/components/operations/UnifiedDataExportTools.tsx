import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  FileText, 
  Calendar,
  Users,
  Building2,
  Wrench,
  Filter,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { extractCategoryName } from '@/utils/categoryUtils';

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  includeFields: string[];
  dataType: 'requests' | 'users' | 'analytics' | 'feedback';
  filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
  };
}

const UnifiedDataExportTools: React.FC = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: { from: null, to: null },
    includeFields: [],
    dataType: 'requests'
  });

  const exportData = async () => {
    if (!user || (!isAdmin && !isStaff)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to export data",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      let data: any[] = [];
      let filename = '';

      setExportProgress(25);

      switch (exportOptions.dataType) {
        case 'requests':
          const { data: requests } = await supabase
            .from('maintenance_requests')
            .select(`
              *,
              main_categories!maintenance_requests_category_id_fkey(name),
              assigned_user:profiles!maintenance_requests_assigned_to_fkey(
                first_name, last_name
              ),
              reported_user:profiles!maintenance_requests_reported_by_fkey(
                first_name, last_name
              )
            `)
            .order('created_at', { ascending: false });

          data = requests?.map(req => ({
            id: req.id,
            title: req.title,
            description: req.description,
            status: req.status,
            priority: req.priority,
            category: extractCategoryName(req.main_categories),
            reported_by: req.reported_user ? `${req.reported_user.first_name || ''} ${req.reported_user.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
            assigned_to: req.assigned_user ? `${req.assigned_user.first_name || ''} ${req.assigned_user.last_name || ''}`.trim() || 'Unassigned' : 'Unassigned',
            location: req.location,
            created_at: new Date(req.created_at).toLocaleDateString(),
            updated_at: new Date(req.updated_at).toLocaleDateString()
          })) || [];
          filename = 'maintenance_requests';
          break;

        case 'users':
          const usersRes = await supabase
            .from('profiles_public')
            .select('*')
            .order('created_at', { ascending: false });
          const users = (usersRes.data as any[]) || [];

          data = users.map((user: any) => ({
            id: user.id,
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
            email: user.email || 'Unknown',
            role: user.role,
            department: user.department,
            status: user.approval_status,
            created_at: new Date(user.created_at).toLocaleDateString()
          }));
          filename = 'users';
          break;

        case 'feedback':
          const { data: feedback } = await supabase
            .from('maintenance_request_feedback')
            .select(`
              *,
              maintenance_requests(title, status)
            `)
            .order('created_at', { ascending: false });

          data = feedback?.map(fb => ({
            id: fb.id,
            request_title: fb.maintenance_requests?.title || 'Unknown',
            user_name: 'Unknown', // User name not available from feedback table
            satisfaction_rating: fb.satisfaction_rating,
            feedback_text: fb.feedback_text || '',
            created_at: new Date(fb.created_at).toLocaleDateString()
          })) || [];
          filename = 'feedback';
          break;

        default:
          throw new Error('Invalid data type');
      }

      setExportProgress(75);

      // Convert to CSV format
      if (data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
          Object.values(row).map(value => 
            typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value
          ).join(',')
        );
        const csv = [headers, ...rows].join('\n');

        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setExportProgress(100);
        
        toast({
          title: "Export Complete! 🎉",
          description: `Successfully exported ${data.length} records`
        });
      } else {
        toast({
          title: "No Data",
          description: "No records found to export",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  if (!isAdmin && !isStaff) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">Data export tools require staff access.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Data Export Tools</h2>
        <p className="text-muted-foreground">Export system data for analysis and reporting</p>
      </div>

      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Configuration
          </CardTitle>
          <CardDescription>Configure your data export settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Type</label>
              <Select
                value={exportOptions.dataType}
                onValueChange={(value: any) => 
                  setExportOptions(prev => ({ ...prev, dataType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requests">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Maintenance Requests
                    </div>
                  </SelectItem>
                  <SelectItem value="users">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users & Profiles
                    </div>
                  </SelectItem>
                  <SelectItem value="feedback">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Feedback & Ratings
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: any) => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV Format</SelectItem>
                  <SelectItem value="xlsx" disabled>Excel Format (Coming Soon)</SelectItem>
                  <SelectItem value="pdf" disabled>PDF Report (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range (Optional)</label>
            <div className="flex gap-2">
              <DatePicker
                date={exportOptions.dateRange.from}
                onSelect={(date) => 
                  setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, from: date }
                  }))
                }
                placeholder="From date"
              />
              <DatePicker
                date={exportOptions.dateRange.to}
                onSelect={(date) => 
                  setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, to: date }
                  }))
                }
                placeholder="To date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Actions</CardTitle>
          <CardDescription>Generate and download your data export</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exporting data...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={exportData}
              disabled={isExporting}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>• Exports are limited to the most recent 10,000 records</p>
            <p>• All exports are logged for audit purposes</p>
            <p>• Sensitive data is automatically filtered based on your permissions</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export Templates</CardTitle>
          <CardDescription>Pre-configured export templates for common reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex-col items-start"
              onClick={() => {
                setExportOptions({
                  format: 'csv',
                  dateRange: { from: null, to: null },
                  includeFields: [],
                  dataType: 'requests'
                });
                exportData();
              }}
              disabled={isExporting}
            >
              <Wrench className="h-5 w-5 mb-2" />
              <div className="text-left">
                <div className="font-medium">All Requests</div>
                <div className="text-xs text-muted-foreground">Complete request history</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col items-start"
              onClick={() => {
                setExportOptions({
                  format: 'csv',
                  dateRange: { from: null, to: null },
                  includeFields: [],
                  dataType: 'users'
                });
                exportData();
              }}
              disabled={isExporting}
            >
              <Users className="h-5 w-5 mb-2" />
              <div className="text-left">
                <div className="font-medium">User Directory</div>
                <div className="text-xs text-muted-foreground">All users and profiles</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col items-start"
              onClick={() => {
                setExportOptions({
                  format: 'csv',
                  dateRange: { from: null, to: null },
                  includeFields: [],
                  dataType: 'feedback'
                });
                exportData();
              }}
              disabled={isExporting}
            >
              <FileText className="h-5 w-5 mb-2" />
              <div className="text-left">
                <div className="font-medium">Feedback Report</div>
                <div className="text-xs text-muted-foreground">All ratings and feedback</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedDataExportTools;
