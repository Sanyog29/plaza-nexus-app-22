import React, { useState } from 'react';
import { Search, Filter, Leaf, Coffee, Utensils } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedFilters: {
    vegetarian: boolean;
    vegan: boolean;
    available: boolean;
    priceRange: string;
  };
  onFiltersChange: (filters: any) => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedFilters,
  onFiltersChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const priceRanges = [
    { label: 'Under ₹50', value: '0-50' },
    { label: '₹50-100', value: '50-100' },
    { label: '₹100-200', value: '100-200' },
    { label: 'Above ₹200', value: '200+' },
  ];

  const activeFiltersCount = Object.values(selectedFilters).filter(v => 
    typeof v === 'boolean' ? v : v !== ''
  ).length;

  const clearFilters = () => {
    onFiltersChange({
      vegetarian: false,
      vegan: false,
      available: true,
      priceRange: '',
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search for dishes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card border-input"
        />
      </div>

      {/* Quick Filters and Filter Button */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={selectedFilters.vegetarian ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({
            ...selectedFilters,
            vegetarian: !selectedFilters.vegetarian
          })}
          className="h-8"
        >
          <Leaf className="h-3 w-3 mr-1" />
          Vegetarian
        </Button>

        <Button
          variant={selectedFilters.vegan ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({
            ...selectedFilters,
            vegan: !selectedFilters.vegan
          })}
          className="h-8"
        >
          <Utensils className="h-3 w-3 mr-1" />
          Vegan
        </Button>

        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3 w-3 mr-1" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuCheckboxItem
              checked={selectedFilters.available}
              onCheckedChange={(checked) => onFiltersChange({
                ...selectedFilters,
                available: !!checked
              })}
            >
              Available Only
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Price Range</DropdownMenuLabel>
            {priceRanges.map((range) => (
              <DropdownMenuCheckboxItem
                key={range.value}
                checked={selectedFilters.priceRange === range.value}
                onCheckedChange={(checked) => onFiltersChange({
                  ...selectedFilters,
                  priceRange: checked ? range.value : ''
                })}
              >
                {range.label}
              </DropdownMenuCheckboxItem>
            ))}

            {activeFiltersCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full justify-start h-8"
                >
                  Clear All Filters
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedFilters.vegetarian && (
            <Badge variant="secondary" className="text-xs">
              Vegetarian
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => onFiltersChange({...selectedFilters, vegetarian: false})}
              >
                ×
              </Button>
            </Badge>
          )}
          {selectedFilters.vegan && (
            <Badge variant="secondary" className="text-xs">
              Vegan
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => onFiltersChange({...selectedFilters, vegan: false})}
              >
                ×
              </Button>
            </Badge>
          )}
          {selectedFilters.priceRange && (
            <Badge variant="secondary" className="text-xs">
              {priceRanges.find(r => r.value === selectedFilters.priceRange)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => onFiltersChange({...selectedFilters, priceRange: ''})}
              >
                ×
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;