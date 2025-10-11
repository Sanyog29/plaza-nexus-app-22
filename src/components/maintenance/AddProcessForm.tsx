import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateProcessInput, MaintenanceProcess } from '@/hooks/useProcesses';

interface AddProcessFormProps {
  onSubmit: (data: CreateProcessInput) => Promise<void>;
  onCancel: () => void;
  editingProcess?: MaintenanceProcess | null;
  isSubmitting?: boolean;
}

export function AddProcessForm({ 
  onSubmit, 
  onCancel, 
  editingProcess, 
  isSubmitting = false 
}: AddProcessFormProps) {
  const [name, setName] = useState(editingProcess?.name || '');
  const [floor, setFloor] = useState(editingProcess?.description || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      description: floor || undefined,
    });

    setName('');
    setFloor('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="process-name">Process Name *</Label>
        <Input
          id="process-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter process name..."
          maxLength={100}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="process-floor">Floor</Label>
        <Select value={floor} onValueChange={setFloor} disabled={isSubmitting}>
          <SelectTrigger id="process-floor">
            <SelectValue placeholder="Select floor (optional)..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ground Floor">Ground Floor</SelectItem>
            <SelectItem value="1st Floor">1st Floor</SelectItem>
            <SelectItem value="2nd Floor">2nd Floor</SelectItem>
            <SelectItem value="3rd Floor">3rd Floor</SelectItem>
            <SelectItem value="4th Floor">4th Floor</SelectItem>
            <SelectItem value="5th Floor">5th Floor</SelectItem>
            <SelectItem value="Basement">Basement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? 'Saving...' : editingProcess ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
