import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { getRoleLevel } from '@/constants/roles';

// Fake property ID used for "Unassigned" placeholder
const FAKE_PROPERTY_ID = '00000000-0000-0000-0000-000000000001';

export interface Property {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  property_type?: string;
  status: string;
  isPrimary?: boolean;
}

interface PropertyContextType {
  currentProperty: Property | null;
  availableProperties: Property[];
  isSuperAdmin: boolean;
  isLoadingProperties: boolean;
  switchProperty: (propertyId: string | null) => Promise<void>;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const usePropertyContext = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('usePropertyContext must be used within PropertyProvider');
  }
  return context;
};

interface PropertyProviderProps {
  children: ReactNode;
}

export const PropertyProvider: React.FC<PropertyProviderProps> = ({ children }) => {
  const { user, userRole } = useAuth();
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      setIsSuperAdmin(!!data);
    };

    checkSuperAdmin();
  }, [user]);

  // Fetch available properties
  const refreshProperties = useCallback(async () => {
    if (!user) {
      setAvailableProperties([]);
      setCurrentProperty(null);
      setIsLoadingProperties(false);
      return;
    }
    
    const roleLevel = getRoleLevel(userRole);
    
    try {
      setIsLoadingProperties(true);

      // Use the RPC function to get user's properties
      const { data, error } = await supabase.rpc('get_user_properties', {
        _user_id: user.id
      });

      if (error) throw error;

      const allProperties: Property[] = (data || []).map((p: any) => ({
        id: p.property_id,
        name: p.property_name,
        code: p.property_code,
        status: 'active',
        isPrimary: p.is_primary
      }));

      // Filter out fake "Unassigned" property
      const properties = allProperties.filter(p => p.id !== FAKE_PROPERTY_ID);

      setAvailableProperties(properties);

      // Auto-select property based on user role
      const storedPropertyId = localStorage.getItem('current_property_id');
      
      // Ensure stored property is real and available
      if (storedPropertyId && 
          storedPropertyId !== FAKE_PROPERTY_ID && 
          properties.find(p => p.id === storedPropertyId)) {
        // Restore last selected property
        const selected = properties.find(p => p.id === storedPropertyId);
        setCurrentProperty(selected || null);
      } else if (roleLevel === 'L2' || roleLevel === 'L1') {
        // L2/L1: Auto-select primary property or first available real property
        const primary = properties.find(p => p.isPrimary);
        const selected = primary || properties[0] || null;
        
        setCurrentProperty(selected);
        if (selected) {
          localStorage.setItem('current_property_id', selected.id);
        } else {
          // No real properties available
          localStorage.removeItem('current_property_id');
        }
      } else {
        // L3/L4+: Default to "All Properties" (null)
        setCurrentProperty(null);
        localStorage.removeItem('current_property_id');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoadingProperties(false);
    }
  }, [user]);

  useEffect(() => {
    refreshProperties();
  }, [refreshProperties]);

  // Switch property
  const switchProperty = async (propertyId: string | null) => {
    if (!propertyId) {
      // "All Properties" mode for super admin
      setCurrentProperty(null);
      localStorage.removeItem('current_property_id');
      toast.success('Viewing all properties');
      return;
    }

    const property = availableProperties.find(p => p.id === propertyId);
    if (property) {
      setCurrentProperty(property);
      localStorage.setItem('current_property_id', property.id);
      toast.success(`Switched to ${property.name}`);
    }
  };

  return (
    <PropertyContext.Provider
      value={{
        currentProperty,
        availableProperties,
        isSuperAdmin,
        isLoadingProperties,
        switchProperty,
        refreshProperties,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};