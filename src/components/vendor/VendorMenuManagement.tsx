import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface VendorMenuManagementProps {
  vendorId: string;
}

const VendorMenuManagement: React.FC<VendorMenuManagementProps> = ({ vendorId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Menu Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Menu management functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorMenuManagement;