import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useProcesses, MaintenanceProcess } from '@/hooks/useProcesses';
import { AddProcessForm } from './AddProcessForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProcessManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessManagementDialog({ open, onOpenChange }: ProcessManagementDialogProps) {
  const {
    processes,
    isLoading,
    addProcess,
    updateProcess,
    deleteProcess,
    toggleProcessStatus,
  } = useProcesses(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProcess, setEditingProcess] = useState<MaintenanceProcess | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<MaintenanceProcess | null>(null);

  const filteredProcesses = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddOrUpdate = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingProcess) {
        await updateProcess(editingProcess.id, data);
      } else {
        await addProcess(data);
      }
      setShowAddForm(false);
      setEditingProcess(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (process: MaintenanceProcess) => {
    setEditingProcess(process);
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingProcess(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    await deleteProcess(deleteConfirm.id, deleteConfirm.name);
    setDeleteConfirm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Processes</DialogTitle>
            <DialogDescription>
              Add, edit, or remove processes for maintenance requests
            </DialogDescription>
          </DialogHeader>

          {showAddForm ? (
            <AddProcessForm
              onSubmit={handleAddOrUpdate}
              onCancel={handleCancelForm}
              editingProcess={editingProcess}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search processes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Process
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading processes...</div>
              ) : filteredProcesses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No processes found matching your search' : 'No processes yet. Add one to get started.'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20">Status</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProcesses.map((process) => (
                      <TableRow key={process.id}>
                        <TableCell className="font-medium">{process.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {process.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={process.is_active}
                            onCheckedChange={() => toggleProcessStatus(process.id, process.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(process)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(process)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Process</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
              Existing requests using this process will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
