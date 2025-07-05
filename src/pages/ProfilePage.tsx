
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/AuthProvider';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  apartment_number: string | null;
  phone_number: string | null;
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, show create option
          setProfile(null);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast("Error loading profile", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: '',
          last_name: '',
          role: 'tenant'
        });

      if (error) throw error;
      
      toast("Profile created successfully!");
      fetchProfile();
    } catch (error: any) {
      toast("Error creating profile", {
        description: error.message,
      });
    }
  };

  if (!user) {
    return null;
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
                  <p className="text-gray-400 mb-6">Your profile data is missing. Please create your profile to continue.</p>
                  <Button onClick={createProfile} className="bg-plaza-blue hover:bg-blue-700">
                    Create Profile
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
                  <img 
                    src={`https://api.dicebear.com/7.x/avatars/svg?seed=${user.email}`}
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-plaza-blue"
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
                      {profile.apartment_number && (
                        <div className="bg-gray-800 px-3 py-1 rounded-full">
                          <span className="text-sm text-gray-300">Apt: {profile.apartment_number}</span>
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

              {/* Quick Actions */}
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

              {/* Profile Completion */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Profile Completion</h3>
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
                    <span className="text-gray-300">Apartment Number</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      profile.apartment_number ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {profile.apartment_number ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  {(!profile.first_name || !profile.last_name || !profile.phone_number || !profile.apartment_number) && (
                    <p className="text-sm text-gray-400 mt-3">
                      Complete your profile in the Settings tab to access all features.
                    </p>
                  )}
                </div>
              </Card>
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
