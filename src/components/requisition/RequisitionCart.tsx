import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import { useCreateRequisition } from '@/hooks/useCreateRequisition';
import { QuantityInput } from './QuantityInput';
import { ScrollArea } from '@/components/ui/scroll-area';

export const RequisitionCart = () => {
  const { selectedItems, removeItem, updateQuantity, calculateTotalItems } =
    useCreateRequisition();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
          </CardTitle>
          <Badge variant="secondary">{selectedItems.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {selectedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No items added yet</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.item_master_id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.item_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category_name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.item_master_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          Limit: {item.unit_limit} {item.unit}
                        </p>
                        <p className="text-xs font-medium">
                          Current: {item.quantity}/{item.unit_limit}
                        </p>
                      </div>
                      <QuantityInput
                        value={item.quantity}
                        onChange={(value) =>
                          updateQuantity(item.item_master_id, value)
                        }
                        max={item.unit_limit}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Total Quantity:</span>
                <Badge variant="default">{calculateTotalItems()}</Badge>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  selectedItems.forEach((item) => removeItem(item.item_master_id))
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
