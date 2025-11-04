import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { Store } from 'lucide-react';

const VendorManagementPage = () => {
  return (
    <>
      <SEOHead
        title="Vendor Management"
        description="Manage vendors and supplier relationships"
        url={`${window.location.origin}/procurement/vendors`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Management</CardTitle>
            <CardDescription>
              Manage vendors and supplier relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Vendor management interface coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default VendorManagementPage;
