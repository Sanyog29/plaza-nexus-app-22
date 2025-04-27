
import React, { useEffect, useState } from 'react';
import { Settings, User, Building, LogOut, FileText, Bell, Mail, Phone, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setProfile(data);
      } catch (error: any) {
        toast({
          title: "Error fetching profile",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, toast]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Tenant';
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">My Profile</h2>
        <Button variant="ghost" size="icon">
          <Settings size={20} className="text-gray-400" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center bg-card rounded-lg p-6 card-shadow mb-8">
        <div className="relative mb-4">
          <img 
            src={`https://api.dicebear.com/7.x/avatars/svg?seed=${user?.email}`}
            alt="Profile" 
            className="w-20 h-20 rounded-full object-cover"
          />
          <div className="absolute -bottom-1 -right-1 bg-plaza-blue rounded-full p-1">
            <User size={16} className="text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-white">{getDisplayName()}</h3>
        <p className="text-gray-400 text-sm">{profile?.role || 'Tenant'}</p>
        
        {!isLoading && (
          <div className="w-full mt-6 space-y-4">
            <div className="flex items-center text-gray-300 gap-3">
              <Mail size={18} className="text-gray-400" />
              <span>{user?.email}</span>
            </div>
            
            {profile?.phone_number && (
              <div className="flex items-center text-gray-300 gap-3">
                <Phone size={18} className="text-gray-400" />
                <span>{profile.phone_number}</span>
              </div>
            )}
            
            {profile?.apartment_number && (
              <div className="flex items-center text-gray-300 gap-3">
                <Home size={18} className="text-gray-400" />
                <span>Apartment {profile.apartment_number}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="w-full border-t border-gray-700 mt-6 pt-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center">
              <Building size={18} className="text-gray-400 mr-2" />
              <span>SS Plaza</span>
            </div>
            <span>4th Floor</span>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg card-shadow">
        <div className="px-4 py-3 border-b border-gray-700">
          <h4 className="text-lg font-medium text-white">Account Settings</h4>
        </div>
        
        <div className="divide-y divide-gray-700">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Bell size={18} className="text-gray-400 mr-3" />
              <span className="text-white">Notifications</span>
            </div>
            <Button variant="ghost" size="sm" className="text-plaza-blue hover:text-plaza-blue">
              Manage
            </Button>
          </div>
          
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <FileText size={18} className="text-gray-400 mr-3" />
              <span className="text-white">My Requests</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-plaza-blue hover:text-plaza-blue"
              onClick={() => navigate('/requests')}
            >
              View
            </Button>
          </div>
          
          <div className="px-4 py-3">
            <Button 
              variant="destructive" 
              className="w-full flex items-center justify-center" 
              size="sm"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
