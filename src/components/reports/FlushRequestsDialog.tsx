import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { AlertTriangle, Trash2, Download, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FlushRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlushRequestsDialog: React.FC<FlushRequestsDialogProps> = ({ open, onOpenChange }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedStatuses, setSelectedStatuses] = useState<Array<'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'en_route'>>(['completed', 'cancelled']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [confirmStep, setConfirmStep] = useState<'initial' | 'preview' | 'confirm' | 'complete'>('initial');
  const [deletedCount, setDeletedCount] = useState(0);

  const statusOptions: Array<{ value: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'en_route', label: string, color: string }> = [
    { value: 'completed', label: 'Completed', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-500' },
    { value: 'pending', label: 'Pending (Warning!)', color: 'bg-yellow-500' },
  ];

  const handleStatusToggle = (status: string) => {
    const typedStatus = status as 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'en_route';
    setSelectedStatuses(prev => 
      prev.includes(typedStatus) 
        ? prev.filter(s => s !== typedStatus)
        : [...prev, typedStatus]
    );
    // Reset preview when filters change
    setPreviewCount(null);
    setConfirmStep('initial');
  };

  const handlePreview = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Date Range Required",
        description: "Please select a date range to preview",
        variant: "destructive"
      });
      return;
    }

    if (selectedStatuses.length === 0) {
      toast({
        title: "Status Selection Required",
        description: "Please select at least one status to flush",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingPreview(true);
    try {
      const { count, error } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .in('status', selectedStatuses)
        .is('deleted_at', null); // Only count non-deleted requests

      if (error) throw error;

      setPreviewCount(count || 0);
      setConfirmStep('preview');
      
      toast({
        title: "Preview Generated",
        description: `Found ${count || 0} requests matching your criteria`
      });
    } catch (error: any) {
      console.error('Error previewing:', error);
      toast({
        title: "Preview Failed",
        description: error.message || "Failed to preview requests",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExportBeforeDelete = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          completed_at,
          reported_by,
          assigned_to
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .in('status', selectedStatuses)
        .is('deleted_at', null);

      if (error) throw error;

      // Create CSV content
      const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Created At', 'Completed At'];
      const csvContent = [
        headers.join(','),
        ...(requests || []).map(req => [
          req.id,
          `"${req.title?.replace(/"/g, '""') || ''}"`,
          `"${req.description?.replace(/"/g, '""') || ''}"`,
          req.status,
          req.priority,
          req.created_at,
          req.completed_at || ''
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `requests_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${requests?.length || 0} requests to CSV`
      });
    } catch (error: any) {
      console.error('Error exporting:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export requests",
        variant: "destructive"
      });
    }
  };

  const handleFlush = async () => {
    if (!dateRange?.from || !dateRange?.to || !previewCount) {
      return;
    }

    // Show final confirmation warning
    if (confirmStep === 'preview') {
      setConfirmStep('confirm');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Fetch all request IDs to delete
      const { data: requests, error: fetchError } = await supabase
        .from('maintenance_requests')
        .select('id')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .in('status', selectedStatuses)
        .is('deleted_at', null);

      if (fetchError) throw fetchError;

      const requestIds = requests?.map(r => r.id) || [];
      
      if (requestIds.length === 0) {
        throw new Error('No requests found to delete');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Process in batches of 100
      const batchSize = 100;
      let processed = 0;

      for (let i = 0; i < requestIds.length; i += batchSize) {
        const batch = requestIds.slice(i, i + batchSize);
        
        // Call the database function for soft delete
        const { error: deleteError } = await supabase.rpc('soft_delete_maintenance_requests', {
          request_ids: batch,
          deleted_by_user: user.id
        });

        if (deleteError) throw deleteError;

        processed += batch.length;
        setProgress(Math.round((processed / requestIds.length) * 100));
      }

      setDeletedCount(processed);
      setConfirmStep('complete');

      toast({
        title: "Flush Complete! 🗑️",
        description: `Successfully deleted ${processed} requests`
      });
    } catch (error: any) {
      console.error('Error flushing requests:', error);
      toast({
        title: "Flush Failed",
        description: error.message || "Failed to flush requests",
        variant: "destructive"
      });
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setDateRange(undefined);
      setSelectedStatuses(['completed', 'cancelled']);
      setConfirmStep('initial');
      setPreviewCount(null);
      setDeletedCount(0);
      setProgress(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Flush Old Requests</DialogTitle>
              <DialogDescription>
                {confirmStep === 'complete' 
                  ? 'Requests have been successfully deleted'
                  : 'Permanently delete old maintenance requests from the system'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {confirmStep === 'complete' ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Successfully Deleted</h3>
              <p className="text-muted-foreground">
                {deletedCount} requests have been moved to the trash
              </p>
              <Badge variant="outline" className="mt-2">
                <Clock className="h-3 w-3 mr-1" />
                Recoverable for 90 days
              </Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Warning Alert */}
            <div className="flex items-start gap-3 p-4 border border-yellow-500/30 bg-yellow-500/5 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Important: Soft Delete</p>
                <p className="text-xs text-muted-foreground">
                  Requests will be soft-deleted and can be recovered within 90 days. 
                  After 90 days, they will be permanently removed.
                </p>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <DatePickerWithRange 
                selected={dateRange} 
                onSelect={setDateRange}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Select the date range for requests to flush
              </p>
            </div>

            {/* Status Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Status to Delete</Label>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map(status => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={status.value}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                      disabled={isProcessing}
                    />
                    <Label
                      htmlFor={status.value}
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedStatuses.includes('pending') && (
                <div className="flex items-start gap-2 p-3 border border-orange-500/30 bg-orange-500/5 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Warning: Deleting pending requests may affect active workflows
                  </p>
                </div>
              )}
            </div>

            {/* Preview Section */}
            {previewCount !== null && confirmStep !== 'initial' && (
              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Preview Results</span>
                  <Badge variant="secondary">
                    {previewCount} {previewCount === 1 ? 'request' : 'requests'}
                  </Badge>
                </div>
                {previewCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleExportBeforeDelete}
                    disabled={isProcessing}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Before Delete
                  </Button>
                )}
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Confirmation Warning */}
            {confirmStep === 'confirm' && (
              <div className="flex items-start gap-3 p-4 border border-red-500/30 bg-red-500/5 rounded-lg">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-400">Final Confirmation</p>
                  <p className="text-xs text-muted-foreground">
                    You are about to delete {previewCount} requests. This action will soft-delete 
                    the records and they can be recovered within 90 days.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {confirmStep === 'complete' ? (
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              
              {confirmStep === 'initial' && (
                <Button
                  onClick={handlePreview}
                  disabled={!dateRange?.from || !dateRange?.to || selectedStatuses.length === 0 || isLoadingPreview}
                >
                  {isLoadingPreview ? 'Loading...' : 'Preview'}
                </Button>
              )}
              
              {(confirmStep === 'preview' || confirmStep === 'confirm') && (
                <Button
                  variant="destructive"
                  onClick={handleFlush}
                  disabled={isProcessing || !previewCount || previewCount === 0}
                >
                  {isProcessing 
                    ? 'Deleting...' 
                    : confirmStep === 'confirm' 
                    ? `Confirm Delete ${previewCount} Requests` 
                    : 'Flush Requests'}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlushRequestsDialog;
