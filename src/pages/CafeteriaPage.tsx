import React, { useState } from 'react';
import OrderModal from '@/components/cafeteria/OrderModal';
import LoyaltyCard from '@/components/cafeteria/LoyaltyCard';
import MenuData from '@/components/cafeteria/MenuData';
import SearchAndFilters from '@/components/cafeteria/SearchAndFilters';
import LiveOrderTracking from '@/components/cafeteria/LiveOrderTracking';
import OrderHistory from '@/components/cafeteria/OrderHistory';
import VendorOffers from '@/components/cafeteria/VendorOffers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CafeteriaPage = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    vegetarian: false,
    vegan: false,
    available: true,
    priceRange: '',
  });
  
  const { data: loyaltyPoints = 0 } = useQuery({
    queryKey: ['loyalty-points'],
    queryFn: async () => {
      const { data } = await supabase
        .from('loyalty_points')
        .select('points')
        .maybeSingle();
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
          <h2 className="text-2xl font-bold text-white">Autopilot Café</h2>
          <p className="text-gray-300">Multi-Brand Food Court · SS Plaza, BTM Layout</p>
        </div>
      </div>
      
      <div className="px-4 mt-6">
        <LoyaltyCard />
        <LiveOrderTracking />
        
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="menu" className="space-y-4">
            <VendorOffers />
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedFilters={filters}
              onFiltersChange={setFilters}
            />
            <MenuData 
              onSelectItem={setSelectedItem} 
              searchTerm={searchTerm}
              filters={filters}
            />
          </TabsContent>
          
          <TabsContent value="orders">
            <OrderHistory />
          </TabsContent>
        </Tabs>
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
