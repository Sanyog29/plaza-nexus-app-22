import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { FileText } from 'lucide-react';

const PurchaseOrdersPage = () => {
  return (
    <>
      <SEOHead
        title="Purchase Orders"
        description="Manage purchase orders and procurement transactions"
        url={`${window.location.origin}/procurement/orders`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
            <CardDescription>
              Manage purchase orders and procurement transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Purchase order management interface coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PurchaseOrdersPage;
