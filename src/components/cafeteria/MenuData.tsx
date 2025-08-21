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
  // Fetch vendors with their menu items
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors-with-menu'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select(`
            *,
            vendor_menu_items (
              *,
              category:cafeteria_menu_categories(name, id)
            ),
            cafeteria_menu_categories (
              *
            )
          `)
          .eq('is_active', true)
          .order('name');
        
        if (error) {
          console.warn('Error fetching vendors:', error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.warn('Failed to fetch vendors:', error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: todaySpecial } = useQuery({
    queryKey: ['today-special'],
    queryFn: async () => {
      try {
        // Get a featured item from vendor menu items
        const { data, error } = await supabase
          .from('vendor_menu_items')
          .select(`
            *,
            vendor:vendors(name, logo_url)
          `)
          .eq('is_available', true)
          .eq('is_featured', true)
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.warn('Error fetching today special:', error);
          return null;
        }
        return data;
      } catch (error) {
        console.warn('Failed to fetch today special:', error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Check if vendor is open
  const isVendorOpen = (vendor: any) => {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const schedule = vendor.operating_hours?.[today];
    if (!schedule || schedule.closed) return false;
    
    const [openHour, openMin] = schedule.open.split(':').map(Number);
    const [closeHour, closeMin] = schedule.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  // Filter and search functionality for vendors
  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    
    return vendors.map(vendor => {
      const filteredItems = vendor.vendor_menu_items?.filter((item: any) => {
        // Search filter
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !item.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Availability filter
        if (filters.available && !item.is_available) return false;

        // Dietary filters (check dietary tags)
        if (filters.vegetarian && !item.dietary_tags?.includes('vegetarian')) return false;
        if (filters.vegan && !item.dietary_tags?.includes('vegan')) return false;

        // Price range filter
        if (filters.priceRange) {
          const [min, max] = filters.priceRange.split('-').map(v => v === '+' ? Infinity : parseInt(v));
          if (item.price < min || (max !== Infinity && item.price > max)) return false;
        }

        return true;
      }) || [];

      return {
        ...vendor,
        vendor_menu_items: filteredItems,
        isOpen: isVendorOpen(vendor)
      };
    }).filter(vendor => vendor.vendor_menu_items.length > 0);
  }, [vendors, searchTerm, filters]);

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
                  <Button 
                    className="bg-plaza-blue hover:bg-blue-700"
                    onClick={() => handleItemClick(todaySpecial)}
                  >
                    Order Now
                  </Button>
                </div>
              </div>
              {todaySpecial.vendor && (
                <div className="px-4 pb-2">
                  <span className="text-sm text-gray-400">
                    by {todaySpecial.vendor.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vendor Menus */}
      {filteredVendors.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No items found matching your criteria</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
      
      {filteredVendors.map((vendor) => (
        <div key={vendor.id} className="mb-8">
          {/* Vendor Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {vendor.logo_url && (
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">{vendor.name}</h3>
                <p className="text-sm text-gray-400">{vendor.cuisine_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded-full text-xs ${
                vendor.isOpen 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {vendor.isOpen ? 'Open' : 'Closed'}
              </div>
              {vendor.average_rating > 0 && (
                <div className="flex items-center bg-plaza-blue bg-opacity-20 px-2 py-1 rounded">
                  <Star size={12} className="text-plaza-blue mr-1 fill-plaza-blue" />
                  <span className="text-xs text-plaza-blue">{vendor.average_rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Menu Items */}
          <div className="space-y-3">
            {vendor.vendor_menu_items?.map((item: any) => (
              <div 
                key={item.id} 
                className={`bg-card rounded-lg p-4 card-shadow ${
                  !vendor.isOpen ? 'opacity-60' : ''
                }`}
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{item.name}</h4>
                      {item.dietary_tags?.includes('vegetarian') && (
                        <span className="w-3 h-3 rounded-full border border-green-500 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        </span>
                      )}
                      {item.dietary_tags?.includes('vegan') && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-600 text-white rounded-full">
                          V
                        </span>
                      )}
                      {item.is_featured && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-600 text-white rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    {item.preparation_time_minutes && (
                      <p className="text-xs text-gray-500 mt-1">
                        Prep time: {item.preparation_time_minutes} mins
                      </p>
                    )}
                    {viewCounts[item.id] && (
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3 mr-1" />
                        {viewCounts[item.id]} views
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2 ml-4">
                    <span className="text-white font-medium">₹{item.price}</span>
                    {item.average_rating > 0 && (
                      <div className="flex items-center text-xs text-gray-400">
                        <Star size={12} className="mr-1 fill-yellow-400 text-yellow-400" />
                        {item.average_rating.toFixed(1)}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(item.id)}
                        className="p-1 h-7 w-7"
                      >
                        <Heart 
                          className={`h-3 w-3 ${favorites.includes(item.id) ? 'fill-red-500 text-red-500' : ''}`} 
                        />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-plaza-blue hover:text-white text-xs px-2"
                        onClick={() => handleItemClick(item)}
                        disabled={!vendor.isOpen}
                      >
                        <Coffee size={12} className="mr-1" />
                        {vendor.isOpen ? 'Order' : 'Closed'}
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