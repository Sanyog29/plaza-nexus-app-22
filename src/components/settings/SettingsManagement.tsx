import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Users, 
  Clock,
  Mail,
  Smartphone,
  Key,
  Eye,
  Download,
  Upload,
  Trash2,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SettingsManagement() {
  const { toast } = useToast();
  
  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    maintenanceAlerts: true,
    securityAlerts: true,
    systemUpdates: false,
    weeklyReports: true,
    notificationFrequency: 'immediate'
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '60',
    passwordExpiry: '90',
    loginAttempts: '5',
    requireStrongPassword: true,
    autoLogout: true
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    systemName: 'Facility Management System',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    language: 'English',
    autoBackup: true,
    backupFrequency: 'daily',
    maintenanceMode: false,
    debugMode: false
  });

  // Theme Settings
  const [themeSettings, setThemeSettings] = useState({
    theme: 'system',
    primaryColor: 'blue',
    compactMode: false,
    animationsEnabled: true,
    fontSize: 'medium'
  });

  const handleSaveNotifications = () => {
    toast({
      title: 'Settings Saved',
      description: 'Notification preferences have been updated'
    });
  };

  const handleSaveSecurity = () => {
    toast({
      title: 'Settings Saved',
      description: 'Security settings have been updated'
    });
  };

  const handleSaveSystem = () => {
    toast({
      title: 'Settings Saved',
      description: 'System settings have been updated'
    });
  };

  const handleSaveTheme = () => {
    toast({
      title: 'Settings Saved',
      description: 'Theme settings have been updated'
    });
  };

  const handleExportSettings = () => {
    toast({
      title: 'Export Started',
      description: 'Settings will be downloaded shortly'
    });
  };

  const handleImportSettings = () => {
    toast({
      title: 'Import Successful',
      description: 'Settings have been imported and applied'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">Manage your system preferences and configurations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleImportSettings}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <h4 className="font-semibold">Notification Channels</h4>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, smsNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, pushNotifications: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="font-semibold">Notification Types</h4>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Alerts</Label>
                      <p className="text-sm text-muted-foreground">Alerts for maintenance requests and updates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.maintenanceAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, maintenanceAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Critical security notifications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.securityAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, securityAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Updates</Label>
                      <p className="text-sm text-muted-foreground">Notifications about system updates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, systemUpdates: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, weeklyReports: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Frequency */}
              <div className="space-y-4">
                <h4 className="font-semibold">Notification Frequency</h4>
                <div className="space-y-2">
                  <Label>How often should we send notifications?</Label>
                  <Select
                    value={notificationSettings.notificationFrequency}
                    onValueChange={(value) => 
                      setNotificationSettings({ ...notificationSettings, notificationFrequency: value })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Manage authentication and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Authentication</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                      </div>
                      <Switch
                        checked={securitySettings.twoFactorAuth}
                        onCheckedChange={(checked) => 
                          setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Session Timeout (minutes)</Label>
                      <Input
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => 
                          setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                        type="number"
                        className="w-32"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password Expiry (days)</Label>
                      <Input
                        value={securitySettings.passwordExpiry}
                        onChange={(e) => 
                          setSecuritySettings({ ...securitySettings, passwordExpiry: e.target.value })}
                        type="number"
                        className="w-32"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Security Policies</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Max Login Attempts</Label>
                      <Input
                        value={securitySettings.loginAttempts}
                        onChange={(e) => 
                          setSecuritySettings({ ...securitySettings, loginAttempts: e.target.value })}
                        type="number"
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Require Strong Passwords</Label>
                        <p className="text-sm text-muted-foreground">Enforce complex password requirements</p>
                      </div>
                      <Switch
                        checked={securitySettings.requireStrongPassword}
                        onCheckedChange={(checked) => 
                          setSecuritySettings({ ...securitySettings, requireStrongPassword: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Logout</Label>
                        <p className="text-sm text-muted-foreground">Automatically logout inactive users</p>
                      </div>
                      <Switch
                        checked={securitySettings.autoLogout}
                        onCheckedChange={(checked) => 
                          setSecuritySettings({ ...securitySettings, autoLogout: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSecurity}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Theme</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Color Theme</Label>
                      <Select
                        value={themeSettings.theme}
                        onValueChange={(value) => 
                          setThemeSettings({ ...themeSettings, theme: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <Select
                        value={themeSettings.primaryColor}
                        onValueChange={(value) => 
                          setThemeSettings({ ...themeSettings, primaryColor: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Layout</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">Reduce spacing and padding</p>
                      </div>
                      <Switch
                        checked={themeSettings.compactMode}
                        onCheckedChange={(checked) => 
                          setThemeSettings({ ...themeSettings, compactMode: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Animations</Label>
                        <p className="text-sm text-muted-foreground">Enable UI animations</p>
                      </div>
                      <Switch
                        checked={themeSettings.animationsEnabled}
                        onCheckedChange={(checked) => 
                          setThemeSettings({ ...themeSettings, animationsEnabled: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Select
                        value={themeSettings.fontSize}
                        onValueChange={(value) => 
                          setThemeSettings({ ...themeSettings, fontSize: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveTheme}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Appearance Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Manage system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">General</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>System Name</Label>
                      <Input
                        value={systemSettings.systemName}
                        onChange={(e) => 
                          setSystemSettings({ ...systemSettings, systemName: e.target.value })}
                        placeholder="Your System Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select
                        value={systemSettings.timezone}
                        onValueChange={(value) => 
                          setSystemSettings({ ...systemSettings, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">EST</SelectItem>
                          <SelectItem value="PST">PST</SelectItem>
                          <SelectItem value="GMT">GMT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select
                        value={systemSettings.dateFormat}
                        onValueChange={(value) => 
                          setSystemSettings({ ...systemSettings, dateFormat: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Maintenance</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Backup</Label>
                        <p className="text-sm text-muted-foreground">Automatically backup system data</p>
                      </div>
                      <Switch
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) => 
                          setSystemSettings({ ...systemSettings, autoBackup: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Backup Frequency</Label>
                      <Select
                        value={systemSettings.backupFrequency}
                        onValueChange={(value) => 
                          setSystemSettings({ ...systemSettings, backupFrequency: value })}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">Put system in maintenance mode</p>
                      </div>
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) => 
                          setSystemSettings({ ...systemSettings, maintenanceMode: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSystem}>
                  <Save className="h-4 w-4 mr-2" />
                  Save System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}