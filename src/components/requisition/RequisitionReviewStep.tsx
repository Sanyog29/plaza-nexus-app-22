import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCreateRequisition } from '@/hooks/useCreateRequisition';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const RequisitionReviewStep = () => {
  const { formData, selectedItems, calculateTotalItems } = useCreateRequisition();

  const { data: property } = useQuery({
    queryKey: ['property', formData.property_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('name')
        .eq('id', formData.property_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.property_id,
  });

  const priorityColors = {
    low: 'secondary',
    normal: 'default',
    high: 'default',
    urgent: 'destructive',
  } as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Requisition Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Property</p>
              <p className="font-medium">{property?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <Badge variant={priorityColors[formData.priority]}>
                {formData.priority.toUpperCase()}
              </Badge>
            </div>
            {formData.expected_delivery_date && (
              <div>
                <p className="text-sm text-muted-foreground">Expected Delivery</p>
                <p className="font-medium">
                  {format(new Date(formData.expected_delivery_date), 'PPP')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="font-medium">{calculateTotalItems()} units</p>
            </div>
          </div>
          {formData.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{formData.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items ({selectedItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedItems.map((item) => (
                <TableRow key={item.item_master_id}>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category_name}</Badge>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
