import { Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const SecurityBadge = () => {
  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Secure Application
              </h4>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Protected by enterprise-grade security measures
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
