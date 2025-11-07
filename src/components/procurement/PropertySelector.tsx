import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface PropertySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  showAllOption?: boolean;
}

export function PropertySelector({ 
  value, 
  onValueChange,
  showAllOption = false 
}: PropertySelectorProps) {
  const { user, isSuperAdmin } = useAuth();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties-selector', user?.id, isSuperAdmin],
    queryFn: async () => {
      if (!user) return [];

      if (isSuperAdmin) {
        // @ts-ignore - Supabase type inference issue
        const { data, error } = await supabase
          .from('properties')
          .select('id, name, code')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        return data || [];
      }

      // @ts-ignore
      const { data: assignments, error } = await supabase
        .from('property_assignments')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!assignments?.length) return [];

      const ids = assignments.map((a: any) => a.property_id);
      
      // @ts-ignore
      const { data: props, error: propsError } = await supabase
        .from('properties')
        .select('id, name, code')
        .in('id', ids)
        .order('name');

      if (propsError) throw propsError;
      return props || [];
    },
    enabled: !!user,
  });

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger className="w-[280px]">
        <Building2 className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select location..." />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && isSuperAdmin && (
          <SelectItem value="all">All Locations</SelectItem>
        )}
        {properties?.map((property: any) => (
          <SelectItem key={property.id} value={property.id}>
            {property.name} {property.code && `(${property.code})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
