import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MaintenanceProcess {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  display_order: number;
  property_id: string;
}

export interface CreateProcessInput {
  name: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateProcessInput {
  name?: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

export const useProcesses = (activeOnly: boolean = false, propertyId?: string | null) => {
  const [processes, setProcesses] = useState<MaintenanceProcess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProcesses = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('maintenance_processes')
        .select('*')
        .order('display_order', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      // Filter by property if provided
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProcesses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch processes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addProcess = async (input: CreateProcessInput) => {
    if (!propertyId) {
      toast({
        title: "Error",
        description: "Please select a property first",
        variant: "destructive",
      });
      throw new Error("Property ID is required");
    }

    try {
      const { data, error } = await supabase
        .from('maintenance_processes')
        .insert([{
          name: input.name,
          description: input.description || null,
          is_active: input.is_active ?? true,
          display_order: input.display_order ?? processes.length,
          property_id: propertyId,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Process Created",
        description: `"${input.name}" has been added successfully`,
      });

      await fetchProcesses();
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create process",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProcess = async (id: string, input: UpdateProcessInput) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_processes')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Process Updated",
        description: `"${data.name}" has been updated successfully`,
      });

      await fetchProcesses();
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update process",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProcess = async (id: string, processName: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_processes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Process Deleted",
        description: `"${processName}" has been removed`,
        variant: "destructive",
      });

      await fetchProcesses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete process",
        variant: "destructive",
      });
      throw error;
    }
  };

  const toggleProcessStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_processes')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: data.is_active ? "Process Activated" : "Process Deactivated",
        description: `"${data.name}" is now ${data.is_active ? 'active' : 'inactive'}`,
      });

      await fetchProcesses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update process status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const reorderProcesses = async (processIds: string[]) => {
    try {
      const updates = processIds.map((id, index) => 
        supabase
          .from('maintenance_processes')
          .update({ display_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);

      toast({
        title: "Order Updated",
        description: "Process order has been saved successfully",
      });

      await fetchProcesses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update process order",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, [activeOnly, propertyId]);

  return {
    processes,
    isLoading,
    fetchProcesses,
    addProcess,
    updateProcess,
    deleteProcess,
    toggleProcessStatus,
    reorderProcesses,
  };
};
