import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface ContentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentItem {
  id: string;
  category_id?: string;
  title: string;
  content: string;
  content_type: string;
  file_url?: string;
  file_size?: number;
  version: number;
  is_published: boolean;
  published_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  category?: ContentCategory;
}

export const useContentManagement = () => {
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching content categories:', error);
      toast({
        title: "Error",
        description: "Failed to load content categories: " + error.message,
        variant: "destructive",
      });
    }
  };

  const fetchContentItems = async (published_only: boolean = true) => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('content_items')
        .select(`
          *,
          category:content_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (published_only && !isAdmin) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContentItems(data || []);
    } catch (error: any) {
      console.error('Error fetching content items:', error);
      toast({
        title: "Error",
        description: "Failed to load content items: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createContentItem = async (itemData: {
    title: string;
    content: string;
    content_type?: string;
    category_id?: string;
    file_url?: string;
    file_size?: number;
    is_published?: boolean;
  }) => {
    if (!isAdmin) return null;

    try {
      const { data, error } = await supabase
        .from('content_items')
        .insert({
          ...itemData,
          content_type: itemData.content_type || 'text',
          created_by: user?.id,
          updated_by: user?.id,
          published_at: itemData.is_published ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content item created successfully",
      });

      await fetchContentItems(false); // Refresh list
      return data;
    } catch (error: any) {
      console.error('Error creating content item:', error);
      toast({
        title: "Error",
        description: "Failed to create content item: " + error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateContentItem = async (id: string, updates: Partial<ContentItem>) => {
    if (!isAdmin) return false;

    try {
      const updateData = {
        ...updates,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      };

      // If publishing, set published_at
      if (updates.is_published && !updates.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('content_items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content item updated successfully",
      });

      await fetchContentItems(false);
      return true;
    } catch (error: any) {
      console.error('Error updating content item:', error);
      toast({
        title: "Error",
        description: "Failed to update content item: " + error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteContentItem = async (id: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content item deleted successfully",
      });

      await fetchContentItems(false);
      return true;
    } catch (error: any) {
      console.error('Error deleting content item:', error);
      toast({
        title: "Error",
        description: "Failed to delete content item: " + error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const createCategory = async (categoryData: {
    name: string;
    description?: string;
    icon?: string;
    display_order?: number;
  }) => {
    if (!isAdmin) return null;

    try {
      const { data, error } = await supabase
        .from('content_categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category created successfully",
      });

      await fetchCategories();
      return data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category: " + error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const getContentByCategory = (categoryId: string) => {
    return contentItems.filter(item => item.category_id === categoryId);
  };

  const getPublishedContent = () => {
    return contentItems.filter(item => item.is_published);
  };

  useEffect(() => {
    fetchCategories();
    fetchContentItems(!isAdmin);
  }, [isAdmin]);

  return {
    categories,
    contentItems,
    isLoading,
    fetchCategories,
    fetchContentItems,
    createContentItem,
    updateContentItem,
    deleteContentItem,
    createCategory,
    getContentByCategory,
    getPublishedContent
  };
};