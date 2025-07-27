import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard,
  Construction
} from 'lucide-react';

interface TenantBillingProps {
  tenantId: string;
}

const TenantBilling: React.FC<TenantBillingProps> = ({ tenantId }) => {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
          <p className="text-muted-foreground">
            Billing features coming soon
          </p>
        </div>
        <CreditCard className="h-8 w-8 text-primary" />
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Billing System Under Development</h3>
          <p className="text-muted-foreground mb-6">
            We're building a comprehensive billing and payment system for tenants. 
            This will include invoice management, payment tracking, and lease information.
          </p>
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
            <p className="font-medium mb-2">Coming Features:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Invoice generation and tracking</li>
              <li>Payment history and receipts</li>
              <li>Lease agreement management</li>
              <li>Automated billing notifications</li>
              <li>Multiple payment methods</li>
            </ul>
          </div>
          <Button className="mt-6" variant="outline">
            Request Early Access
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantBilling;