import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServerCog, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';

const OptimizedAccessRestricted = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="px-4 py-6 flex items-center justify-center min-h-[60vh]">
      <Card className="bg-card/50 backdrop-blur max-w-md w-full">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <ServerCog className="h-16 w-16 text-destructive" />
              <Shield className="h-6 w-6 text-muted-foreground absolute -bottom-1 -right-1" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
              <p className="text-muted-foreground">
                You need administrator privileges to access this dashboard.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current role:</span>
              <Badge variant="secondary">
                {userRole?.replace('_', ' ').toUpperCase() || 'USER'}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button 
                onClick={handleGoHome}
                className="flex-1"
              >
                Return Home
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Contact your system administrator if you need access to this area.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedAccessRestricted;