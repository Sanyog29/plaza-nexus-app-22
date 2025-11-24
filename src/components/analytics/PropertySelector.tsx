import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Globe } from 'lucide-react';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { useAuth } from '@/components/AuthProvider';
import { getRoleLevel } from '@/constants/roles';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PropertySelectorProps {
  value?: string | null; // Optional - uses context by default
  onChange?: (propertyId: string | null) => void; // Optional - updates context by default
  className?: string;
  variant?: 'default' | 'header';
}

export const PropertySelector: React.FC<PropertySelectorProps> = ({
  value: propValue,
  onChange: propOnChange,
  className,
  variant = 'default'
}) => {
  const { userRole } = useAuth();
  const { availableProperties, currentProperty, switchProperty } = usePropertyContext();
  const roleLevel = getRoleLevel(userRole);
  const isProcurementRole = userRole === 'purchase_executive' || userRole === 'procurement_manager';
  
  // Use context value if no prop value provided
  const value = propValue !== undefined ? propValue : currentProperty?.id;
  
  // L2 and L1: No property selector (unless they're procurement roles)
  if (!isProcurementRole && (roleLevel === 'L2' || roleLevel === 'L1')) {
    return null;
  }

  // Fetch real-time ticket counts per property
  const { data: propertyStats } = useQuery({
    queryKey: ['property-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenance_requests')
        .select('property_id, status')
        .is('deleted_at', null)
        .in('status', ['pending', 'in_progress', 'assigned']);
      
      const stats = data?.reduce((acc, req) => {
        if (req.property_id) {
          if (!acc[req.property_id]) acc[req.property_id] = 0;
          acc[req.property_id]++;
        }
        return acc;
      }, {} as Record<string, number>);
      
      return stats || {};
    },
    refetchInterval: 30000,
  });

  // L3: Show assigned properties only, L4+: Show all properties
  // Procurement roles: Always show "All Properties" option
  const showAllOption = isProcurementRole || roleLevel === 'L4+' || (roleLevel === 'L3' && availableProperties.length > 1);
  const selectedProperty = availableProperties.find(p => p.id === value);
  
  const handleChange = (v: string) => {
    const newValue = v === 'all' ? null : v;
    // Update PropertyContext
    switchProperty(newValue);
    // Also call onChange callback if provided
    if (propOnChange) {
      propOnChange(newValue);
    }
  };

  return (
    <Select value={value || 'all'} onValueChange={handleChange}>
      <SelectTrigger className={cn(
        variant === 'header' ? "w-[280px] bg-background" : "w-[300px]",
        className
      )}>
        <div className="flex items-center gap-2">
          {value ? <Building2 className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
          <SelectValue>
            {value 
              ? selectedProperty?.name 
              : (isProcurementRole || roleLevel === 'L4+') ? 'All Properties' : 'All My Properties'}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <>
            <SelectItem value="all">
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-semibold">
                    {(isProcurementRole || roleLevel === 'L4+') ? 'All Properties' : 'All My Properties'}
                  </span>
                </div>
                {propertyStats && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.values(propertyStats).reduce((sum, count) => sum + count, 0)}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <Separator className="my-1" />
          </>
        )}
        {availableProperties.map(property => (
          <SelectItem key={property.id} value={property.id}>
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{property.name}</span>
              </div>
              {propertyStats?.[property.id] && (
                <Badge variant="secondary" className="ml-2">{propertyStats[property.id]}</Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
