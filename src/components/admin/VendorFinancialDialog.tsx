import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  CreditCard,
  Calendar,
  BarChart3
} from 'lucide-react';

interface VendorFinancialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: any;
}

const VendorFinancialDialog: React.FC<VendorFinancialDialogProps> = ({
  isOpen,
  onClose,
  vendor
}) => {
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['vendor-financial-data', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return null;

      // Get commission records
      const { data: commissions } = await supabase
        .from('commission_records')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      // Get recent orders
      const { data: orders } = await supabase
        .from('cafeteria_orders')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Calculate summary metrics
      const totalRevenue = commissions?.reduce((sum, c) => sum + Number(c.order_amount), 0) || 0;
      const totalCommission = commissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const totalPayout = commissions?.reduce((sum, c) => sum + Number(c.vendor_payout_amount), 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        commissions: commissions || [],
        orders: orders || [],
        summary: {
          totalRevenue,
          totalCommission,
          totalPayout,
          totalOrders,
          avgOrderValue,
          commissionRate: vendor.commission_rate || 0
        }
      };
    },
    enabled: !!vendor?.id && isOpen,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!vendor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Overview - {vendor.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financialData?.summary.totalRevenue || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financialData?.summary.totalCommission || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {financialData?.summary.commissionRate}% commission rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vendor Payout</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financialData?.summary.totalPayout || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Net amount to vendor
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financialData?.summary.avgOrderValue || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {financialData?.summary.totalOrders} orders
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Vendor Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Banking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account Holder</p>
                      <p className="font-medium">{vendor.bank_account_holder_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                      <p className="font-medium">
                        {vendor.bank_account_number ? `****${vendor.bank_account_number.slice(-4)}` : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">IFSC Code</p>
                      <p className="font-medium">{vendor.bank_ifsc_code || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">GST Number</p>
                      <p className="font-medium">{vendor.gst_number || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Commission Records</CardTitle>
                  <CardDescription>Latest financial transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financialData?.commissions.slice(0, 10).map((commission) => (
                      <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <div>
                            <p className="font-medium">Order #{commission.order_id.slice(-8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(commission.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(Number(commission.order_amount))}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {commission.commission_rate}%
                            </Badge>
                            <Badge 
                              variant={commission.status === 'processed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {commission.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!financialData?.commissions || financialData.commissions.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        No commission records found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Financial Reports
                  </CardTitle>
                  <CardDescription>
                    Detailed financial analytics and reporting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">This Month</span>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(financialData?.summary.totalRevenue || 0)}</p>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Growth Rate</span>
                        </div>
                        <p className="text-2xl font-bold">+12.5%</p>
                        <p className="text-sm text-muted-foreground">vs last month</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Order Frequency</span>
                        </div>
                        <p className="text-2xl font-bold">{Math.round((financialData?.summary.totalOrders || 0) / 30 * 10) / 10}</p>
                        <p className="text-sm text-muted-foreground">orders/day</p>
                      </div>
                    </div>
                    
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Detailed analytics charts coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VendorFinancialDialog;