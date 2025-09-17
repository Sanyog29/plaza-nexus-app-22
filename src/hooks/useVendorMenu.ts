import { useOptimizedQuery, CACHE_TIMES } from './useOptimizedQuery';
import { Database } from '@/integrations/supabase/types';

type MenuCategory = Database['public']['Tables']['cafeteria_menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['vendor_menu_items']['Row'];

export const useVendorMenuCategories = (vendorId: string) => 
  useOptimizedQuery<MenuCategory[]>({
    queryKey: ['vendor', 'menu-categories', vendorId],
    table: 'cafeteria_menu_categories',
    filters: { vendor_id: vendorId },
    orderBy: { column: 'display_order', ascending: true },
    cacheTime: CACHE_TIMES.SEMI_STATIC,
    enabled: !!vendorId,
  });

export const useVendorMenuItems = (vendorId: string, categoryId?: string) => 
  useOptimizedQuery<MenuItem[]>({
    queryKey: ['vendor', 'menu-items', vendorId, categoryId || 'all'],
    table: 'vendor_menu_items',
    filters: categoryId 
      ? { category_id: categoryId, vendor_id: vendorId }
      : { vendor_id: vendorId },
    orderBy: { column: 'name', ascending: true },
    cacheTime: CACHE_TIMES.DYNAMIC,
    enabled: !!vendorId,
  });