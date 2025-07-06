
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
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { user, signOut, isStaff, isAdmin, userRole, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading, isProfileComplete, completionPercentage, updateProfile } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding only for tenant_manager users (not staff) if profile doesn't exist or is incomplete
    if (!authLoading && !isLoading && !isStaff && userRole === 'tenant_manager' && (!profile || !isProfileComplete)) {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [profile, isLoading, isProfileComplete, authLoading, isStaff, userRole]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
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
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plaza-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
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
                  <h2 className="text-2xl font-bold text-white mb-4">Profile Not Found</h2>
                  <p className="text-gray-400 mb-6">Your profile data is missing. Let's set it up!</p>
                  <Button 
                    onClick={() => setShowOnboarding(true)} 
                    className="bg-plaza-blue hover:bg-blue-700"
                  >
                    Complete Profile Setup
                  </Button>
                  <div className="mt-4">
                    <Button variant="outline" onClick={signOut}>
                      Sign Out & Re-login
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
                    
                    <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                      {profile.office_number && (
                        <div className="bg-gray-800 px-3 py-1 rounded-full">
                          <span className="text-sm text-gray-300">Office: {profile.office_number}</span>
                        </div>
                      )}
                      {profile.phone_number && (
                        <div className="bg-gray-800 px-3 py-1 rounded-full">
                          <span className="text-sm text-gray-300">{profile.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" onClick={signOut} className="mt-4 md:mt-0">
                    Sign Out
                  </Button>
                </div>
              </Card>

              {/* Profile Completion - Only show for tenants */}
              {userRole === 'tenant' && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
                    <span className="text-sm text-gray-400">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="mb-4" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Basic Information</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        profile.first_name && profile.last_name ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {profile.first_name && profile.last_name ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Contact Details</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        profile.phone_number ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {profile.phone_number ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Office Number</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        profile.office_number ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {profile.office_number ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Profile Picture</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        profile.avatar_url ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                      }`}>
                        {profile.avatar_url ? 'Complete' : 'Optional'}
                      </span>
                    </div>
                    {!isProfileComplete && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-gray-400">
                          Complete your profile to access all features.
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => setShowOnboarding(true)}
                          className="bg-plaza-blue hover:bg-blue-700"
                        >
                          Complete Now
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Quick Actions - Only show for tenants */}
              {userRole === 'tenant' && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <span>My Requests</span>
                    </Button>
                    
                    <Button 
                      className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      onClick={() => navigate('/services')}
                    >
                      <span className="text-plaza-blue text-xl mb-1">🏢</span>
                      <span>Services</span>
                    </Button>
                    
                    <Button 
                      className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      onClick={() => navigate('/security')}
                    >
                      <span className="text-plaza-blue text-xl mb-1">🔒</span>
                      <span>Security</span>
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
                  </div>
                </Card>
              )}

              {/* Role-specific Actions */}
              {(userRole === 'admin' || userRole === 'staff') && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {userRole === 'admin' ? 'Admin' : 'Staff'} Dashboard Access
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      onClick={() => navigate(`/${userRole}/dashboard`)}
                    >
                      <span className="text-plaza-blue text-xl mb-1">📊</span>
                      <span>Go to Dashboard</span>
                    </Button>
                    
                    <Button 
                      className="h-20 flex-col bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      onClick={() => navigate(`/${userRole}/requests`)}
                    >
                      <span className="text-plaza-blue text-xl mb-1">📋</span>
                      <span>Manage Requests</span>
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card className="mt-6 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
            <SettingsForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
