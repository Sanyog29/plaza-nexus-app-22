
import React, { useEffect, useState } from 'react';
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
          <Card className="mt-6 p-6">
            {!profile ? (
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
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <img 
                  src={`https://api.dicebear.com/7.x/avatars/svg?seed=${user.email}`}
                  alt="Profile" 
                  className="w-32 h-32 rounded-full"
                />
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">
                    {profile.first_name && profile.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : user.email
                    }
                  </h2>
                  <p className="text-gray-400 mt-1 capitalize">{profile.role}</p>
                  {profile.apartment_number && (
                    <p className="text-gray-400 mt-1">Apartment: {profile.apartment_number}</p>
                  )}
                  {profile.phone_number && (
                    <p className="text-gray-400 mt-1">Phone: {profile.phone_number}</p>
                  )}
                </div>
              </div>
            )}
          </Card>
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
