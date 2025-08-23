import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AdminOrderOverview = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Overview</h2>
          <p className="text-muted-foreground">Monitor all orders across vendors</p>
        </div>
        <Badge variant="secondary">Real-time</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Comprehensive order management dashboard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrderOverview;