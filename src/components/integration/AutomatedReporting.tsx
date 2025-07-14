import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Users, 
  Mail,
  Play,
  Plus,
  Settings,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { useAdvancedReporting } from '@/hooks/useAdvancedReporting';
import { formatDistanceToNow } from 'date-fns';

interface ReportFormData {
  report_name: string;
  report_type: string;
  schedule_type: string;
  schedule_time: string;
  recipients: string[];
  include_kpis: boolean;
  include_trends: boolean;
  include_recommendations: boolean;
}

export const AutomatedReporting: React.FC = () => {
  const { 
    reports, 
    generations, 
    loading, 
    createReport, 
    generateReport 
  } = useAdvancedReporting();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    report_name: '',
    report_type: 'performance',
    schedule_type: 'weekly',
    schedule_time: '09:00',
    recipients: [],
    include_kpis: true,
    include_trends: true,
    include_recommendations: true
  });

  const handleCreateReport = async () => {
    try {
      await createReport({
        report_name: formData.report_name,
        report_type: formData.report_type,
        schedule_config: {
          type: formData.schedule_type,
          time: formData.schedule_time,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        recipients: formData.recipients
      });

      setIsCreateDialogOpen(false);
      setFormData({
        report_name: '',
        report_type: 'performance',
        schedule_type: 'weekly',
        schedule_time: '09:00',
        recipients: [],
        include_kpis: true,
        include_trends: true,
        include_recommendations: true
      });
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const handleManualGeneration = async (reportId: string) => {
    try {
      await generateReport(reportId);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'generating':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <TrendingUp className="h-4 w-4" />;
      case 'financial':
        return <BarChart3 className="h-4 w-4" />;
      case 'operational':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Automated Reporting</h2>
          <p className="text-muted-foreground">Create and manage automated business intelligence reports</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Automated Report</DialogTitle>
              <DialogDescription>
                Set up a new automated report with custom scheduling and recipients
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="report_name">Report Name</Label>
                <Input
                  id="report_name"
                  value={formData.report_name}
                  onChange={(e) => setFormData({ ...formData, report_name: e.target.value })}
                  placeholder="Weekly Performance Summary"
                />
              </div>

              <div>
                <Label htmlFor="report_type">Report Type</Label>
                <Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance Report</SelectItem>
                    <SelectItem value="financial">Financial Report</SelectItem>
                    <SelectItem value="operational">Operational Report</SelectItem>
                    <SelectItem value="executive">Executive Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule_type">Schedule</Label>
                  <Select value={formData.schedule_type} onValueChange={(value) => setFormData({ ...formData, schedule_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="schedule_time">Time</Label>
                  <Input
                    id="schedule_time"
                    type="time"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                <Textarea
                  id="recipients"
                  placeholder="admin@company.com, manager@company.com"
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                  })}
                />
              </div>

              <div className="space-y-3">
                <Label>Report Content</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Include KPIs</span>
                  <Switch 
                    checked={formData.include_kpis}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_kpis: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Include Trends</span>
                  <Switch 
                    checked={formData.include_trends}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_trends: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Include Recommendations</span>
                  <Switch 
                    checked={formData.include_recommendations}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_recommendations: checked })}
                  />
                </div>
              </div>

              <Button onClick={handleCreateReport} disabled={loading || !formData.report_name} className="w-full">
                Create Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="generations">Recent Generations</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(report.report_type)}
                      <CardTitle className="text-lg">{report.report_name}</CardTitle>
                    </div>
                    <Badge variant={report.is_active ? 'default' : 'secondary'}>
                      {report.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>
                    {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{report.schedule_config.type || 'Manual'}</span>
                    </div>
                    
                    {report.schedule_config.time && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{report.schedule_config.time}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{report.recipients.length} recipients</span>
                    </div>

                    {report.last_generated && (
                      <div className="text-xs text-muted-foreground">
                        Last generated {formatDistanceToNow(new Date(report.last_generated), { addSuffix: true })}
                      </div>
                    )}

                    <Button 
                      onClick={() => handleManualGeneration(report.id)}
                      disabled={loading}
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Generate Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Report Generations</CardTitle>
              <CardDescription>
                History of generated reports and download links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reports generated yet</p>
                  </div>
                ) : (
                  generations.map((generation) => (
                    <div key={generation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">
                            Report #{generation.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Generated {formatDistanceToNow(new Date(generation.generated_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(generation.generation_status) as any}>
                          {generation.generation_status}
                        </Badge>
                        {generation.file_url && generation.generation_status === 'completed' && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={generation.file_url} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};