import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { PublicProfile, ConditionalProfile, PUBLIC_FIELDS_SELECT } from '@/types/profile-security';

/**
 * Hook to fetch public profile data only (safe fields)
 * Use this for user directories, search results, and public displays
 */
export const usePublicProfile = (userId?: string) => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchPublicProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles_public')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;
        setProfile(data as unknown as PublicProfile);
      } catch (error: any) {
        console.error('Error fetching public profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicProfile();
  }, [userId]);

  return { profile, isLoading };
};

/**
 * Hook to fetch full profile with automatic permission checks
 * Sensitive fields are only included if user has permission
 */
export const useFullProfile = (userId?: string) => {
  const [profile, setProfile] = useState<ConditionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchFullProfile = async () => {
      try {
        // Use the secure RPC function that handles permissions
        const { data, error } = await supabase
          .rpc('get_full_profile', { profile_id: userId });

        if (error) throw error;
        
        // Parse the JSONB response
        const profileData = data as unknown as ConditionalProfile;
        
        // Check if sensitive data was included
        const hasSensitive = profileData && 'email' in profileData && profileData.email !== undefined;
        setHasAccess(hasSensitive);
        setProfile(profileData);
      } catch (error: any) {
        console.error('Error fetching full profile:', error);
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullProfile();
  }, [userId]);

  return { profile, isLoading, hasAccess };
};

/**
 * Hook to check if current user can view sensitive data for a profile
 */
export const useCanViewSensitiveData = (userId?: string) => {
  const { user, isAdmin } = useAuth();
  const [canView, setCanView] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!userId || !user) {
      setIsChecking(false);
      return;
    }

    // Own profile or admin - immediate access
    if (user.id === userId || isAdmin) {
      setCanView(true);
      setIsChecking(false);
      return;
    }

    // Check via database function
    const checkPermission = async () => {
      try {
        const { data, error } = await supabase
          .rpc('can_view_profile_sensitive_data', { target_user_id: userId });

        if (error) throw error;
        setCanView(data === true);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setCanView(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPermission();
  }, [userId, user, isAdmin]);

  return { canView, isChecking };
};

/**
 * Hook to fetch only public profiles (for directories, search, etc.)
 */
export const usePublicProfiles = (filters?: { department?: string; floor?: string }) => {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        let query = supabase
          .from('profiles_public')
          .select('*');

        if (filters?.department) {
          query = query.eq('department', filters.department);
        }
        if (filters?.floor) {
          query = query.eq('floor', filters.floor);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProfiles(data as unknown as PublicProfile[]);
      } catch (error: any) {
        console.error('Error fetching public profiles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [filters?.department, filters?.floor]);

  return { profiles, isLoading };
};
