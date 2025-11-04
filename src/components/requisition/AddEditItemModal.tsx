import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requisitionItemMasterSchema, type RequisitionItemMasterInput } from '@/utils/validationSchemas';
import { useRequisitionMaster } from '@/hooks/useRequisitionMaster';

interface AddEditItemModalProps {
  open: boolean;
  onClose: () => void;
  item?: any;
}

export const AddEditItemModal: React.FC<AddEditItemModalProps> = ({
  open,
  onClose,
  item,
}) => {
  const { categories, createItem, updateItem } = useRequisitionMaster();
  
  const form = useForm<RequisitionItemMasterInput>({
    resolver: zodResolver(requisitionItemMasterSchema),
    defaultValues: {
      item_name: '',
      category_id: '',
      unit: '',
      unit_limit: 1,
      description: '',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        item_name: item.item_name,
        category_id: item.category_id,
        unit: item.unit,
        unit_limit: item.unit_limit,
        description: item.description || '',
      });
    } else {
      form.reset({
        item_name: '',
        category_id: '',
        unit: '',
        unit_limit: 1,
        description: '',
      });
    }
  }, [item, form]);

  const onSubmit = async (data: RequisitionItemMasterInput) => {
    if (item) {
      await updateItem.mutateAsync({ id: item.id, data });
    } else {
      await createItem.mutateAsync(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="item_name">Item Name</Label>
            <Input
              id="item_name"
              {...form.register('item_name')}
              placeholder="e.g., Blue Ballpoint Pens"
            />
            {form.formState.errors.item_name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.item_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category_id">Category</Label>
            <Select
              value={form.watch('category_id')}
              onValueChange={(value) => form.setValue('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category_id && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.category_id.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                {...form.register('unit')}
                placeholder="e.g., pcs, box, kg"
              />
              {form.formState.errors.unit && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.unit.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="unit_limit">Unit Limit</Label>
              <Input
                id="unit_limit"
                type="number"
                {...form.register('unit_limit', { valueAsNumber: true })}
                placeholder="Max quantity"
              />
              {form.formState.errors.unit_limit && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.unit_limit.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Optional description"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createItem.isPending || updateItem.isPending}
            >
              {item ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
