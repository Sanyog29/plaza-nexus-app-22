import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export const useUserCredits = () => {
  const { user, isStaff } = useAuth();

  return useQuery({
    queryKey: ['user-credits', user?.id, isStaff],
    queryFn: async () => {
      if (!user?.id) return 0;

      try {
        if (isStaff) {
          // For staff/technicians, get points from technician_points
          const { data, error } = await supabase
            .from('technician_points')
            .select('points_balance')
            .eq('technician_id', user.id)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.warn('Error fetching technician points:', error);
            return 0;
          }
          return data?.points_balance || 0;
        } else {
          // For regular users, get points from loyalty_points
          const { data, error } = await supabase
            .from('loyalty_points')
            .select('points')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.warn('Error fetching loyalty points:', error);
            return 0;
          }
          return data?.points || 0;
        }
      } catch (error) {
        console.warn('Error fetching user credits:', error);
        return 0;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};