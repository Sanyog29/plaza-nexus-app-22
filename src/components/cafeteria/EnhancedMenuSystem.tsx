import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Heart, Clock, Star, MapPin, ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import MenuData from './MenuData';
import OrderModal from './OrderModal';
import { useToast } from '@/hooks/use-toast';

interface EnhancedMenuSystemProps {
  onOrderComplete?: () => void;
}

export const EnhancedMenuSystem: React.FC<EnhancedMenuSystemProps> = ({ onOrderComplete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    vegetarian: false,
    vegan: false,
    available: true,
    priceRange: '',
    cuisineType: '',
    spiceLevel: '',
    rating: '',
  });
  const [sortBy, setSortBy] = useState('popularity');
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch user's loyalty points
  const { data: loyaltyPoints = 0 } = useQuery({
    queryKey: ['loyalty-points'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return 0;

      const { data, error } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (error) return 0;
      return data?.points || 0;
    },
  });

  // Fetch user's dietary preferences
  const { data: dietaryPreferences } = useQuery({
    queryKey: ['dietary-preferences'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('dietary_preferences')
        .select('*')
        .eq('user_id', user.user.id)
        .maybeSingle();

      return data;
    },
  });

  // Smart filter suggestions based on dietary preferences
  const smartFilterSuggestions = useMemo(() => {
    if (!dietaryPreferences) return [];

    const suggestions = [];
    if (dietaryPreferences.dietary_restrictions?.includes('Vegetarian')) {
      suggestions.push({ type: 'vegetarian', label: 'Vegetarian' });
    }
    if (dietaryPreferences.dietary_restrictions?.includes('Vegan')) {
      suggestions.push({ type: 'vegan', label: 'Vegan' });
    }
    if (dietaryPreferences.spice_tolerance) {
      suggestions.push({ 
        type: 'spiceLevel', 
        label: `${dietaryPreferences.spice_tolerance} spice`,
        value: dietaryPreferences.spice_tolerance 
      });
    }

    return suggestions;
  }, [dietaryPreferences]);

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    setOrderModalOpen(true);
  };

  const handleOrderModalClose = () => {
    setOrderModalOpen(false);
    setSelectedItem(null);
    onOrderComplete?.();
  };

  const applySmartFilter = (suggestion: any) => {
    if (suggestion.type === 'spiceLevel') {
      setActiveFilters(prev => ({ ...prev, spiceLevel: suggestion.value }));
    } else {
      setActiveFilters(prev => ({ ...prev, [suggestion.type]: true }));
    }
    toast({
      title: "Smart Filter Applied",
      description: `Showing items matching your ${suggestion.label} preference`,
    });
  };

  const clearFilters = () => {
    setActiveFilters({
      vegetarian: false,
      vegan: false,
      available: true,
      priceRange: '',
      cuisineType: '',
      spiceLevel: '',
      rating: '',
    });
    setSearchTerm('');
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length + (searchTerm ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Smart Suggestions */}
      {smartFilterSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ChefHat className="h-5 w-5 text-primary" />
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {smartFilterSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applySmartFilter(suggestion)}
                  className="text-xs"
                >
                  <Heart className="h-3 w-3 mr-1 text-pink-500" />
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for dishes, restaurants, or cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeFilters.vegetarian ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilters(prev => ({ ...prev, vegetarian: !prev.vegetarian }))}
              >
                🥬 Vegetarian
              </Button>
              <Button
                variant={activeFilters.vegan ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilters(prev => ({ ...prev, vegan: !prev.vegan }))}
              >
                🌱 Vegan
              </Button>
              <Button
                variant={activeFilters.available ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilters(prev => ({ ...prev, available: !prev.available }))}
              >
                ⚡ Available Now
              </Button>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={activeFilters.priceRange} onValueChange={(value) => setActiveFilters(prev => ({ ...prev, priceRange: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Prices</SelectItem>
                  <SelectItem value="0-50">₹0 - ₹50</SelectItem>
                  <SelectItem value="50-100">₹50 - ₹100</SelectItem>
                  <SelectItem value="100-200">₹100 - ₹200</SelectItem>
                  <SelectItem value="200+">₹200+</SelectItem>
                </SelectContent>
              </Select>

              <Select value={activeFilters.cuisineType} onValueChange={(value) => setActiveFilters(prev => ({ ...prev, cuisineType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Cuisine Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cuisines</SelectItem>
                  <SelectItem value="indian">Indian</SelectItem>
                  <SelectItem value="chinese">Chinese</SelectItem>
                  <SelectItem value="italian">Italian</SelectItem>
                  <SelectItem value="continental">Continental</SelectItem>
                  <SelectItem value="south-indian">South Indian</SelectItem>
                </SelectContent>
              </Select>

              <Select value={activeFilters.spiceLevel} onValueChange={(value) => setActiveFilters(prev => ({ ...prev, spiceLevel: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Spice Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Spice</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="very_hot">Very Hot</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="prep-time">Preparation Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <div className="flex justify-between items-center">
                <Badge variant="secondary">
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Info Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Loyalty Points: <strong>{loyaltyPoints}</strong></span>
              </div>
              {dietaryPreferences && (
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="text-sm">Preferences Configured</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Avg delivery: 15-30 mins</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Content */}
      <MenuData
        onSelectItem={handleItemSelect}
        searchTerm={searchTerm}
        filters={activeFilters}
      />

      {/* Order Modal */}
      {selectedItem && (
        <OrderModal
          isOpen={orderModalOpen}
          onClose={handleOrderModalClose}
          item={selectedItem}
          loyaltyPoints={loyaltyPoints}
        />
      )}
    </div>
  );
};