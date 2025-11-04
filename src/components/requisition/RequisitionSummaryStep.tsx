import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRequisition } from '@/hooks/useCreateRequisition';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryDatePicker } from './DeliveryDatePicker';
import { PrioritySelector } from './PrioritySelector';

export const RequisitionSummaryStep = () => {
  const { formData, setFormData } = useCreateRequisition();

  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
  
  const properties = propertiesQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Property</Label>
          <Select
            value={formData.property_id}
            onValueChange={(value) =>
              setFormData({ ...formData, property_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties?.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <PrioritySelector
          value={formData.priority}
          onChange={(value) => setFormData({ ...formData, priority: value })}
        />

        <DeliveryDatePicker
          value={formData.expected_delivery_date}
          onChange={(value) =>
            setFormData({ ...formData, expected_delivery_date: value })
          }
        />

        <div>
          <Label>Notes / Remarks</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Add any special instructions or remarks"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
};
