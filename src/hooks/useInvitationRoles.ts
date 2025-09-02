import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InvitationRole {
  id: string;
  title: string;
  slug: string;
  app_role: string;
  is_active: boolean;
  requires_specialization: boolean;
  color_class?: string;
  sort_order: number;
}

export const useInvitationRoles = () => {
  const [roles, setRoles] = useState<InvitationRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('invitation_roles')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) {
          setError(error.message);
          console.error('Error fetching invitation roles:', error);
        } else {
          setRoles(data || []);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error fetching invitation roles:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const getRoleByTitle = (title: string) => {
    return roles.find(role => role.title === title || role.app_role === title);
  };

  const getRoleColor = (role: string) => {
    const foundRole = getRoleByTitle(role);
    return foundRole?.color_class || 'bg-primary';
  };

  const requiresSpecialization = (role: string) => {
    const foundRole = getRoleByTitle(role);
    return foundRole?.requires_specialization || false;
  };

  return {
    roles,
    isLoading,
    error,
    getRoleByTitle,
    getRoleColor,
    requiresSpecialization,
  };
};