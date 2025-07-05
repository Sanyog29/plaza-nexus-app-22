import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServerCog } from 'lucide-react';

const AccessRestricted = () => {
  return (
    <div className="px-4 py-6 flex items-center justify-center h-[calc(100vh-100px)]">
      <Card className="bg-card/50 backdrop-blur max-w-md w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <ServerCog className="h-16 w-16 text-red-500" />
            <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
            <p className="text-gray-400">You don't have permission to access the Admin Dashboard.</p>
            <Button variant="default" className="mt-4" onClick={() => history.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessRestricted;