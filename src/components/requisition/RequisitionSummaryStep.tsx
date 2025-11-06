import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRequisition } from '@/hooks/useCreateRequisition';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { DeliveryDatePicker } from './DeliveryDatePicker';
import { PrioritySelector } from './PrioritySelector';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const RequisitionSummaryStep = () => {
  const { formData, setFormData } = useCreateRequisition();
  const { currentProperty, isLoadingProperties } = usePropertyContext();

  // Auto-populate property from user's current property
  useEffect(() => {
    if (currentProperty && !formData.property_id) {
      setFormData(prev => ({ ...prev, property_id: currentProperty.id }));
    }
  }, [currentProperty, formData.property_id, setFormData]);

  // Show loading state while properties are being fetched
  if (isLoadingProperties) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle case where no property is available
  if (!currentProperty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Property Available</AlertTitle>
            <AlertDescription>
              No property has been assigned to your account. Please contact your administrator to assign a property before creating a requisition.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Property</Label>
          <div className="p-3 bg-muted rounded-md border">
            <p className="font-medium text-foreground">
              {currentProperty?.name || 'Loading...'}
            </p>
            {currentProperty?.code && (
              <p className="text-sm text-muted-foreground mt-1">
                {currentProperty.code}
              </p>
            )}
          </div>
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
