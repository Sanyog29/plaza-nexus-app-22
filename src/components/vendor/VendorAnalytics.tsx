import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VendorAnalyticsProps {
  vendorId: string;
}

const VendorAnalytics: React.FC<VendorAnalyticsProps> = ({ vendorId }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Analytics & Reports</h2>

      <Card>
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Detailed analytics and reporting features coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAnalytics;