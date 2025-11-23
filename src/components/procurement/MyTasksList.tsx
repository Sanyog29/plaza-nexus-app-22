import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Package, Calendar, User, AlertCircle, Edit, Trash2, 
  Send, X, CheckCircle, XCircle, MessageCircle, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { useRequisitionActions } from '@/hooks/useRequisitionActions';
import { useRequisitionApproval } from '@/hooks/useRequisitionApproval';
import { useApproverPermissions } from '@/hooks/useApproverPermissions';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { RequisitionWizard } from '@/components/requisition/RequisitionWizard';
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

interface RequisitionWithRelations {
  id: string;
  order_number: string;
  status: string;
  priority: string;
  property_id: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  expected_delivery_date?: string;
  notes?: string;
  properties?: {
    name: string;
  };
  created_by_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface MyTasksListProps {
  filter?: 'draft' | 'pending_manager_approval' | 'manager_approved' | 'all';
  propertyId?: string | null;
}

export const MyTasksList = ({ filter = 'all', propertyId }: MyTasksListProps) => {
  const { user, userRole } = useAuth();
  const { navigate } = useNavigationTransition();
  const queryClient = useQueryClient();
  
  // State for inline editing
  const [editingRequisitionId, setEditingRequisitionId] = useState<string | null>(null);
  
  // State for delete confirmation
  const [deletingRequisitionId, setDeletingRequisitionId] = useState<string | null>(null);
  
  // State for approval actions
  const [approvalAction, setApprovalAction] = useState<{
    requisitionId: string;
    action: 'approve' | 'reject' | 'clarify';
  } | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  
  // Action hooks
  const { submitRequisition, cancelSubmission, deleteRequisition } = useRequisitionActions();
  const { approveRequisition, rejectRequisition, requestClarification } = useRequisitionApproval();
  const { acceptRequisition, isAccepting } = usePurchaseOrders();
  
  const { data: requisitions, isLoading, isError, error } = useQuery<RequisitionWithRelations[]>({
    queryKey: ['my-requisitions', filter, userRole, propertyId],
    queryFn: async () => {
      let query = supabase
        .from('requisition_lists')
        .select(`
          *,
          properties!requisition_lists_property_id_fkey(name),
          created_by_profile:profiles!requisition_lists_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply property filter when a specific property is selected
      // When propertyId is null, show all properties (no filter)
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      // Role-based filtering - Procurement roles only see approved and later stages
      const isProcurementRole = userRole === 'purchase_executive' || userRole === 'procurement_manager';
      if (isProcurementRole) {
        console.log('[MyTasksList] Applying procurement role filter');
        query = query.in('status', [
          'manager_approved',
          'assigned_to_procurement',
          'po_created',
          'po_raised',
          'in_transit',
          'received',
          'closed'
        ]);
      }
      
      console.log('[MyTasksList] Query filters:', {
        userRole,
        filter,
        timestamp: new Date().toISOString()
      });

      // Apply additional filter if specified
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[MyTasksList] Query error:', error);
        throw error;
      }

      console.log('[MyTasksList] Query results:', {
        count: data?.length || 0,
        statuses: data?.map(r => r.status) || [],
        orderNumbers: data?.map(r => r.order_number) || [],
        sampleData: data?.[0], // Log first requisition structure
        propertyData: data?.map(r => ({ 
          id: r.id.slice(0, 8), 
          property_id: r.property_id,
          property_name: r.properties?.name || 'undefined'
        }))
      });

      return data;
    }
  });

  // Fetch approver permissions for all requisitions upfront to avoid hook calls in loops
  const requisitionIds = requisitions?.map(r => r.id) || [];
  const { data: approverPermissions } = useQuery({
    queryKey: ['approver-permissions-bulk', user?.id, requisitionIds],
    queryFn: async () => {
      if (!user?.id || requisitionIds.length === 0) return {};

      const permissions: Record<string, boolean> = {};

      for (const reqId of requisitionIds) {
        // Get requisition's property_id
        const { data: requisition } = await supabase
          .from('requisition_lists')
          .select('property_id')
          .eq('id', reqId)
          .single();

        if (!requisition) {
          permissions[reqId] = false;
          continue;
        }

        // Check if user is approver for that property
        const { data: approver } = await supabase
          .from('property_approvers')
          .select('id')
          .eq('property_id', requisition.property_id)
          .eq('approver_user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        permissions[reqId] = !!approver;
      }

      return permissions;
    },
    enabled: !!user?.id && requisitionIds.length > 0
  });

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('my-requisitions-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requisition_lists'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-requisitions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Handle inline edit complete
  const handleEditComplete = () => {
    setEditingRequisitionId(null);
    queryClient.invalidateQueries({ queryKey: ['my-requisitions'] });
  };

  // Handle delete requisition
  const handleDelete = async () => {
    if (!deletingRequisitionId) return;
    
    await deleteRequisition.mutateAsync(deletingRequisitionId);
    setDeletingRequisitionId(null);
    queryClient.invalidateQueries({ queryKey: ['my-requisitions'] });
  };

  // Handle approval actions
  const handleApprovalConfirm = async () => {
    if (!approvalAction) return;

    const { requisitionId, action } = approvalAction;

    try {
      if (action === 'approve') {
        await approveRequisition.mutateAsync({ requisitionId, remarks: approvalRemarks });
      } else if (action === 'reject') {
        await rejectRequisition.mutateAsync({ requisitionId, reason: approvalRemarks });
      } else if (action === 'clarify') {
        await requestClarification.mutateAsync({ requisitionId, message: approvalRemarks });
      }

      setApprovalAction(null);
      setApprovalRemarks('');
      queryClient.invalidateQueries({ queryKey: ['my-requisitions'] });
    } catch (error) {
      console.error('Approval action failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      pending_manager_approval: { variant: 'default' as const, label: 'Pending' },
      manager_approved: { variant: 'default' as const, label: 'Approved' },
      manager_rejected: { variant: 'destructive' as const, label: 'Rejected' },
      closed: { variant: 'outline' as const, label: 'Closed' },
      assigned_to_procurement: { variant: 'default' as const, label: 'Assigned' },
      po_created: { variant: 'default' as const, label: 'PO Created' },
      po_raised: { variant: 'default' as const, label: 'PO Raised' },
      in_transit: { variant: 'default' as const, label: 'In Transit' },
      received: { variant: 'default' as const, label: 'Received' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { className: 'bg-red-100 text-red-800 border-red-300', label: 'Urgent' },
      high: { className: 'bg-orange-100 text-orange-800 border-orange-300', label: 'High' },
      medium: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Medium' },
      low: { className: 'bg-green-100 text-green-800 border-green-300', label: 'Low' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading requisitions: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!requisitions || requisitions.length === 0) {
    const isProcurementRole = userRole === 'purchase_executive' || userRole === 'procurement_manager';
    
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-2">No requisitions found</p>
          {isProcurementRole && (
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You might not have permission to view approved requisitions. 
              Ask an admin to grant procurement read access for approved/later statuses.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requisitions.map((req) => {
          const isCreator = user?.id === req.created_by;
          const isDraft = req.status === 'draft';
          const isPending = req.status === 'pending_manager_approval';
          const isManagerApproved = req.status === 'manager_approved';
          const isProcurementRole = userRole === 'purchase_executive' || userRole === 'procurement_manager';
          
          // Check if user can approve this requisition (from bulk query)
          const canApprove = approverPermissions?.[req.id] || false;
          
          const isProcessing = 
            submitRequisition.isPending || 
            cancelSubmission.isPending || 
            deleteRequisition.isPending ||
            approveRequisition.isPending ||
            rejectRequisition.isPending ||
            requestClarification.isPending;

          return (
            <Card key={req.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      List #{req.id.slice(0, 8)}
                      {getStatusBadge(req.status)}
                      {getPriorityBadge(req.priority)}
                    </CardTitle>
                    <CardDescription className="mt-2 font-medium">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                        {req.properties?.name || 'No property assigned'}
                      </Badge>
                    </CardDescription>
                  </div>
                  
                  {/* Delete Button in Header - Only for Procurement Managers */}
                  {(isCreator || userRole === 'procurement_manager') && (isDraft || isManagerApproved) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingRequisitionId(req.id)}
                      disabled={isProcessing}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(req.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{req.created_by_name || 'Unknown'}</span>
                    </div>
                    {req.expected_delivery_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>Due: {format(new Date(req.expected_delivery_date), 'MMM dd')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {/* Creator Actions - Draft Status */}
                    {isCreator && isDraft && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingRequisitionId(req.id)}
                          disabled={isProcessing}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDeletingRequisitionId(req.id)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => submitRequisition.mutate(req.id)}
                          disabled={isProcessing}
                        >
                          {submitRequisition.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Submit
                        </Button>
                      </>
                    )}

                    {/* Creator Actions - Pending Status */}
                    {isCreator && isPending && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => cancelSubmission.mutate(req.id)}
                        disabled={isProcessing}
                      >
                        {cancelSubmission.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Cancel Request
                      </Button>
                    )}

                    {/* Approver Actions - Pending Status */}
                    {canApprove && isPending && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setApprovalAction({ requisitionId: req.id, action: 'clarify' })}
                          disabled={isProcessing}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Request Clarification
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setApprovalAction({ requisitionId: req.id, action: 'reject' })}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => setApprovalAction({ requisitionId: req.id, action: 'approve' })}
                          disabled={isProcessing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </>
                    )}

                    {/* Procurement Actions - Manager Approved Status */}
                    {isProcurementRole && isManagerApproved && (
                      <Button 
                        size="sm"
                        onClick={() => acceptRequisition(req.id)}
                        disabled={isProcessing || isAccepting}
                      >
                        {isAccepting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Accept & Create PO
                      </Button>
                    )}

                    {/* Always show View Details as secondary action */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/procurement/requisitions/${req.id}`)}
                      className="ml-auto"
                    >
                      View Details
                    </Button>
                  </div>

                  {/* Inline Approval Confirmation Card */}
                  {approvalAction?.requisitionId === req.id && (
                    <Card className="border-2 border-primary/50 bg-primary/5">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            {approvalAction.action === 'approve' && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {approvalAction.action === 'reject' && <XCircle className="h-5 w-5 text-red-600" />}
                            {approvalAction.action === 'clarify' && <MessageCircle className="h-5 w-5 text-blue-600" />}
                            <h4 className="font-semibold">
                              {approvalAction.action === 'approve' && 'Approve Requisition'}
                              {approvalAction.action === 'reject' && 'Reject Requisition'}
                              {approvalAction.action === 'clarify' && 'Request Clarification'}
                            </h4>
                          </div>
                          <div>
                            <Label htmlFor="approval-remarks">
                              {approvalAction.action === 'reject' ? 'Rejection Reason (required)' : 'Remarks (optional)'}
                            </Label>
                            <Textarea
                              id="approval-remarks"
                              value={approvalRemarks}
                              onChange={(e) => setApprovalRemarks(e.target.value)}
                              placeholder={
                                approvalAction.action === 'approve' 
                                  ? 'Add any approval comments...'
                                  : approvalAction.action === 'reject'
                                  ? 'Please provide a reason for rejection...'
                                  : 'Provide details on what needs clarification...'
                              }
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleApprovalConfirm}
                              disabled={
                                isProcessing || 
                                (approvalAction.action === 'reject' && !approvalRemarks.trim())
                              }
                              size="sm"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : null}
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setApprovalAction(null);
                                setApprovalRemarks('');
                              }}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inline Edit Sheet */}
      <Sheet open={editingRequisitionId !== null} onOpenChange={(open) => !open && setEditingRequisitionId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Requisition</SheetTitle>
          </SheetHeader>
          {editingRequisitionId && (
            <div className="mt-6">
              <RequisitionWizard 
                requisitionId={editingRequisitionId}
                onComplete={handleEditComplete}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingRequisitionId !== null} onOpenChange={(open) => !open && setDeletingRequisitionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this requisition? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
