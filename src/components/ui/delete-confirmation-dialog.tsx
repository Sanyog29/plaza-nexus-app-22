import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName?: string;
  deleteText?: string;
  onConfirm: () => void;
  loading?: boolean;
  destructive?: boolean;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  deleteText = "Delete",
  onConfirm,
  loading = false,
  destructive = true
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {destructive ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
            )}
            <div>
              <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
              {itemName && (
                <p className="text-sm text-muted-foreground mt-1">
                  "{itemName}"
                </p>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-muted-foreground">
          {description}
        </AlertDialogDescription>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={loading}
            className="bg-card border-border hover:bg-card/80"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={destructive ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading && (
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {deleteText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};