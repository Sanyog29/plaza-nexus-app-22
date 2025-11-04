import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { TrendingUp } from 'lucide-react';

const BudgetTrackingPage = () => {
  return (
    <>
      <SEOHead
        title="Budget Tracking"
        description="Track and monitor procurement budget utilization"
        url={`${window.location.origin}/procurement/budget`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Tracking</CardTitle>
            <CardDescription>
              Track and monitor procurement budget utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Budget tracking interface coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default BudgetTrackingPage;
