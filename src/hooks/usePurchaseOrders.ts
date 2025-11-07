import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
      const { data, error } = await supabase.functions.invoke('accept-requisition', {
        body: { requisition_id: requisitionId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-stats'] });
      
      const message = data.message 
        ? `${data.message}: ${data.purchase_order.po_number}`
        : `PO ${data.purchase_order.po_number} created successfully`;
      
      toast({
        title: 'Purchase Order Created',
        description: message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePOStatusMutation = useMutation({
    mutationFn: async ({ poId, status, notes }: { poId: string; status: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status, notes, updated_at: new Date().toISOString() })
        .eq('id', poId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast({
        title: 'Status Updated',
        description: 'Purchase order status updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
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
