import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Settings, Bell, User, Shield, Save, Clock } from 'lucide-react';

interface StaffProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  department?: string;
  shift_start?: string;
  shift_end?: string;
  skills?: string[];
  bio?: string;
}

interface NotificationSettings {
  email_alerts: boolean;
  sms_alerts: boolean;
  urgent_only: boolean;
  maintenance_updates: boolean;
  system_alerts: boolean;
}

const StaffSettingsPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_alerts: true,
    sms_alerts: false,
    urgent_only: false,
    maintenance_updates: true,
    system_alerts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStaffProfile();
    }
  }, [user]);

  const fetchStaffProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile({
        ...data,
        department: 'Maintenance', // Mock data
        shift_start: '08:00',
        shift_end: '17:00',
        skills: ['HVAC', 'Electrical', 'Plumbing'], // Mock data
        bio: 'Experienced maintenance technician with 5+ years in facilities management.'
      });
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotifications = async () => {
    // In a real app, this would save to a user preferences table
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-card/50">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Staff Settings</h1>
        <p className="text-gray-400">Manage your staff profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Staff Profile</CardTitle>
              <CardDescription>Update your personal information and professional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.first_name || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.last_name || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, last_name: e.target.value} : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone_number || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, phone_number: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={profile.department} onValueChange={(value) => setProfile(prev => prev ? {...prev, department: value} : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="IT Support">IT Support</SelectItem>
                      <SelectItem value="Reception">Reception</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your experience and specialties..."
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Skills & Specialties</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={saveProfile} disabled={isSaving} className="bg-plaza-blue hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Work Schedule</CardTitle>
              <CardDescription>Manage your work hours and availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shiftStart">Shift Start Time</Label>
                  <Input
                    id="shiftStart"
                    type="time"
                    value={profile.shift_start || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, shift_start: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shiftEnd">Shift End Time</Label>
                  <Input
                    id="shiftEnd"
                    type="time"
                    value={profile.shift_end || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, shift_end: e.target.value} : null)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Working Days</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Switch id={day.toLowerCase()} defaultChecked={!['Saturday', 'Sunday'].includes(day)} />
                      <Label htmlFor={day.toLowerCase()}>{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="bg-plaza-blue hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Schedule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.email_alerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({...prev, email_alerts: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SMS Alerts</Label>
                    <p className="text-sm text-gray-400">Receive text messages for urgent issues</p>
                  </div>
                  <Switch
                    checked={notifications.sms_alerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({...prev, sms_alerts: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Urgent Priority Only</Label>
                    <p className="text-sm text-gray-400">Only notify for urgent and high priority requests</p>
                  </div>
                  <Switch
                    checked={notifications.urgent_only}
                    onCheckedChange={(checked) => setNotifications(prev => ({...prev, urgent_only: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Maintenance Updates</Label>
                    <p className="text-sm text-gray-400">Get notified about maintenance request changes</p>
                  </div>
                  <Switch
                    checked={notifications.maintenance_updates}
                    onCheckedChange={(checked) => setNotifications(prev => ({...prev, maintenance_updates: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-gray-400">Receive system and equipment alerts</p>
                  </div>
                  <Switch
                    checked={notifications.system_alerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({...prev, system_alerts: checked}))}
                  />
                </div>
              </div>

              <Button onClick={saveNotifications} className="bg-plaza-blue hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription>Manage your account security and access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Current Role</h4>
                  <Badge variant="secondary" className="text-sm">
                    {profile.role === 'staff' ? 'Staff Member' : profile.role}
                  </Badge>
                  <p className="text-sm text-gray-400 mt-2">
                    Your current role determines your access level and permissions within the system.
                  </p>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Account Security</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Two-Factor Authentication</span>
                      <Badge variant="outline">Not Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Last Password Change</span>
                      <span className="text-sm text-gray-400">30 days ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Active Sessions</span>
                      <span className="text-sm text-gray-400">2 devices</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full">
                    Enable Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Active Sessions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffSettingsPage;