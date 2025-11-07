import React, { useState, createContext, useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';
import { generateRequisitionIdempotencyKey } from '@/lib/idempotency';
import { handleSupabaseError } from '@/lib/errorHandler';

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

type CreateRequisitionContextType = ReturnType<typeof useProvideCreateRequisition>;

const CreateRequisitionContext = createContext<CreateRequisitionContextType | null>(null);

function useProvideCreateRequisition(onComplete?: () => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [editMode, setEditMode] = useState(false);
  const [requisitionId, setRequisitionId] = useState<string | null>(null);
  const [isLoadingRequisition, setIsLoadingRequisition] = useState(false);
  
  const [formData, setFormData] = useState<RequisitionFormData>({
    property_id: '',
    priority: 'normal',
    expected_delivery_date: null,
    notes: '',
  });
  
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const loadRequisition = async (id: string) => {
    setIsLoadingRequisition(true);
    try {
      const { data: requisition, error: reqError } = await supabase
        .from('requisition_lists')
        .select('*')
        .eq('id', id)
        .single();

      if (reqError) throw reqError;

      if (requisition.status !== 'draft') {
        toast.error('Only draft requisitions can be edited');
        return false;
      }

      if (requisition.created_by !== user?.id) {
        toast.error('You can only edit your own requisitions');
        return false;
      }

      setFormData({
        property_id: requisition.property_id,
        priority: requisition.priority,
        expected_delivery_date: requisition.expected_delivery_date,
        notes: requisition.notes || '',
      });

      const { data: items, error: itemsError } = await supabase
        .from('requisition_list_items')
        .select('*')
        .eq('requisition_list_id', id);

      if (itemsError) throw itemsError;

      setSelectedItems(items.map(item => ({
        item_master_id: item.item_master_id,
        item_name: item.item_name,
        category_name: item.category_name,
        unit: item.unit,
        unit_limit: item.unit_limit,
        quantity: item.quantity,
        description: item.description,
      })));

      setEditMode(true);
      setRequisitionId(id);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to load requisition');
      return false;
    } finally {
      setIsLoadingRequisition(false);
    }
  };

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
    setSelectedItems(selectedItems.map(item => {
      if (item.item_master_id === itemMasterId) {
        // Ensure quantity doesn't exceed unit_limit
        const constrainedQuantity = Math.min(Math.max(quantity, 1), item.unit_limit);
        return { ...item, quantity: constrainedQuantity };
      }
      return item;
    }));
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
    
    // Validate each item quantity against unit_limit
    const invalidItems = selectedItems.filter(item => item.quantity > item.unit_limit);
    if (invalidItems.length > 0) {
      toast.error(
        `Some items exceed their limit: ${invalidItems.map(i => i.item_name).join(', ')}`
      );
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
      
      if (editMode && requisitionId) {
        // Update existing requisition
        const { error: reqError } = await supabase
          .from('requisition_lists')
          .update({
            priority: formData.priority,
            expected_delivery_date: formData.expected_delivery_date,
            notes: formData.notes,
            total_items: calculateTotalItems(),
          })
          .eq('id', requisitionId);
        
        if (reqError) {
          handleSupabaseError(reqError, { action: 'update_draft', requisition_id: requisitionId });
          throw reqError;
        }

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('requisition_list_items')
          .delete()
          .eq('requisition_list_id', requisitionId);
        
        if (deleteError) {
          handleSupabaseError(deleteError, { action: 'delete_items', requisition_id: requisitionId });
          throw deleteError;
        }

        // Insert updated items
        const items = selectedItems.map(item => ({
          requisition_list_id: requisitionId,
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
        
        if (itemsError) {
          handleSupabaseError(itemsError, { action: 'insert_items', requisition_id: requisitionId });
          throw itemsError;
        }

        return requisitionId;
      } else {
        // Create new requisition with idempotency
        const orderNumber = await generateOrderNumber();
        
        // Get property code for idempotency key
        const { data: property } = await supabase
          .from('properties')
          .select('code, name')
          .eq('id', formData.property_id)
          .single();
        
        const propertyCode = property?.code || 
          property?.name?.replace(/[^a-zA-Z]/g, '').substring(0, 5).toUpperCase() || 
          'GEN';
        
        // Generate idempotency key
        const idempotencyKey = generateRequisitionIdempotencyKey(propertyCode);
        
        console.log('Creating requisition with idempotency key:', idempotencyKey);
        
        const { data: requisition, error: reqError } = await supabase
          .from('requisition_lists')
          .insert({
            order_number: orderNumber,
            property_id: formData.property_id,
            created_by: user.id,
            created_by_name: user.email || '',
            status: 'draft',
            priority: formData.priority,
            expected_delivery_date: formData.expected_delivery_date,
            notes: formData.notes,
            total_items: calculateTotalItems(),
            idempotency_key: idempotencyKey,
          })
          .select()
          .single();
        
        if (reqError) {
          // Check if it's a duplicate key violation
          if (reqError.code === '23505' && reqError.message?.includes('idempotency_key')) {
            toast.warning('This requisition was already created. Redirecting...');
            // Try to find the existing requisition
            const { data: existing } = await supabase
              .from('requisition_lists')
              .select('id')
              .eq('idempotency_key', idempotencyKey)
              .single();
            
            return existing?.id || null;
          }
          
          handleSupabaseError(reqError, { 
            action: 'create_requisition', 
            idempotency_key: idempotencyKey 
          });
          throw reqError;
        }

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
        
        if (itemsError) {
          handleSupabaseError(itemsError, { 
            action: 'insert_items', 
            requisition_id: requisition.id 
          });
          throw itemsError;
        }

        return requisition.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['my-requisitions'] });
      toast.success(editMode ? 'Requisition updated successfully' : 'Draft saved successfully');
      if (onComplete) {
        onComplete();
      } else if (!editMode) {
        setSelectedItems([]);
        setFormData({
          property_id: '',
          priority: 'normal',
          expected_delivery_date: null,
          notes: '',
        });
        setCurrentStep(1);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save draft');
    },
  });

  const submitForApproval = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!validateForm()) throw new Error('Validation failed');
      
      if (editMode && requisitionId) {
        // Update existing requisition to pending
        const { error: reqError } = await supabase
          .from('requisition_lists')
          .update({
            status: 'pending_manager_approval',
            priority: formData.priority,
            expected_delivery_date: formData.expected_delivery_date,
            notes: formData.notes,
            total_items: calculateTotalItems(),
          })
          .eq('id', requisitionId);
        
        if (reqError) {
          handleSupabaseError(reqError, { action: 'submit_for_approval', requisition_id: requisitionId });
          throw reqError;
        }

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('requisition_list_items')
          .delete()
          .eq('requisition_list_id', requisitionId);
        
        if (deleteError) {
          handleSupabaseError(deleteError, { action: 'delete_items', requisition_id: requisitionId });
          throw deleteError;
        }

        // Insert updated items
        const items = selectedItems.map(item => ({
          requisition_list_id: requisitionId,
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
        
        if (itemsError) {
          handleSupabaseError(itemsError, { action: 'insert_items', requisition_id: requisitionId });
          throw itemsError;
        }

        return requisitionId;
      } else {
        // Create new requisition with idempotency
        const orderNumber = await generateOrderNumber();
        
        // Get property code for idempotency key
        const { data: property } = await supabase
          .from('properties')
          .select('code, name')
          .eq('id', formData.property_id)
          .single();
        
        const propertyCode = property?.code || 
          property?.name?.replace(/[^a-zA-Z]/g, '').substring(0, 5).toUpperCase() || 
          'GEN';
        
        // Generate idempotency key
        const idempotencyKey = generateRequisitionIdempotencyKey(propertyCode);
        
        console.log('Submitting requisition with idempotency key:', idempotencyKey);
        
        const { data: requisition, error: reqError } = await supabase
          .from('requisition_lists')
          .insert({
            order_number: orderNumber,
            property_id: formData.property_id,
            created_by: user.id,
            created_by_name: user.email || '',
            status: 'pending_manager_approval',
            priority: formData.priority,
            expected_delivery_date: formData.expected_delivery_date,
            notes: formData.notes,
            total_items: calculateTotalItems(),
            idempotency_key: idempotencyKey,
          })
          .select()
          .single();
        
        if (reqError) {
          // Check if it's a duplicate key violation
          if (reqError.code === '23505' && reqError.message?.includes('idempotency_key')) {
            toast.warning('This requisition was already submitted. Redirecting...');
            // Try to find the existing requisition
            const { data: existing } = await supabase
              .from('requisition_lists')
              .select('id')
              .eq('idempotency_key', idempotencyKey)
              .single();
            
            return existing?.id || null;
          }
          
          handleSupabaseError(reqError, { 
            action: 'submit_requisition', 
            idempotency_key: idempotencyKey 
          });
          throw reqError;
        }

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
        
        if (itemsError) {
          handleSupabaseError(itemsError, { 
            action: 'insert_items', 
            requisition_id: requisition.id 
          });
          throw itemsError;
        }

        return requisition.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['my-requisitions'] });
      toast.success('Requisition submitted for approval');
      if (onComplete) {
        onComplete();
      } else if (!editMode) {
        setSelectedItems([]);
        setFormData({
          property_id: '',
          priority: 'normal',
          expected_delivery_date: null,
          notes: '',
        });
        setCurrentStep(1);
      }
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
    editMode,
    requisitionId,
    isLoadingRequisition,
    loadRequisition,
  };
}

export const CreateRequisitionProvider = ({ 
  children, 
  onComplete 
}: { 
  children: React.ReactNode;
  onComplete?: () => void;
}) => {
  const value = useProvideCreateRequisition(onComplete);
  return (
    <CreateRequisitionContext.Provider value={value}>
      {children}
    </CreateRequisitionContext.Provider>
  );
};

export const useCreateRequisition = () => {
  const context = useContext(CreateRequisitionContext);
  if (!context) {
    throw new Error('useCreateRequisition must be used within CreateRequisitionProvider');
  }
  return context;
};
