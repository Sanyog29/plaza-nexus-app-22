import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { AdminPermissionCheck } from '@/components/admin/AdminPermissionCheck';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { useProfile } from '@/hooks/useProfile';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Monitor, 
  Database,
  Mail,
  Smartphone,
  Palette,
  Zap,
  Globe,
  Server,
  Lock,
  UserCheck,
  Building,
  Save,
  RotateCcw
} from 'lucide-react';

interface UnifiedSettingsPageProps {}

export const UnifiedSettingsPage: React.FC<UnifiedSettingsPageProps> = () => {
  const { user, userRole, isAdmin } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);

  const handleAvatarUpdate = (url: string | null) => {
    if (profile) {
      updateProfile({ avatar_url: url });
    }
  };

  // Settings categories based on user role
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'appearance', label: 'Appearance', icon: Palette },
    ];

    if (userRole === 'field_staff' || userRole?.includes('staff')) {
      return [
        ...baseTabs,
        { id: 'mobile', label: 'Mobile Settings', icon: Smartphone },
        { id: 'tasks', label: 'Task Preferences', icon: Zap },
      ];
    }

    if (isAdmin || userRole === 'ops_supervisor') {
      return [
        ...baseTabs,
        { id: 'system', label: 'System Config', icon: Monitor },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'integrations', label: 'Integrations', icon: Globe },
        { id: 'database', label: 'Database', icon: Database },
        { id: 'users', label: 'User Management', icon: UserCheck },
        { id: 'building', label: 'Building Config', icon: Building },
      ];
    }

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  const handleSave = () => {
    // Implementation for saving settings
    setHasChanges(false);
  };

  const handleReset = () => {
    // Implementation for resetting settings
    setHasChanges(false);
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and system configuration
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading profile...</div>
                </div>
              ) : (
                <>
                  {/* Avatar Upload Section */}
                  <div className="flex flex-col items-center space-y-4 py-6 border-b border-border">
                    <AvatarUpload
                      currentAvatarUrl={profile?.avatar_url}
                      onAvatarUpdate={handleAvatarUpdate}
                      size="lg"
                    />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Upload a profile photo to personalize your account
                      </p>
                    </div>
                  </div>

                  {/* Settings Form Section */}
                  <div className="pt-4">
                    <SettingsForm />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive urgent notifications via SMS</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Layout</Label>
                    <p className="text-sm text-muted-foreground">Use a more compact interface layout</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sidebar Auto-collapse</Label>
                    <p className="text-sm text-muted-foreground">Automatically collapse sidebar on smaller screens</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile Settings (Staff only) */}
        {(userRole === 'field_staff' || userRole?.includes('staff')) && (
          <TabsContent value="mobile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Settings</CardTitle>
                <CardDescription>Configure mobile-specific preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Offline Mode</Label>
                      <p className="text-sm text-muted-foreground">Allow working without internet connection</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>GPS Tracking</Label>
                      <p className="text-sm text-muted-foreground">Enable location tracking for tasks</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-sync</Label>
                      <p className="text-sm text-muted-foreground">Automatically sync data when connected</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Admin/Supervisor only tabs */}
        {(isAdmin || userRole === 'ops_supervisor') && (
          <>
            {/* System Configuration */}
            <TabsContent value="system" className="space-y-6">
              <AdminPermissionCheck>
                <Card>
                  <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                    <CardDescription>Configure global system settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input id="orgName" placeholder="SS Plaza" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input id="timezone" placeholder="Asia/Kolkata" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Maintenance Mode</Label>
                          <p className="text-sm text-muted-foreground">Enable system-wide maintenance mode</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Debug Mode</Label>
                          <p className="text-sm text-muted-foreground">Enable enhanced logging and debugging</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AdminPermissionCheck>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <AdminPermissionCheck>
                <Card>
                  <CardHeader>
                    <CardTitle>Security Configuration</CardTitle>
                    <CardDescription>Manage security policies and access controls</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Session Timeout</Label>
                          <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Audit Logging</Label>
                          <p className="text-sm text-muted-foreground">Log all administrative actions</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AdminPermissionCheck>
            </TabsContent>

            {/* Database Settings */}
            <TabsContent value="database" className="space-y-6">
              <AdminPermissionCheck>
                <Card>
                  <CardHeader>
                    <CardTitle>Database Configuration</CardTitle>
                    <CardDescription>Manage database settings and backups</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-5 w-5 text-green-500" />
                          <span className="font-medium">Database Status</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Healthy
                        </Badge>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Server className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Last Backup</span>
                        </div>
                        <span className="text-sm text-muted-foreground">2 hours ago</span>
                      </Card>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto Backup</Label>
                          <p className="text-sm text-muted-foreground">Automatically backup database daily</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Performance Monitoring</Label>
                          <p className="text-sm text-muted-foreground">Monitor database performance metrics</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AdminPermissionCheck>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default UnifiedSettingsPage;