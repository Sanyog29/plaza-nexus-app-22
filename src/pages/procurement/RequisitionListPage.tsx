import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { Package } from 'lucide-react';

const RequisitionListPage = () => {
  return (
    <>
      <SEOHead
        title="Requisition List"
        description="View and manage all requisition lists"
        url={`${window.location.origin}/procurement/requisitions`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Requisition List</CardTitle>
            <CardDescription>
              View and manage all requisition lists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Requisition list management interface coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default RequisitionListPage;
