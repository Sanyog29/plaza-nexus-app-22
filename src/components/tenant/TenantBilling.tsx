import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard,
  Download,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface TenantBillingProps {
  tenantId: string;
}

const TenantBilling: React.FC<TenantBillingProps> = ({ tenantId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  // Get billing information
  const { data: billingData, isLoading } = useQuery({
    queryKey: ['tenant-billing', tenantId, selectedPeriod],
    queryFn: async () => {
      // Get tenant lease information
      const { data: lease, error: leaseError } = await supabase
        .from('tenant_leases')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .single();

      if (leaseError && leaseError.code !== 'PGRST116') throw leaseError;

      // Get invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('tenant_invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('invoice_date', { ascending: false })
        .limit(12);

      if (invoicesError) throw invoicesError;

      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('tenant_payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('payment_date', { ascending: false })
        .limit(12);

      if (paymentsError) throw paymentsError;

      return {
        lease,
        invoices: invoices || [],
        payments: payments || []
      };
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-700';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700';
      case 'overdue': return 'bg-red-500/10 text-red-700';
      case 'cancelled': return 'bg-gray-500/10 text-gray-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const currentBalance = billingData?.invoices
    ?.filter(inv => inv.status !== 'paid')
    ?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

  const totalPaid = billingData?.payments
    ?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

  const nextDueDate = billingData?.invoices
    ?.filter(inv => inv.status === 'pending')
    ?.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]?.due_date;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
          <p className="text-muted-foreground">
            View invoices, payments, and billing information
          </p>
        </div>
        <CreditCard className="h-8 w-8 text-primary" />
      </div>

      {/* Billing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{currentBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextDueDate ? format(new Date(nextDueDate), 'MMM dd') : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">Due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{billingData?.lease?.monthly_rent?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Base rent</p>
          </CardContent>
        </Card>
      </div>

      {/* Lease Information */}
      {billingData?.lease && (
        <Card>
          <CardHeader>
            <CardTitle>Lease Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Lease Period</p>
                <p className="font-medium">
                  {format(new Date(billingData.lease.start_date), 'MMM dd, yyyy')} - 
                  {format(new Date(billingData.lease.end_date), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security Deposit</p>
                <p className="font-medium">₹{billingData.lease.security_deposit?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-medium">Monthly in advance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>
                View and download your invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading invoices...</div>
              ) : billingData?.invoices?.length ? (
                <div className="space-y-4">
                  {billingData.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">Invoice #{invoice.invoice_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')} • 
                            Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm font-medium">₹{Number(invoice.amount).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button size="sm">
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Invoices</h3>
                  <p className="text-muted-foreground">
                    No invoices have been generated yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Track your payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading payments...</div>
              ) : billingData?.payments?.length ? (
                <div className="space-y-4">
                  {billingData.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Payment #{payment.transaction_id}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            +₹{Number(payment.amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/10 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {payment.payment_method}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Payments</h3>
                  <p className="text-muted-foreground">
                    No payment transactions found.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantBilling;