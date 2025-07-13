import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Lock, Clock, AlertTriangle, Activity, Key, UserCheck, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const SecuritySettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Authentication Settings
    requireEmailVerification: true,
    enableTwoFactor: false,
    sessionTimeout: 480, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
    
    // Access Control
    enableRoleBasedAccess: true,
    requireApprovalForNewUsers: true,
    defaultUserRole: 'tenant_manager',
    allowGuestAccess: false,
    
    // Security Policies
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    passwordExpiry: 90, // days
    preventPasswordReuse: 3,
    
    // Audit & Monitoring
    enableAuditLogs: true,
    logFailedAttempts: true,
    alertOnSuspiciousActivity: true,
    enableRealTimeMonitoring: true
  });

  const { toast } = useToast();

  const securityMetrics = {
    activeUsers: 127,
    failedLogins: 8,
    suspiciousActivities: 2,
    lastSecurityScan: '2024-01-13 14:30',
    systemHealth: 98.5
  };

  const recentSecurityEvents = [
    {
      id: 1,
      type: 'warning',
      event: 'Multiple failed login attempts detected',
      user: 'john.doe@example.com',
      timestamp: '2024-01-13 15:45:22',
      severity: 'medium'
    },
    {
      id: 2,
      type: 'info',
      event: 'New user registration approved',
      user: 'jane.smith@example.com',
      timestamp: '2024-01-13 14:20:15',
      severity: 'low'
    },
    {
      id: 3,
      type: 'success',
      event: 'Password policy updated',
      user: 'admin@example.com',
      timestamp: '2024-01-13 13:10:08',
      severity: 'low'
    }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Security settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save security settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventBadge = (severity: string) => {
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500'
    };
    return (
      <Badge className={`${colors[severity as keyof typeof colors]} text-white`}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getEventIcon = (type: string) => {
    const icons = {
      warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      info: <Activity className="h-4 w-4 text-blue-500" />,
      success: <UserCheck className="h-4 w-4 text-green-500" />
    };
    return icons[type as keyof typeof icons] || <Activity className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Settings</h2>
          <p className="text-muted-foreground">Configure security policies and monitoring</p>
        </div>
        <Button onClick={saveSettings} disabled={loading} className="flex items-center gap-2">
          <Settings size={16} />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{securityMetrics.failedLogins}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{securityMetrics.suspiciousActivities}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{securityMetrics.systemHealth}%</div>
            <p className="text-xs text-muted-foreground">Overall security score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="authentication" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="authentication" className="data-[state=active]:bg-primary">
            Authentication
          </TabsTrigger>
          <TabsTrigger value="access" className="data-[state=active]:bg-primary">
            Access Control
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-primary">
            Security Policies
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary">
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Settings
              </CardTitle>
              <CardDescription>
                Configure authentication requirements and session management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify their email before accessing the system
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => handleSettingChange('requireEmailVerification', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require additional verification for enhanced security
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableTwoFactor}
                    onCheckedChange={(checked) => handleSettingChange('enableTwoFactor', checked)}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Account Lockout Duration (minutes)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={settings.lockoutDuration}
                    onChange={(e) => handleSettingChange('lockoutDuration', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Access Control Settings
              </CardTitle>
              <CardDescription>
                Manage user access, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Role-Based Access Control</Label>
                    <p className="text-sm text-muted-foreground">
                      Control access based on user roles and permissions
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableRoleBasedAccess}
                    onCheckedChange={(checked) => handleSettingChange('enableRoleBasedAccess', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require Approval for New Users</Label>
                    <p className="text-sm text-muted-foreground">
                      New user registrations must be approved by administrators
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireApprovalForNewUsers}
                    onCheckedChange={(checked) => handleSettingChange('requireApprovalForNewUsers', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="defaultRole">Default User Role</Label>
                  <Select
                    value={settings.defaultUserRole}
                    onValueChange={(value) => handleSettingChange('defaultUserRole', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                      <SelectItem value="field_staff">Field Staff</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Allow Guest Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow limited access without authentication
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowGuestAccess}
                    onCheckedChange={(checked) => handleSettingChange('allowGuestAccess', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password & Security Policies
              </CardTitle>
              <CardDescription>
                Configure password requirements and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => handleSettingChange('passwordExpiry', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require Special Characters</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must include special characters (!@#$%^&*)
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireSpecialChars}
                    onCheckedChange={(checked) => handleSettingChange('requireSpecialChars', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require Numbers</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must include at least one number
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireNumbers}
                    onCheckedChange={(checked) => handleSettingChange('requireNumbers', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preventPasswordReuse">Prevent Password Reuse (last N passwords)</Label>
                  <Input
                    id="preventPasswordReuse"
                    type="number"
                    value={settings.preventPasswordReuse}
                    onChange={(e) => handleSettingChange('preventPasswordReuse', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Monitoring Settings
                </CardTitle>
                <CardDescription>
                  Configure security monitoring and alerting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Audit Logs</Label>
                    <p className="text-sm text-muted-foreground">
                      Track all user actions and system events
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableAuditLogs}
                    onCheckedChange={(checked) => handleSettingChange('enableAuditLogs', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Log Failed Login Attempts</Label>
                    <p className="text-sm text-muted-foreground">
                      Record unsuccessful authentication attempts
                    </p>
                  </div>
                  <Switch
                    checked={settings.logFailedAttempts}
                    onCheckedChange={(checked) => handleSettingChange('logFailedAttempts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Alert on Suspicious Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications for potential security threats
                    </p>
                  </div>
                  <Switch
                    checked={settings.alertOnSuspiciousActivity}
                    onCheckedChange={(checked) => handleSettingChange('alertOnSuspiciousActivity', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Real-time Monitoring</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable real-time security event monitoring
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableRealTimeMonitoring}
                    onCheckedChange={(checked) => handleSettingChange('enableRealTimeMonitoring', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>
                  Latest security-related activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSecurityEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{event.event}</p>
                          {getEventBadge(event.severity)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.user} • {event.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecuritySettings;