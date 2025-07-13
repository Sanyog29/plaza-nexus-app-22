import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Users,
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

interface EmailCampaign {
  id: string;
  name: string;
  template_id: string;
  recipients: number;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  status: 'draft' | 'sending' | 'sent' | 'paused';
  created_at: string;
}

export function EmailIntegration() {
  const { user } = useAuth();
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Test Email from Plaza Nexus');
  const [testContent, setTestContent] = useState('This is a test email to verify email configuration.');
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');

  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Maintenance Request Notification',
      subject: 'New Maintenance Request: {{title}}',
      content: 'A new maintenance request has been submitted.\n\nTitle: {{title}}\nLocation: {{location}}\nPriority: {{priority}}\n\nPlease review and assign appropriate staff.',
      variables: ['title', 'location', 'priority']
    },
    {
      id: '2',
      name: 'Request Completion Notice',
      subject: 'Maintenance Request Completed: {{title}}',
      content: 'Your maintenance request has been completed.\n\nTitle: {{title}}\nCompleted by: {{staff_name}}\nCompletion time: {{completion_time}}\n\nThank you for your patience.',
      variables: ['title', 'staff_name', 'completion_time']
    },
    {
      id: '3',
      name: 'SLA Breach Alert',
      subject: 'URGENT: SLA Breach Alert - {{request_id}}',
      content: 'ATTENTION: A maintenance request has exceeded its SLA deadline.\n\nRequest ID: {{request_id}}\nTitle: {{title}}\nMinutes Overdue: {{overdue_minutes}}\n\nImmediate action required.',
      variables: ['request_id', 'title', 'overdue_minutes']
    },
    {
      id: '4',
      name: 'User Welcome Email',
      subject: 'Welcome to Plaza Nexus',
      content: 'Welcome to Plaza Nexus, {{first_name}}!\n\nYour account has been approved and you can now access the system.\n\nUsername: {{email}}\nRole: {{role}}\n\nGet started by logging in and exploring the features.',
      variables: ['first_name', 'email', 'role']
    }
  ]);

  const [campaigns] = useState<EmailCampaign[]>([
    {
      id: '1',
      name: 'Weekly Maintenance Summary',
      template_id: '1',
      recipients: 45,
      sent_count: 45,
      open_rate: 78.2,
      click_rate: 12.4,
      status: 'sent',
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'System Upgrade Notification',
      template_id: '4',
      recipients: 120,
      sent_count: 120,
      open_rate: 92.1,
      click_rate: 34.7,
      status: 'sent',
      created_at: '2024-01-14T15:30:00Z'
    }
  ]);

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      // Call edge function to test email configuration
      const { data, error } = await supabase.functions.invoke('test-email-config', {
        body: emailConfig
      });

      if (error) throw error;

      setConnectionStatus('connected');
      toast({
        title: "Connection Successful",
        description: "Email configuration is working correctly"
      });
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "Please check your email configuration",
        variant: "destructive"
      });
    }
  };

  const sendTestEmail = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: testSubject,
          content: testContent,
          template: 'simple'
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Email sent successfully to ${testEmail}`
      });
      setTestEmail('');
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description: "Please check your configuration and try again",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: EmailCampaign['status']) => {
    const variants = {
      draft: 'secondary',
      sending: 'default',
      sent: 'default',
      paused: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Integration</h2>
          <p className="text-muted-foreground">
            Configure email settings and manage email campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          )}
          {connectionStatus === 'error' && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Error
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SMTP Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  SMTP Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailConfig.smtpHost}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">Port</Label>
                    <Input
                      id="smtpPort"
                      value={emailConfig.smtpPort}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPort: e.target.value }))}
                      placeholder="587"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="smtpUser">Username</Label>
                  <Input
                    id="smtpUser"
                    value={emailConfig.smtpUser}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpUser: e.target.value }))}
                    placeholder="your-email@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="smtpPassword">Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailConfig.smtpPassword}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    placeholder="App password or SMTP password"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      value={emailConfig.fromEmail}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                      placeholder="noreply@plazanexus.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, fromName: e.target.value }))}
                      placeholder="Plaza Nexus"
                    />
                  </div>
                </div>

                <Button 
                  onClick={testConnection}
                  disabled={connectionStatus === 'testing'}
                  className="w-full"
                >
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>
              </CardContent>
            </Card>

            {/* Test Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Send Test Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testEmail">To Email</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="testSubject">Subject</Label>
                  <Input
                    id="testSubject"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="testContent">Content</Label>
                  <Textarea
                    id="testContent"
                    value={testContent}
                    onChange={(e) => setTestContent(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button 
                  onClick={sendTestEmail}
                  disabled={sending || !testEmail || connectionStatus !== 'connected'}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Test Email'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Templates</h3>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Subject: {template.subject}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Content Preview</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                        {template.content}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Variables</Label>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Campaigns</h3>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{campaign.name}</h4>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.recipients} recipients
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{campaign.open_rate}%</div>
                        <div className="text-xs text-muted-foreground">Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{campaign.click_rate}%</div>
                        <div className="text-xs text-muted-foreground">Click Rate</div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                    <p className="text-2xl font-bold">2,847</p>
                  </div>
                  <Mail className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Open Rate</p>
                    <p className="text-2xl font-bold">82.4%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">+5.2%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Click Rate</p>
                    <p className="text-2xl font-bold">18.7%</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">+3.1%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Templates</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-muted-foreground">4 auto-triggered</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}