import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateRequisition } from '@/hooks/useCreateRequisition';
import { QuantityInput } from './QuantityInput';

export const ItemSearchAndSelect = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { addItem } = useCreateRequisition();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: items, isLoading } = useQuery({
    queryKey: ['search-items', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('requisition_items_master')
        .select(`
          *,
          category:requisition_categories(name)
        `)
        .eq('is_active', true)
        .ilike('item_name', `%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 2,
  });

  const handleAddItem = (item: any) => {
    const quantity = quantities[item.id] || 1;
    addItem({
      item_master_id: item.id,
      item_name: item.item_name,
      category_name: item.category?.name || '',
      unit: item.unit,
      unit_limit: item.unit_limit,
      quantity,
      description: item.description,
    });
    setQuantities({ ...quantities, [item.id]: 1 });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{item.item_name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.category?.name} | Unit: {item.unit} | Max: {item.unit_limit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <QuantityInput
                  value={quantities[item.id] || 1}
                  onChange={(value) =>
                    setQuantities({ ...quantities, [item.id]: value })
                  }
                  max={item.unit_limit}
                />
                <Button size="sm" onClick={() => handleAddItem(item)}>
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchTerm.length >= 2 && items?.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-8">
          No items found matching "{searchTerm}"
        </p>
      )}
    </div>
  );
};
