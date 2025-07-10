import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface NotificationPreferences {
  maintenance: boolean;
  announcements: boolean;
  security: boolean;
  events: boolean;
  marketing: boolean;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  office_number: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  department: string | null;
  floor: string | null;
  zone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  profile_visibility: string;
  notification_preferences: NotificationPreferences | any;
  bio: string | null;
  skills: string[] | null;
  interests: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  office_number?: string;
  phone_number?: string;
  avatar_url?: string | null;
  department?: string;
  floor?: string;
  zone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  profile_visibility?: string;
  notification_preferences?: NotificationPreferences | any;
  bio?: string;
  skills?: string[];
  interests?: string[];
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProfile = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Profile doesn't exist, create a basic one
        console.log('No profile found, creating basic profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            first_name: '',
            last_name: '',
            role: 'tenant_manager',
            notification_preferences: {
              maintenance: true,
              announcements: true,
              security: true,
              events: false,
              marketing: false
            }
          })
          .select()
          .maybeSingle();
          
        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfile(newProfile as Profile);
        }
      } else {
        setProfile(data as Profile);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!user) return false;

    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      setProfile(data as Profile);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const createProfile = async (profileData: Omit<ProfileUpdateData, 'avatar_url'> & { avatar_url?: string | null }) => {
    if (!user) return false;

    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          office_number: profileData.office_number || null,
          phone_number: profileData.phone_number || null,
          avatar_url: profileData.avatar_url || null,
          department: profileData.department || null,
          floor: profileData.floor || null,
          zone: profileData.zone || null,
          emergency_contact_name: profileData.emergency_contact_name || null,
          emergency_contact_phone: profileData.emergency_contact_phone || null,
          emergency_contact_relationship: profileData.emergency_contact_relationship || null,
          profile_visibility: profileData.profile_visibility || 'public',
          notification_preferences: profileData.notification_preferences || {
            maintenance: true,
            announcements: true,
            security: true,
            events: false,
            marketing: false
          },
          bio: profileData.bio || null,
          skills: profileData.skills || null,
          interests: profileData.interests || null,
          role: 'tenant_manager',
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      setProfile(data as Profile);
      
      toast({
        title: "Profile created",
        description: "Your profile has been created successfully.",
      });

      return true;
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const isProfileComplete = () => {
    if (!profile) return false;
    return !!(
      profile.first_name?.trim() &&
      profile.last_name?.trim() &&
      profile.office_number?.trim() &&
      profile.phone_number?.trim() &&
      profile.department?.trim()
    );
  };

  const getCompletionPercentage = () => {
    if (!profile) return 0;
    
    const requiredFields = [
      profile.first_name,
      profile.last_name,
      profile.office_number,
      profile.phone_number,
      profile.department,
    ];
    
    const optionalFields = [
      profile.avatar_url,
      profile.floor,
      profile.emergency_contact_name,
      profile.bio,
    ];
    
    const completedRequired = requiredFields.filter(field => field && field.trim()).length;
    const completedOptional = optionalFields.filter(field => field && field.trim()).length;
    
    // Required fields are worth 80%, optional fields 20%
    const requiredScore = (completedRequired / requiredFields.length) * 80;
    const optionalScore = (completedOptional / optionalFields.length) * 20;
    
    return Math.round(requiredScore + optionalScore);
  };

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    fetchProfile();

    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    profile,
    isLoading,
    isUpdating,
    updateProfile,
    createProfile,
    refreshProfile: fetchProfile,
    isProfileComplete: isProfileComplete(),
    completionPercentage: getCompletionPercentage(),
  };
};