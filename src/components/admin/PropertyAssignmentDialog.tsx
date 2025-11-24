import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { AlertCircle, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PropertyAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentPropertyId?: string;
  onAssign: (propertyId: string) => Promise<void>;
  isLoading: boolean;
}

export const PropertyAssignmentDialog: React.FC<PropertyAssignmentDialogProps> = ({
  open,
  onOpenChange,
  userId,
  userName,
  currentPropertyId,
  onAssign,
  isLoading,
}) => {
  const { availableProperties } = usePropertyContext();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(currentPropertyId || '');
  
  const isUnassigned = currentPropertyId === '00000000-0000-0000-0000-000000000001' || !currentPropertyId;
  
  const handleAssign = async () => {
    if (!selectedPropertyId) return;
    await onAssign(selectedPropertyId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Assign Property to User
          </DialogTitle>
          <DialogDescription>
            Select a property for <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isUnassigned && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This user is currently <strong>unassigned</strong>. Assign them to a property to grant system access.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Property</label>
            <Select
              value={selectedPropertyId}
              onValueChange={setSelectedPropertyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {availableProperties
                  .filter(p => p.id !== '00000000-0000-0000-0000-000000000001') // Exclude Unassigned from choices
                  .map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedPropertyId || isLoading || selectedPropertyId === currentPropertyId}
          >
            {isLoading ? 'Assigning...' : 'Assign Property'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
