import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Globe } from 'lucide-react';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { Badge } from '@/components/ui/badge';

export const PropertySelector: React.FC = () => {
  const { currentProperty, availableProperties, isSuperAdmin, switchProperty, isLoadingProperties } = usePropertyContext();

  if (isLoadingProperties) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md animate-pulse">
        <Building2 className="w-4 h-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (availableProperties.length === 0) {
    return null;
  }

  // Hide selector if only one property and not super admin
  if (availableProperties.length === 1 && !isSuperAdmin) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md">
        <Building2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{availableProperties[0].name}</span>
        {availableProperties[0].isPrimary && (
          <Badge variant="secondary" className="text-xs">Primary</Badge>
        )}
      </div>
    );
  }

  return (
    <Select
      value={currentProperty?.id || 'all'}
      onValueChange={(value) => switchProperty(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-[220px] bg-card">
        <div className="flex items-center gap-2">
          {currentProperty ? (
            <Building2 className="w-4 h-4 text-primary" />
          ) : (
            <Globe className="w-4 h-4 text-primary" />
          )}
          <SelectValue placeholder="Select property" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {isSuperAdmin && (
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="font-medium">All Properties</span>
              <Badge variant="default" className="text-xs ml-auto">Aggregate</Badge>
            </div>
          </SelectItem>
        )}
        {availableProperties.map((property) => (
          <SelectItem key={property.id} value={property.id}>
            <div className="flex items-center gap-2 w-full">
              <Building2 className="w-4 h-4" />
              <span>{property.name}</span>
              {property.isPrimary && (
                <Badge variant="secondary" className="text-xs ml-auto">Primary</Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};