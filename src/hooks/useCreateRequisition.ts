import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';

export interface SelectedItem {
  item_master_id: string;
  item_name: string;
  category_name: string;
  unit: string;
  unit_limit: number;
  quantity: number;
  description?: string;
}

export interface RequisitionFormData {
  property_id: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expected_delivery_date: string | null;
  notes: string;
}

export const useCreateRequisition = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<RequisitionFormData>({
    property_id: '',
    priority: 'normal',
    expected_delivery_date: null,
    notes: '',
  });
  
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const addItem = (item: SelectedItem) => {
    const exists = selectedItems.find(i => i.item_master_id === item.item_master_id);
    if (exists) {
      toast.warning('Item already added');
      return;
    }
    setSelectedItems([...selectedItems, item]);
    toast.success('Item added to requisition');
  };

  const removeItem = (itemMasterId: string) => {
    setSelectedItems(selectedItems.filter(i => i.item_master_id !== itemMasterId));
    toast.success('Item removed');
  };

  const updateQuantity = (itemMasterId: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.item_master_id === itemMasterId 
        ? { ...item, quantity }
        : item
    ));
  };

  const generateOrderNumber = async (): Promise<string> => {
    const today = format(new Date(), 'yyyyMMdd');
    const prefix = `REQ-${today}-`;
    
    const { count } = await supabase
      .from('requisition_lists')
      .select('*', { count: 'exact', head: true })
      .like('order_number', `${prefix}%`);
    
    const nextNumber = (count || 0) + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  };

  const validateForm = (): boolean => {
    if (!formData.property_id) {
      toast.error('Please select a property');
      return false;
    }
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item');
      return false;
    }
    return true;
  };

  const calculateTotalItems = (): number => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const saveDraft = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!validateForm()) throw new Error('Validation failed');
      
      const { data: requisition, error: reqError } = await supabase
        .from('requisition_lists')
        .insert({
          created_by: user.id,
          created_by_name: user.email || '',
          status: 'draft',
          priority: formData.priority,
          expected_delivery_date: formData.expected_delivery_date,
          notes: formData.notes,
          total_items: calculateTotalItems(),
        })
        .select()
        .single();
      
      if (reqError) throw reqError;

      const items = selectedItems.map(item => ({
        requisition_list_id: requisition.id,
        item_master_id: item.item_master_id,
        item_name: item.item_name,
        category_name: item.category_name,
        unit: item.unit,
        unit_limit: item.unit_limit,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('requisition_list_items')
        .insert(items);
      
      if (itemsError) throw itemsError;

      return requisition.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      toast.success('Draft saved successfully');
      setSelectedItems([]);
      setFormData({
        property_id: '',
        priority: 'normal',
        expected_delivery_date: null,
        notes: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save draft');
    },
  });

  const submitForApproval = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!validateForm()) throw new Error('Validation failed');
      
      const { data: requisition, error: reqError } = await supabase
        .from('requisition_lists')
        .insert({
          created_by: user.id,
          created_by_name: user.email || '',
          status: 'pending_manager_approval',
          priority: formData.priority,
          expected_delivery_date: formData.expected_delivery_date,
          notes: formData.notes,
          total_items: calculateTotalItems(),
        })
        .select()
        .single();
      
      if (reqError) throw reqError;

      const items = selectedItems.map(item => ({
        requisition_list_id: requisition.id,
        item_master_id: item.item_master_id,
        item_name: item.item_name,
        category_name: item.category_name,
        unit: item.unit,
        unit_limit: item.unit_limit,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('requisition_list_items')
        .insert(items);
      
      if (itemsError) throw itemsError;

      return requisition.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      toast.success('Requisition submitted for approval');
      setSelectedItems([]);
      setFormData({
        property_id: '',
        priority: 'normal',
        expected_delivery_date: null,
        notes: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit requisition');
    },
  });

  return {
    formData,
    setFormData,
    selectedItems,
    currentStep,
    setCurrentStep,
    addItem,
    removeItem,
    updateQuantity,
    saveDraft,
    submitForApproval,
    validateForm,
    calculateTotalItems,
  };
};
