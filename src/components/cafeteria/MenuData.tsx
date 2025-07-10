import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Coffee, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import NutritionalInfo from './NutritionalInfo';

interface MenuDataProps {
  onSelectItem: (item: any) => void;
  searchTerm: string;
  filters: {
    vegetarian: boolean;
    vegan: boolean;
    available: boolean;
    priceRange: string;
  };
}

const MenuData: React.FC<MenuDataProps> = ({ onSelectItem, searchTerm, filters }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
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
        .order('price', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Filter and search functionality
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    
    return categories.map(category => {
      const filteredItems = category.cafeteria_menu_items?.filter((item: any) => {
        // Search filter
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !item.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Availability filter
        if (filters.available && !item.is_available) return false;

        // Dietary filters
        if (filters.vegetarian && !item.is_vegetarian) return false;
        if (filters.vegan && !item.is_vegan) return false;

        // Price range filter
        if (filters.priceRange) {
          const [min, max] = filters.priceRange.split('-').map(v => v === '+' ? Infinity : parseInt(v));
          if (item.price < min || (max !== Infinity && item.price > max)) return false;
        }

        return true;
      }) || [];

      return {
        ...category,
        cafeteria_menu_items: filteredItems
      };
    }).filter(category => category.cafeteria_menu_items.length > 0);
  }, [categories, searchTerm, filters]);

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const incrementViewCount = (itemId: string) => {
    setViewCounts(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleItemClick = (item: any) => {
    incrementViewCount(item.id);
    onSelectItem(item);
  };

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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(todaySpecial.id)}
                    className="p-2"
                  >
                    <Heart 
                      className={`h-4 w-4 ${favorites.includes(todaySpecial.id) ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>
                  <NutritionalInfo item={todaySpecial} />
                  <Button 
                    className="bg-plaza-blue hover:bg-blue-700"
                    onClick={() => handleItemClick(todaySpecial)}
                  >
                    Order Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Categories */}
      {filteredCategories.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No items found matching your criteria</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
      
      {filteredCategories.map((category) => (
        <div key={category.id} className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">{category.name}</h3>
          <div className="space-y-4">
            {category.cafeteria_menu_items?.map((item: any) => (
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
                      {viewCounts[item.id] && (
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3 mr-1" />
                          {viewCounts[item.id]} views
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="text-white font-medium">₹{item.price}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(item.id)}
                          className="p-1 h-8 w-8"
                        >
                          <Heart 
                            className={`h-3 w-3 ${favorites.includes(item.id) ? 'fill-red-500 text-red-500' : ''}`} 
                          />
                        </Button>
                        <NutritionalInfo item={item} />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-plaza-blue hover:text-white"
                          onClick={() => handleItemClick(item)}
                        >
                          <Coffee size={14} className="mr-1" />
                          Order
                        </Button>
                      </div>
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