import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Clock, Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ScheduledReport {
  id: string;
  report_name: string;
  report_type: string;
  schedule_config: any;
  recipients: any;
  export_formats: any;
  is_active: boolean;
  next_generation_at: string | null;
}

export const ReportScheduler: React.FC = () => {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    report_name: '',
    report_type: 'daily_operations',
    schedule: 'daily',
    time: '08:00',
    recipients: '',
    formats: ['pdf']
  });

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduledReports(data || []);
    } catch (error: any) {
      console.error('Error fetching scheduled reports:', error);
      toast({
        title: "Error loading scheduled reports",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCronExpression = (schedule: string, time: string) => {
    const [hour, minute] = time.split(':');
    switch (schedule) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * 1`; // Monday
      case 'monthly':
        return `${minute} ${hour} 1 * *`; // 1st of month
      default:
        return `${minute} ${hour} * * *`;
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .insert({
          report_name: formData.report_name,
          report_type: formData.report_type,
          schedule_config: {
            cron: getCronExpression(formData.schedule, formData.time),
            timezone: 'Asia/Kolkata'
          },
          filter_config: { date_range: formData.schedule },
          recipients: {
            emails: formData.recipients.split(',').map(e => e.trim()).filter(Boolean)
          },
          export_formats: formData.formats
        });

      if (error) throw error;

      toast({
        title: "Schedule Created",
        description: `Report "${formData.report_name}" has been scheduled successfully.`
      });

      setShowForm(false);
      setFormData({
        report_name: '',
        report_type: 'daily_operations',
        schedule: 'daily',
        time: '08:00',
        recipients: '',
        formats: ['pdf']
      });
      fetchScheduledReports();
    } catch (error: any) {
      toast({
        title: "Failed to create schedule",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: currentStatus ? "Schedule Paused" : "Schedule Activated",
        description: `Report schedule has been ${currentStatus ? 'paused' : 'activated'}.`
      });

      fetchScheduledReports();
    } catch (error: any) {
      toast({
        title: "Error updating schedule",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Schedule Deleted",
        description: "The scheduled report has been removed."
      });

      fetchScheduledReports();
    } catch (error: any) {
      toast({
        title: "Error deleting schedule",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading scheduled reports...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>Automate report generation and delivery</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              New Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">Create Report Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Name</Label>
                    <Input
                      placeholder="Daily Maintenance Summary"
                      value={formData.report_name}
                      onChange={(e) => setFormData({ ...formData, report_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily_operations">Daily Operations</SelectItem>
                        <SelectItem value="weekly_performance">Weekly Performance</SelectItem>
                        <SelectItem value="monthly_executive">Monthly Executive</SelectItem>
                        <SelectItem value="sla_compliance">SLA Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={formData.schedule} onValueChange={(value) => setFormData({ ...formData, schedule: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly (Monday)</SelectItem>
                        <SelectItem value="monthly">Monthly (1st)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email Recipients (comma-separated)</Label>
                  <Input
                    placeholder="admin@example.com, manager@example.com"
                    value={formData.recipients}
                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateSchedule} disabled={!formData.report_name}>
                    Create Schedule
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduled Reports List */}
          <div className="space-y-3">
            {scheduledReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No scheduled reports yet</p>
                <p className="text-xs mt-1">Create your first automated report schedule</p>
              </div>
            ) : (
              scheduledReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{report.report_name}</h4>
                          <Badge variant={report.is_active ? 'default' : 'secondary'}>
                            {report.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Type: {report.report_type.replace('_', ' ')} • Formats: {report.export_formats.join(', ').toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Recipients: {Array.isArray(report.recipients?.emails) ? report.recipients.emails.join(', ') : 'No recipients'}
                        </p>
                        {report.next_generation_at && (
                          <p className="text-xs text-primary mt-1">
                            Next run: {format(new Date(report.next_generation_at), 'PPP p')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={report.is_active}
                          onCheckedChange={() => handleToggleActive(report.id, report.is_active)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};