import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProcurementErrorHandler } from '@/lib/procurement/errorHandler';

export const usePurchaseOrders = () => {
  const queryClient = useQueryClient();

  const purchaseOrdersQuery = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          requisition_list:requisition_lists(order_number),
          property:properties(name),
          acceptor:profiles!purchase_orders_accepted_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const acceptRequisitionMutation = useMutation({
    mutationFn: async (requisitionId: string) => {
      console.log('Calling accept-requisition function for requisition:', requisitionId);
      
      // Use retry wrapper for network resilience
      return await ProcurementErrorHandler.withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('accept-requisition', {
            body: { requisition_id: requisitionId }
          });

          if (error) {
            console.error('Error from accept-requisition function:', error);
            throw error;
          }

          if (data?.error) {
            console.error('Error in response data:', data.error);
            throw new Error(data.error);
          }

          console.log('Purchase order created successfully:', data);
          return data;
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          showToast: false, // We'll handle toast in onSuccess/onError
        }
      );
    },
    onSuccess: (data) => {
      if (!data) return;
      
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-stats'] });
      
      const message = data.message 
        ? `${data.message}: ${data.purchase_order?.po_number || ''}`
        : `PO ${data.purchase_order?.po_number || ''} created successfully`;
      
      toast({
        title: 'Purchase Order Created',
        description: message,
      });
    },
    onError: (error: unknown) => {
      console.error('Mutation error:', error);
      const procError = ProcurementErrorHandler.parse(error);
      toast({
        title: procError.message,
        description: procError.details,
        variant: 'destructive',
      });
    },
  });

  const updatePOStatusMutation = useMutation({
    mutationFn: async ({ poId, status, notes, version }: { 
      poId: string; 
      status: string; 
      notes?: string;
      version?: number;
    }) => {
      // Optimistic locking: include version in update if provided
      let query = supabase
        .from('purchase_orders')
        .update({ status, notes, updated_at: new Date().toISOString() })
        .eq('id', poId);
      
      // Add version check for optimistic locking
      if (version !== undefined) {
        query = query.eq('version', version);
      }
      
      const { data, error, count } = await query.select().single();

      if (error) throw error;
      
      // Check if any rows were updated (version conflict detection)
      if (!data && version !== undefined) {
        throw new Error('Data was modified by another user. Please refresh and try again.');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast({
        title: 'Status Updated',
        description: 'Purchase order status updated successfully',
      });
    },
    onError: (error: unknown) => {
      const procError = ProcurementErrorHandler.parse(error);
      toast({
        title: procError.message,
        description: procError.details,
        variant: 'destructive',
      });
    },
  });

  return {
    purchaseOrders: purchaseOrdersQuery.data || [],
    isLoading: purchaseOrdersQuery.isLoading,
    isError: purchaseOrdersQuery.isError,
    acceptRequisition: acceptRequisitionMutation.mutate,
    isAccepting: acceptRequisitionMutation.isPending,
    updatePOStatus: updatePOStatusMutation.mutate,
    isUpdatingStatus: updatePOStatusMutation.isPending,
  };
};

export const usePurchaseOrderDetail = (poId: string) => {
  return useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          requisition_list:requisition_lists(order_number, created_by_name),
          property:properties(name, code),
          acceptor:profiles!purchase_orders_accepted_by_fkey(first_name, last_name, email),
          items:purchase_order_items(*)
        `)
        .eq('id', poId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!poId,
  });
};
