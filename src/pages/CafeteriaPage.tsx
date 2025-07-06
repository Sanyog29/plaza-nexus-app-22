import React, { useState } from 'react';
import OrderModal from '@/components/cafeteria/OrderModal';
import LoyaltyCard from '@/components/cafeteria/LoyaltyCard';
import MenuData from '@/components/cafeteria/MenuData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CafeteriaPage = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const { data: loyaltyPoints = 0 } = useQuery({
    queryKey: ['loyalty-points'],
    queryFn: async () => {
      const { data } = await supabase
        .from('loyalty_points')
        .select('points')
        .single();
      return data?.points || 0;
    },
  });

  return (
    <div className="pb-6">
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-plaza-dark">
          <img 
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1470&h=400" 
            alt="Cafeteria" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="absolute bottom-0 left-0 p-4">
          <h2 className="text-2xl font-bold text-white">Terrace Café</h2>
          <p className="text-gray-300">SS Plaza · 12th Floor</p>
        </div>
      </div>
      
      <div className="px-4 mt-6">
        <LoyaltyCard />
        <MenuData onSelectItem={setSelectedItem} />
      </div>

      <OrderModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        loyaltyPoints={loyaltyPoints}
      />
    </div>
  );
};

export default CafeteriaPage;
