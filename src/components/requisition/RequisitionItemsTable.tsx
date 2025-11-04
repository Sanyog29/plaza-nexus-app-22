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

interface RequisitionItemsTableProps {
  items: any[];
}

export const RequisitionItemsTable: React.FC<RequisitionItemsTableProps> = ({
  items,
}) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items ({items.length})</CardTitle>
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
            {items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.item?.item_name || 'Unknown Item'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.item?.category?.name || 'Uncategorized'}
                  </Badge>
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.item?.unit || 'units'}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell>{totalQuantity}</TableCell>
              <TableCell>units</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
