import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

// Cache durations in milliseconds
export const CACHE_TIMES = {
  STATIC: 30 * 60 * 1000,      // 30 minutes for rarely changing data
  SEMI_STATIC: 5 * 60 * 1000,  // 5 minutes for occasionally changing data
  DYNAMIC: 60 * 1000,          // 1 minute for frequently changing data
  REAL_TIME: 10 * 1000,        // 10 seconds for real-time data
};

interface OptimizedQueryOptions<T> {
  queryKey: string[];
  table: TableName;
  selectQuery?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  cacheTime?: number;
  enabled?: boolean;
}

export function useOptimizedQuery<T>({
  queryKey,
  table,
  selectQuery = '*',
  filters = {},
  orderBy,
  limit,
  cacheTime = CACHE_TIMES.DYNAMIC,
  enabled = true,
}: OptimizedQueryOptions<T>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from(table as any).select(selectQuery as any);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
      
      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }
      
      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as T;
    },
    staleTime: cacheTime,
    gcTime: cacheTime * 2,
    enabled,
  });
}

// Optimized queries for commonly used data
export const useStaticCategories = () => 
  useOptimizedQuery({
    queryKey: ['categories', 'static'],
    table: 'categories',
    cacheTime: CACHE_TIMES.STATIC,
  });

export const useStaticRooms = () => 
  useOptimizedQuery({
    queryKey: ['rooms', 'static'],
    table: 'rooms',
    cacheTime: CACHE_TIMES.STATIC,
  });

export const useUserRequests = (userId: string) => 
  useOptimizedQuery({
    queryKey: ['requests', 'user', userId],
    table: 'maintenance_requests',
    filters: { reported_by: userId },
    orderBy: { column: 'created_at', ascending: false },
    cacheTime: CACHE_TIMES.DYNAMIC,
    enabled: !!userId,
  });

export const useRealtimeMetrics = () => 
  useOptimizedQuery({
    queryKey: ['metrics', 'realtime'],
    table: 'performance_metrics',
    orderBy: { column: 'metric_date', ascending: false },
    limit: 7, // Last 7 days
    cacheTime: CACHE_TIMES.REAL_TIME,
  });