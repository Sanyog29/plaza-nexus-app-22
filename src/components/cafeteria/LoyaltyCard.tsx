
import React from 'react';
import { Coffee } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const LoyaltyCard: React.FC = () => {
  const { data: loyaltyData } = useQuery({
    queryKey: ['loyalty-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="bg-gradient-to-br from-plaza-blue to-blue-600 rounded-lg p-4 text-white mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-white/20 p-2 rounded-lg">
          <Coffee className="h-6 w-6" />
        </div>
        <span className="text-sm">AUTOPILOT Rewards</span>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">{loyaltyData?.points || 0} points</h3>
        <p className="text-sm text-white/80">
          Total earned: {loyaltyData?.total_earned || 0} points
        </p>
      </div>
    </div>
  );
};

export default LoyaltyCard;
