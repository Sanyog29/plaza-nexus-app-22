import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FileText, Download, Calendar, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ReportScheduler } from './ReportScheduler';
import { ReportHistory } from './ReportHistory';

type ReportType = 'daily_operations' | 'weekly_performance' | 'monthly_executive' | 'sla_compliance' | 'custom';
type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export const ComprehensiveReportGenerator: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('daily_operations');
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>(['pdf']);
  const [emailRecipients, setEmailRecipients] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTemplates = [
    {
      value: 'daily_operations',
      label: 'Daily Operations Report',
      description: 'Tickets created/closed today, SLA status, critical issues, staff attendance'
    },
    {
      value: 'weekly_performance',
      label: 'Weekly Performance Report',
      description: 'Week-over-week comparison, SLA trends, top technicians, resource utilization'
    },
    {
      value: 'monthly_executive',
      label: 'Monthly Executive Summary',
      description: 'High-level KPIs, cost analysis, efficiency metrics, strategic recommendations'
    },
    {
      value: 'sla_compliance',
      label: 'SLA Compliance Report',
      description: 'Detailed breach analysis, penalty calculations, compliance by category/priority'
    },
    {
      value: 'custom',
      label: 'Custom Report',
      description: 'Build your own report with selected metrics and filters'
    }
  ];

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);

      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          reportType,
          exportFormats,
          emailRecipients: emailRecipients.split(',').map(e => e.trim()).filter(Boolean),
          dateRange: {
            from: sevenDaysAgo.toISOString(),
            to: now.toISOString()
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Report Generated Successfully",
        description: `Your ${reportType.replace('_', ' ')} has been generated and ${emailRecipients ? 'sent to specified recipients' : 'is ready for download'}.`
      });

      // Trigger download if file URL is returned
      if (data?.fileUrl) {
        window.open(data.fileUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFormat = (format: ExportFormat) => {
    setExportFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const currentTemplate = reportTemplates.find(t => t.value === reportType);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Comprehensive Report
              </CardTitle>
              <CardDescription>
                Create detailed analytics reports with multiple export formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selection */}
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTemplates.map(template => (
                      <SelectItem key={template.value} value={template.value}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentTemplate && (
                  <p className="text-xs text-muted-foreground">{currentTemplate.description}</p>
                )}
              </div>

              {/* Export Format Selection */}
              <div className="space-y-3">
                <Label>Export Formats</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['pdf', 'excel', 'csv', 'json'] as ExportFormat[]).map(format => (
                    <div key={format} className="flex items-center space-x-2">
                      <Checkbox
                        id={format}
                        checked={exportFormats.includes(format)}
                        onCheckedChange={() => toggleFormat(format)}
                      />
                      <Label htmlFor={format} className="cursor-pointer uppercase text-xs">
                        {format}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Recipients */}
              <div className="space-y-2">
                <Label htmlFor="recipients" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Recipients (Optional)
                </Label>
                <Input
                  id="recipients"
                  placeholder="email1@example.com, email2@example.com"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple emails with commas. Leave blank to download only.
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating || exportFormats.length === 0}
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating Report...' : 'Generate Report Now'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <ReportScheduler />
        </TabsContent>

        <TabsContent value="history">
          <ReportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};