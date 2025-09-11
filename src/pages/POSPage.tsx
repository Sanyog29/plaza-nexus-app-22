import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { ShoppingCart, Calculator, Receipt, Settings, BarChart3 } from 'lucide-react';

const POSPage = () => {
  const { user, userRole, permissions } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Point of Sale</h1>
          <p className="text-muted-foreground">Food Vendor POS System</p>
          <Badge variant="secondary" className="text-sm">
            {userRole} - POS Access Only
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">₹0</div>
              <div className="text-sm text-muted-foreground">Today's Sales</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-muted-foreground">Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">₹0</div>
              <div className="text-sm text-muted-foreground">Avg Order</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">Open</div>
              <div className="text-sm text-muted-foreground">Status</div>
            </CardContent>
          </Card>
        </div>

        {/* Main POS Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                New Order
              </CardTitle>
              <CardDescription>Start processing a new customer order</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="w-full h-20 text-lg">
                Start New Order
              </Button>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Click to begin order entry
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Receipt className="h-4 w-4 mr-2" />
                  View Orders
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Daily Report
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Access Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Restricted Access Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-amber-700 space-y-2">
              <p>This is a food vendor account with limited access to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Point of Sale (POS) system</li>
                <li>Order processing and payments</li>
                <li>Receipt printing</li>
                <li>Basic sales reporting</li>
                <li>Profile settings</li>
              </ul>
              <p className="text-sm mt-3">
                Access to back-office operations, analytics, and management features is restricted.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Development Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-blue-800">
              <h3 className="font-semibold">POS System Under Development</h3>
              <p className="text-sm mt-2">
                Full POS functionality will be available soon. This interface demonstrates the restricted access model for food vendor accounts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POSPage;