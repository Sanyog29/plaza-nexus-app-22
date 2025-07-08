import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { useSystemSettings, SystemConfig } from '@/hooks/useSystemSettings';
import { 
  Settings, 
  Shield, 
  Database, 
  Mail, 
  Bell, 
  Clock, 
  Server,
  Key,
  FileText,
  Users,
  AlertTriangle,
  Save,
  Trash2
} from 'lucide-react';

const SystemConfigPage = () => {
  const { isAdmin } = useAuth();
  const { config, isLoading, updateConfig, saveSection } = useSystemSettings();
  const [activeTab, setActiveTab] = useState('maintenance');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
            <p className="text-muted-foreground">System configuration requires administrator access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async (section: keyof SystemConfig) => {
    await saveSection(section);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            System Configuration
          </h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and administrative controls
          </p>
        </div>
        <Badge variant="destructive" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Admin Only
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5" />
                Maintenance Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultSla">Default SLA Hours</Label>
                  <Input
                    id="defaultSla"
                    type="number"
                    value={config.maintenance.defaultSlaHours}
                    onChange={(e) => updateConfig('maintenance', 'defaultSlaHours', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">Default SLA time for new requests</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notificationEmail">Notification Email</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={config.maintenance.notificationEmail}
                    onChange={(e) => updateConfig('maintenance', 'notificationEmail', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Email for system notifications</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Assignment</Label>
                    <p className="text-sm text-muted-foreground">Automatically assign requests to available staff</p>
                  </div>
                  <Switch
                    checked={config.maintenance.autoAssignment}
                    onCheckedChange={(checked) => updateConfig('maintenance', 'autoAssignment', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Escalation System</Label>
                    <p className="text-sm text-muted-foreground">Enable automatic escalation for overdue requests</p>
                  </div>
                  <Switch
                    checked={config.maintenance.escalationEnabled}
                    onCheckedChange={(checked) => updateConfig('maintenance', 'escalationEnabled', checked)}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('maintenance')} disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Maintenance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Password Change</Label>
                    <p className="text-sm text-muted-foreground">Force users to change password on first login</p>
                  </div>
                  <Switch
                    checked={config.security.requirePasswordChange}
                    onCheckedChange={(checked) => updateConfig('security', 'requirePasswordChange', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Enable 2FA for admin accounts</p>
                  </div>
                  <Switch
                    checked={config.security.twoFactorEnabled}
                    onCheckedChange={(checked) => updateConfig('security', 'twoFactorEnabled', checked)}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('security')} disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="h-5 w-5" />
                Notification Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="alertThreshold">Alert Threshold (number of overdue requests)</Label>
                <Input
                  id="alertThreshold"
                  type="number"
                  value={config.notifications.alertThreshold}
                  onChange={(e) => updateConfig('notifications', 'alertThreshold', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email alerts for critical events</p>
                  </div>
                  <Switch
                    checked={config.notifications.emailEnabled}
                    onCheckedChange={(checked) => updateConfig('notifications', 'emailEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send SMS for urgent alerts</p>
                  </div>
                  <Switch
                    checked={config.notifications.smsEnabled}
                    onCheckedChange={(checked) => updateConfig('notifications', 'smsEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Browser and mobile push notifications</p>
                  </div>
                  <Switch
                    checked={config.notifications.pushEnabled}
                    onCheckedChange={(checked) => updateConfig('notifications', 'pushEnabled', checked)}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('notifications')} disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Server className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="backupFreq">Backup Frequency</Label>
                  <Select 
                    value={config.system.backupFrequency} 
                    onValueChange={(value) => updateConfig('system', 'backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logRetention">Log Retention (days)</Label>
                  <Input
                    id="logRetention"
                    type="number"
                    value={config.system.logRetention}
                    onChange={(e) => updateConfig('system', 'logRetention', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Put system in maintenance mode</p>
                  </div>
                  <Switch
                    checked={config.system.maintenanceMode}
                    onCheckedChange={(checked) => updateConfig('system', 'maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable detailed logging for debugging</p>
                  </div>
                  <Switch
                    checked={config.system.debugMode}
                    onCheckedChange={(checked) => updateConfig('system', 'debugMode', checked)}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('system')} disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save System Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemConfigPage;