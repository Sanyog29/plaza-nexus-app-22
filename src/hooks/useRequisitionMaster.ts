import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRequisitionMaster = () => {
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['requisition-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch items
  const fetchItems = (categoryId?: string) => {
    return useQuery({
      queryKey: ['requisition-items', categoryId],
      queryFn: async () => {
        let query = supabase
          .from('requisition_items_master')
          .select(`
            *,
            category:requisition_categories(id, name, icon)
          `)
          .eq('is_active', true)
          .order('item_name');
        
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
      },
    });
  };

  // Create category
  const createCategory = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('requisition_categories')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisition-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  // Create item
  const createItem = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('requisition_items_master')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisition-items'] });
      toast.success('Item created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create item');
    },
  });

  // Update item
  const updateItem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('requisition_items_master')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisition-items'] });
      toast.success('Item updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update item');
    },
  });

  // Toggle item active status
  const toggleItemActive = useMutation({
    mutationFn: async (id: string) => {
      const { data: item } = await supabase
        .from('requisition_items_master')
        .select('is_active')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('requisition_items_master')
        .update({ is_active: !item?.is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisition-items'] });
      toast.success('Item status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update item status');
    },
  });

  return {
    categories,
    categoriesLoading,
    fetchItems,
    createCategory,
    createItem,
    updateItem,
    toggleItemActive,
  };
};
