import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface MenuDataProps {
  onSelectItem: (item: any) => void;
}

const MenuData: React.FC<MenuDataProps> = ({ onSelectItem }) => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafeteria_menu_categories')
        .select(`
          *,
          cafeteria_menu_items (
            *
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: todaySpecial } = useQuery({
    queryKey: ['today-special'],
    queryFn: async () => {
      // Get a featured item (could be based on popularity, admin selection, etc.)
      const { data, error } = await supabase
        .from('cafeteria_menu_items')
        .select('*')
        .eq('is_available', true)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Today's Special */}
      {todaySpecial && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Today's Special</h3>
            <span className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          
          <div className="bg-card rounded-lg overflow-hidden card-shadow">
            {todaySpecial.image_url && (
              <img 
                src={todaySpecial.image_url} 
                alt={todaySpecial.name} 
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-white text-lg">{todaySpecial.name}</h4>
                  <p className="text-sm text-gray-400">{todaySpecial.description}</p>
                </div>
                <div className="flex items-center bg-plaza-blue bg-opacity-20 px-2 py-1 rounded">
                  <Star size={16} className="text-plaza-blue mr-1 fill-plaza-blue" />
                  <span className="text-sm text-plaza-blue">4.5</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-lg font-medium text-white">${todaySpecial.price}</span>
                <Button 
                  className="bg-plaza-blue hover:bg-blue-700"
                  onClick={() => onSelectItem(todaySpecial)}
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Categories */}
      {categories.map((category) => (
        <div key={category.id} className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">{category.name}</h3>
          <div className="space-y-4">
            {category.cafeteria_menu_items
              ?.filter((item: any) => item.is_available)
              .map((item: any) => (
                <div 
                  key={item.id} 
                  className="bg-card rounded-lg p-4 card-shadow"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium text-white">{item.name}</h4>
                        {item.is_vegetarian && (
                          <span className="ml-2 w-4 h-4 rounded-full border border-green-500 flex items-center justify-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          </span>
                        )}
                        {item.is_vegan && (
                          <span className="ml-2 text-xs px-2 py-1 bg-green-600 text-white rounded-full">
                            VEGAN
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white">${item.price}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 hover:bg-plaza-blue hover:text-white"
                        onClick={() => onSelectItem(item)}
                      >
                        <Coffee size={16} className="mr-1" />
                        Order
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuData;