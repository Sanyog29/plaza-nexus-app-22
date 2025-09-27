
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { OnboardingWizard } from '@/components/auth/OnboardingWizard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ProfileErrorBoundary } from '@/components/ProfileErrorBoundary';
import { ActivityFeed } from '@/components/profile/ActivityFeed';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { IncomingTasks } from '@/components/profile/IncomingTasks';

const ProfilePage = () => {
  const { user, signOut, isStaff, isAdmin, userRole, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading, isProfileComplete, completionPercentage, updateProfile } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding only for tenant_manager users if profile is empty (no first/last name)
    if (!authLoading && !isLoading && !isStaff && userRole === 'tenant_manager' && profile) {
      const isProfileEmpty = !profile.first_name?.trim() && !profile.last_name?.trim();
      
      if (isProfileEmpty) {
        // Check if we should show onboarding (prevent infinite loops)
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      }
    }
  }, [profile, isLoading, authLoading, isStaff, userRole]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
    localStorage.removeItem('profileSetupAttempts'); // Clear attempts on success
    
    // Let useProfile handle the refresh automatically via real-time updates
    // No need for window.location.reload()
  };

  const handleAvatarUpdate = async (url: string | null) => {
    if (profile) {
      await updateProfile({ avatar_url: url });
    }
  };

  if (!user) {
    return null;
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plaza-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <ProfileErrorBoundary onSignOut={signOut}>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            {!profile ? (
              <Card className="mt-6 p-6">
                <div className="flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Setting up your profile...</h2>
                    <p className="text-gray-400 mb-6">We're preparing your account. This should only take a moment.</p>
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                    <div className="mt-6">
                      <Button variant="outline" onClick={signOut}>
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Profile Header */}
                <Card className="p-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                    <AvatarUpload
                      currentAvatarUrl={profile.avatar_url}
                      onAvatarUpdate={handleAvatarUpdate}
                      size="lg"
                    />
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl font-bold text-white">
                        {profile.first_name && profile.last_name 
                          ? `${profile.first_name} ${profile.last_name}`
                          : user.email
                        }
                      </h2>
                      <p className="text-plaza-blue font-medium capitalize">{profile.role}</p>
                      <p className="text-gray-400 text-sm mt-1">{user.email}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                        {profile.office_number && (
                          <div className="bg-card px-3 py-1 rounded-full border">
                            <span className="text-sm text-muted-foreground">Office: {profile.office_number}</span>
                          </div>
                        )}
                        {profile.department && (
                          <div className="bg-card px-3 py-1 rounded-full border">
                            <span className="text-sm text-muted-foreground">{profile.department}</span>
                          </div>
                        )}
                        {profile.floor && (
                          <div className="bg-card px-3 py-1 rounded-full border">
                            <span className="text-sm text-muted-foreground">Floor: {profile.floor}</span>
                          </div>
                        )}
                        {profile.phone_number && (
                          <div className="bg-card px-3 py-1 rounded-full border">
                            <span className="text-sm text-muted-foreground">{profile.phone_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <Button variant="outline" onClick={signOut}>
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Profile Completion - Only show for tenant_managers */}
                {userRole === 'tenant_manager' && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
                      <span className="text-sm text-gray-400">{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="mb-4" />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Basic Information</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          profile.first_name && profile.last_name ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {profile.first_name && profile.last_name ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Contact Details</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          profile.phone_number ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {profile.phone_number ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Office & Department</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          profile.office_number && profile.department ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {profile.office_number && profile.department ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Emergency Contact</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          profile.emergency_contact_name && profile.emergency_contact_phone ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                        }`}>
                          {profile.emergency_contact_name && profile.emergency_contact_phone ? 'Complete' : 'Recommended'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Profile Picture</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          profile.avatar_url ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                        }`}>
                          {profile.avatar_url ? 'Complete' : 'Optional'}
                        </span>
                      </div>
                      {!isProfileComplete && (
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-sm text-muted-foreground">
                            Complete your profile to access all features.
                          </p>
                          <Button 
                            size="sm" 
                            onClick={() => setShowOnboarding(true)}
                          >
                            Complete Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Quick Actions - Show for all authenticated users */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    <Button 
                      className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      onClick={() => navigate('/requests/new')}
                    >
                      <span className="text-plaza-blue text-xl mb-1">+</span>
                      <span>New Request</span>
                    </Button>
                    
                    <Button 
                      className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      onClick={() => navigate('/requests')}
                    >
                      <span className="text-plaza-blue text-xl mb-1">📋</span>
                      <span>{userRole === 'admin' || userRole === 'field_staff' ? 'All Requests' : 'My Requests'}</span>
                    </Button>
                    
                    {(userRole === 'tenant_manager' || userRole === 'admin') && (
                      <>
                        <Button 
                          className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                          onClick={() => navigate('/services')}
                        >
                          <span className="text-plaza-blue text-xl mb-1">🏢</span>
                          <span>Services</span>
                        </Button>
                        
                        <Button 
                          className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                          onClick={() => navigate('/cafeteria')}
                        >
                          <span className="text-plaza-blue text-xl mb-1">🍴</span>
                          <span>Cafeteria</span>
                        </Button>
                        
                        <Button 
                          className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                          onClick={() => navigate('/bookings')}
                        >
                          <span className="text-plaza-blue text-xl mb-1">📅</span>
                          <span>Bookings</span>
                        </Button>
                      </>
                    )}
                    
                    {(userRole === 'admin' || userRole === 'field_staff') && (
                      <Button 
                        className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                        onClick={() => navigate('/admin/assets')}
                      >
                        <span className="text-plaza-blue text-xl mb-1">🏢</span>
                        <span>Assets</span>
                      </Button>
                    )}
                    
                    <Button 
                      className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      onClick={() => navigate('/security')}
                    >
                      <span className="text-plaza-blue text-xl mb-1">🔒</span>
                      <span>Security</span>
                    </Button>
                  </div>
                </Card>

                {/* Incoming Tasks - Only show for field staff */}
                {userRole === 'field_staff' && <IncomingTasks />}

                {/* Activity Feed - Show for all users */}
                <ActivityFeed />

                {/* Role-specific Actions */}
                {(isAdmin || isStaff) && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {userRole === 'admin' ? 'Admin' : 'Staff'} Dashboard Access
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Button 
                         className="h-20 flex-col bg-card hover:bg-muted border"
                         onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/staff/dashboard')}
                       >
                         <span className="text-primary text-xl mb-1">📊</span>
                         <span>Go to Dashboard</span>
                       </Button>
                       
                       <Button 
                         className="h-20 flex-col bg-card hover:bg-muted border"
                         onClick={() => navigate(isAdmin ? '/admin/requests' : '/staff/requests')}
                       >
                         <span className="text-primary text-xl mb-1">📋</span>
                         <span>Manage Requests</span>
                       </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="mt-6">
              <SettingsForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProfileErrorBoundary>
  );
};

export default ProfilePage;
