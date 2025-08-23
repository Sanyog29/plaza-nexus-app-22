import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AvailabilityStatus {
  is_available: boolean;
  availability_status: string;
  last_status_change: string;
  auto_offline_at?: string;
}

export const useStaffAvailability = () => {
  const [availability, setAvailability] = useState<AvailabilityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('staff-availability-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_availability',
          filter: `staff_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
        },
        () => {
          fetchAvailability();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching availability:', error);
        setIsLoading(false);
        return;
      }

      setAvailability(data || {
        is_available: true,
        availability_status: 'available',
        last_status_change: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvailability = async (status: string, autoOfflineMinutes?: number) => {
    try {
      const { error } = await supabase.rpc('update_staff_availability', {
        new_status: status,
        auto_offline_minutes: autoOfflineMinutes || null
      });

      if (error) throw error;

      await fetchAvailability();
      return true;
    } catch (error) {
      console.error('Error updating availability:', error);
      return false;
    }
  };

  return {
    availability,
    isLoading,
    updateAvailability,
    refreshAvailability: fetchAvailability
  };
};