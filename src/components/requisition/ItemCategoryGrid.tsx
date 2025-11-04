import React, { useState } from 'react';
import { useRequisitionMaster } from '@/hooks/useRequisitionMaster';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateRequisition } from '@/hooks/useCreateRequisition';
import { QuantityInput } from './QuantityInput';

export const ItemCategoryGrid = () => {
  const { categories, categoriesLoading, fetchItems } = useRequisitionMaster();
  const { addItem } = useCreateRequisition();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: items, isLoading: itemsLoading } = fetchItems(expandedCategory || undefined);

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
      {categories?.map((category: any) => (
        <Card key={category.id}>
          <CardContent className="p-4">
            <button
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )
              }
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              {expandedCategory === category.id ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedCategory === category.id && (
              <div className="mt-4 space-y-2">
                {itemsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Unit: {item.unit} | Max: {item.unit_limit}
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
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
