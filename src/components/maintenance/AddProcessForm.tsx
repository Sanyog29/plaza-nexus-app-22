import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [description, setDescription] = useState(editingProcess?.description || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });

    setName('');
    setDescription('');
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
        <Label htmlFor="process-description">Description</Label>
        <Textarea
          id="process-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter process description (optional)..."
          rows={3}
          maxLength={500}
          disabled={isSubmitting}
        />
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
