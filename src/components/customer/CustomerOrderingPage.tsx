import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VendorCard } from './VendorCard';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface Vendor {
  id: string;
  name: string;
  logo_url?: string;
  cuisine_type: string;
  average_rating: number;
  is_active: boolean;
  store_config?: any;
}

export const CustomerOrderingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');

  // Fetch active vendors
  const { data: vendors, isLoading, error } = useQuery({
    queryKey: ['customer-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, logo_url, cuisine_type, average_rating, is_active, store_config')
        .eq('is_active', true)
        .order('average_rating', { ascending: false });

      if (error) throw error;
      return data as Vendor[];
    },
  });

  // Get unique cuisine types for filtering
  const cuisineTypes = React.useMemo(() => {
    if (!vendors) return [];
    const types = [...new Set(vendors.map(v => v.cuisine_type).filter(Boolean))];
    return types.sort();
  }, [vendors]);

  // Filter vendors based on search and cuisine
  const filteredVendors = React.useMemo(() => {
    if (!vendors) return [];
    
    return vendors.filter(vendor => {
      const matchesSearch = !searchTerm || 
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCuisine = !selectedCuisine || vendor.cuisine_type === selectedCuisine;
      
      return matchesSearch && matchesCuisine;
    });
  }, [vendors, searchTerm, selectedCuisine]);

  const VendorSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <UtensilsCrossed className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Vendors Found</h3>
      <p className="text-muted-foreground">
        {searchTerm || selectedCuisine 
          ? "Try adjusting your search or filter criteria."
          : "No food vendors are currently available."}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Order Food</h1>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search restaurants and cuisines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Cuisine Filter */}
        {cuisineTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCuisine === '' ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setSelectedCuisine('')}
            >
              All
            </Badge>
            {cuisineTypes.map(cuisine => (
              <Badge
                key={cuisine}
                variant={selectedCuisine === cuisine ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedCuisine(cuisine)}
              >
                {cuisine}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Vendors Grid */}
      <LoadingWrapper
        loading={isLoading}
        error={error}
        skeleton={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <VendorSkeleton key={i} />
            ))}
          </div>
        }
        emptyState={<EmptyState />}
        isEmpty={!filteredVendors?.length}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors?.map(vendor => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
            />
          ))}
        </div>
      </LoadingWrapper>
    </div>
  );
};