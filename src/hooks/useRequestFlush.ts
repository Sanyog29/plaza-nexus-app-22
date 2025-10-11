import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface FlushFilters {
  dateFrom: Date;
  dateTo: Date;
  statuses: Array<'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'en_route'>;
}

export interface FlushResult {
  success: boolean;
  deletedCount: number;
  error?: string;
}

export function useRequestFlush() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const countRequests = useCallback(async (filters: FlushFilters): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', filters.dateFrom.toISOString())
        .lte('created_at', filters.dateTo.toISOString())
        .in('status', filters.statuses)
        .is('deleted_at', null);

      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      console.error('Error counting requests:', error);
      throw new Error(error.message || 'Failed to count requests');
    }
  }, []);

  const exportRequests = useCallback(async (filters: FlushFilters): Promise<void> => {
    try {
      const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          completed_at,
          reported_by,
          assigned_to
        `)
        .gte('created_at', filters.dateFrom.toISOString())
        .lte('created_at', filters.dateTo.toISOString())
        .in('status', filters.statuses)
        .is('deleted_at', null);

      if (error) throw error;

      // Create CSV content
      const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Created At', 'Completed At'];
      const csvContent = [
        headers.join(','),
        ...(requests || []).map(req => [
          req.id,
          `"${req.title?.replace(/"/g, '""') || ''}"`,
          `"${req.description?.replace(/"/g, '""') || ''}"`,
          req.status,
          req.priority,
          req.created_at,
          req.completed_at || ''
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance_requests_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${requests?.length || 0} requests to CSV`
      });
    } catch (error: any) {
      console.error('Error exporting requests:', error);
      throw new Error(error.message || 'Failed to export requests');
    }
  }, []);

  const flushRequests = useCallback(async (filters: FlushFilters): Promise<FlushResult> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Fetch all request IDs to delete
      const { data: requests, error: fetchError } = await supabase
        .from('maintenance_requests')
        .select('id')
        .gte('created_at', filters.dateFrom.toISOString())
        .lte('created_at', filters.dateTo.toISOString())
        .in('status', filters.statuses)
        .is('deleted_at', null);

      if (fetchError) throw fetchError;

      const requestIds = requests?.map(r => r.id) || [];
      
      if (requestIds.length === 0) {
        return { success: true, deletedCount: 0 };
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Process in batches of 100 to avoid timeout
      const batchSize = 100;
      let processed = 0;

      for (let i = 0; i < requestIds.length; i += batchSize) {
        const batch = requestIds.slice(i, i + batchSize);
        
        // Call the database function for soft delete
        const { error: deleteError } = await supabase.rpc('soft_delete_maintenance_requests', {
          request_ids: batch,
          deleted_by_user: user.id
        });

        if (deleteError) throw deleteError;

        processed += batch.length;
        setProgress(Math.round((processed / requestIds.length) * 100));
      }

      return {
        success: true,
        deletedCount: processed
      };
    } catch (error: any) {
      console.error('Error flushing requests:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error.message || 'Failed to flush requests'
      };
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  const restoreRequests = useCallback(async (requestIds: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('restore_soft_deleted_requests', {
        request_ids: requestIds
      });

      if (error) throw error;

      toast({
        title: "Restore Complete",
        description: `Successfully restored ${requestIds.length} requests`
      });

      return true;
    } catch (error: any) {
      console.error('Error restoring requests:', error);
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore requests",
        variant: "destructive"
      });
      return false;
    }
  }, []);

  return {
    isProcessing,
    progress,
    countRequests,
    exportRequests,
    flushRequests,
    restoreRequests
  };
}
