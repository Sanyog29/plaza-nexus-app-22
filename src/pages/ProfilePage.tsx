
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/AuthProvider';
import { SettingsForm } from '@/components/settings/SettingsForm';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
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
            <div className="flex flex-col items-center space-y-6">
              <img 
                src={`https://api.dicebear.com/7.x/avatars/svg?seed=${user.email}`}
                alt="Profile" 
                className="w-32 h-32 rounded-full"
              />
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">{user.email}</h2>
                <p className="text-gray-400 mt-1">Tenant</p>
              </div>
            </div>
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
