import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SEOHead } from '@/components/seo/SEOHead';
import { usePurchaseOrderDetail, usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { 
  ArrowLeft, Package, Calendar, User, MapPin, FileText, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';

const PurchaseOrderDetailPage = () => {
  const { poId } = useParams<{ poId: string }>();
  const { navigate } = useNavigationTransition();
  const { data: po, isLoading, isError } = usePurchaseOrderDetail(poId!);
  const { updatePOStatus, isUpdatingStatus } = usePurchaseOrders();
  
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  const handleStatusUpdate = () => {
    if (!poId || !newStatus) return;
    updatePOStatus({ poId, status: newStatus, notes });
    setNewStatus('');
    setNotes('');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !po) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Purchase order not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      accepted: { variant: 'default' as const, label: 'Accepted' },
      processing: { variant: 'default' as const, label: 'Processing' },
      completed: { variant: 'default' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };
    const c = config[status as keyof typeof config] || config.draft;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <>
      <SEOHead
        title={`PO ${po.po_number}`}
        description={`Purchase order details for ${po.po_number}`}
        url={`${window.location.origin}/procurement/orders/${poId}`}
        type="website"
        noindex
      />

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/procurement/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Button>
        </div>

        {/* PO Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  {po.po_number}
                  {getStatusBadge(po.status)}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Linked to requisition: {po.requisition_list?.order_number || 'N/A'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Property</p>
                  <p className="text-sm text-muted-foreground">
                    {po.property?.name || 'N/A'} ({po.property?.code || 'N/A'})
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Accepted By</p>
                  <p className="text-sm text-muted-foreground">
                    {po.acceptor 
                      ? `${po.acceptor.first_name} ${po.acceptor.last_name}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(po.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Expected Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    {po.expected_delivery_date 
                      ? format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')
                      : 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-xl font-bold text-primary">
                    ₹{Number(po.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {po.notes && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{po.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PO Items */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {po.items?.map((item: any, index: number) => (
                <div 
                  key={item.id} 
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.item_name}</h4>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity} {item.unit}</span>
                          <span>•</span>
                          <span>Unit Price: ₹{Number(item.estimated_unit_price || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      ₹{Number(item.estimated_total_price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4 border-t-2 text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-primary">
                  ₹{Number(po.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {po.status !== 'cancelled' && po.status !== 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle>Update Purchase Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {po.status === 'accepted' && (
                      <SelectItem value="processing">Mark as Processing</SelectItem>
                    )}
                    {po.status === 'processing' && (
                      <SelectItem value="completed">Mark as Completed</SelectItem>
                    )}
                    <SelectItem value="cancelled">Cancel PO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this status update..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleStatusUpdate}
                disabled={!newStatus || isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Update Status
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default PurchaseOrderDetailPage;
