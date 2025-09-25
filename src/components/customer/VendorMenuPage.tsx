import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { MenuItemCard } from './MenuItemCard';
import { StickyCartPanel } from './StickyCartPanel';
import { ArrowLeft, Star, Clock, Search, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Vendor {
  id: string;
  name: string;
  logo_url?: string;
  cuisine_type: string;
  average_rating: number;
  store_config?: any;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  dietary_tags?: string[];
  is_available: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  average_rating?: number;
  spice_level?: number;
  preparation_time_minutes?: number;
  vendor_id: string;
  category_id?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
}

export const VendorMenuPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch vendor details
  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor-details', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('Vendor ID is required');
      
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, logo_url, cuisine_type, average_rating, store_config')
        .eq('id', vendorId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as Vendor;
    },
    enabled: !!vendorId,
  });

  // Fetch menu categories for this vendor
  const { data: categories } = useQuery({
    queryKey: ['vendor-categories', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('Vendor ID is required');
      
      const { data, error } = await supabase
        .from('cafeteria_menu_categories')
        .select('id, name, description, display_order')
        .eq('vendor_id', vendorId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as MenuCategory[];
    },
    enabled: !!vendorId,
  });

  // Fetch menu items for this vendor
  const { data: menuItems, isLoading: menuLoading, error } = useQuery({
    queryKey: ['vendor-menu', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('Vendor ID is required');
      
      const { data, error } = await supabase
        .from('vendor_menu_items')
        .select(`
          id, name, description, price, image_url, dietary_tags,
          is_available, stock_quantity, low_stock_threshold,
          average_rating, spice_level, preparation_time_minutes,
          vendor_id, category_id
        `)
        .eq('vendor_id', vendorId)
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!vendorId,
  });

  // Filter menu items
  const filteredItems = React.useMemo(() => {
    if (!menuItems) return [];
    
    return menuItems.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  // Group items by category
  const itemsByCategory = React.useMemo(() => {
    if (!categories || !filteredItems) return {};
    
    const grouped: Record<string, MenuItem[]> = {};
    
    categories.forEach(category => {
      grouped[category.id] = filteredItems.filter(item => item.category_id === category.id);
    });
    
    // Add uncategorized items
    const uncategorized = filteredItems.filter(item => !item.category_id);
    if (uncategorized.length > 0) {
      grouped['uncategorized'] = uncategorized;
    }
    
    return grouped;
  }, [categories, filteredItems]);

  const isLoading = vendorLoading || menuLoading;

  // Check if vendor is currently open
  const isVendorOpen = () => {
    if (!vendor?.store_config?.operatingHours) return true;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = vendor.store_config.operatingHours[currentDay];
    if (!todayHours || todayHours.closed) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  const MenuSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg">
          <Skeleton className="w-20 h-20 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🍽️</div>
      <h3 className="text-lg font-semibold mb-2">No Menu Items Found</h3>
      <p className="text-muted-foreground">
        {searchTerm || selectedCategory 
          ? "Try adjusting your search or filter criteria."
          : "This vendor hasn't added any menu items yet."}
      </p>
    </div>
  );

  if (!vendorId) {
    return <div>Vendor not found</div>;
  }

  const vendorOpen = isVendorOpen();
  const estimatedTime = vendor?.store_config?.deliveryConfig?.estimatedTime || 30;
  const deliveryFee = vendor?.store_config?.deliveryConfig?.deliveryFee || 0;
  const minimumOrder = vendor?.store_config?.deliveryConfig?.minimumOrder || 0;

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/cafeteria')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Menu</h1>
      </div>

      {/* Vendor Info */}
      {vendor && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-background">
              {vendor.logo_url ? (
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <span className="text-2xl font-bold">{vendor.name.charAt(0)}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold">{vendor.name}</h2>
                <Badge variant={vendorOpen ? "default" : "secondary"}>
                  {vendorOpen ? "Open" : "Closed"}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">{vendor.cuisine_type}</p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {vendor.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{vendor.average_rating.toFixed(1)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{estimatedTime} mins</span>
                </div>
                
                {deliveryFee > 0 && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>₹{deliveryFee} delivery</span>
                  </div>
                )}
              </div>
              
              {minimumOrder > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum order: ₹{minimumOrder}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Category Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === '' ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('')}
            >
              All
            </Badge>
            {categories.map(category => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Menu Items */}
      <LoadingWrapper
        loading={isLoading}
        error={error}
        skeleton={<MenuSkeleton />}
        emptyState={<EmptyState />}
        isEmpty={!filteredItems?.length}
      >
        <div className="space-y-6">
          {Object.entries(itemsByCategory).map(([categoryId, items]) => {
            if (items.length === 0) return null;
            
            const category = categories?.find(c => c.id === categoryId);
            const categoryName = category?.name || 'Other Items';
            
            return (
              <div key={categoryId}>
                <h3 className="text-lg font-semibold mb-4">{categoryName}</h3>
                <div className="space-y-3">
                  {items.map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      vendorName={vendor?.name || 'Unknown Vendor'}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </LoadingWrapper>

      {/* Sticky Cart Panel */}
      <StickyCartPanel />
    </div>
  );
};