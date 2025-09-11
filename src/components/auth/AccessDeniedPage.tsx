import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { Shield, AlertTriangle, ArrowLeft, Home, Settings } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const AccessDeniedPage = () => {
  const { user, userRole, userCategory, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Log unauthorized access attempt to audit system
    if (user && userCategory === 'food_vendor') {
      // This would typically make an API call to log the attempt
      console.warn('Unauthorized access attempt by food vendor:', {
        userId: user.id,
        userRole,
        userCategory,
        timestamp: new Date().toISOString(),
        path: window.location.pathname
      });
      
      toast("Access Restricted", {
        description: "Your account has limited access permissions.",
      });
    }
  }, [user, userRole, userCategory]);

  const handleGoHome = () => {
    if (userCategory === 'food_vendor') {
      navigate('/pos');
    } else {
      navigate('/');
    }
  };

  const getHomeLabel = () => {
    if (userCategory === 'food_vendor') return 'Go to POS';
    return 'Go to Dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Access Denied Card */}
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-red-800">Access Denied</CardTitle>
              <CardDescription className="text-red-600 mt-2">
                You don't have permission to access this resource
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Account Type:</span>
                <Badge variant={userCategory === 'food_vendor' ? 'destructive' : 'secondary'}>
                  {userCategory === 'food_vendor' ? 'Food Vendor (Restricted)' : userRole}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">User Email:</span>
                <span className="text-sm text-gray-800">{user?.email}</span>
              </div>
            </div>

            {/* Restriction Details for Food Vendors */}
            {userCategory === 'food_vendor' && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-amber-800">Food Vendor Account Restrictions</h3>
                    <p className="text-sm text-amber-700">
                      Your account has been configured with limited access for security and operational reasons.
                    </p>
                    <div className="text-sm text-amber-700">
                      <p className="font-medium mb-1">You have access to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Point of Sale (POS) system</li>
                        <li>Order processing and payment handling</li>
                        <li>Receipt printing and order management</li>
                        <li>Your profile settings</li>
                      </ul>
                    </div>
                    <div className="text-sm text-amber-700 mt-3">
                      <p className="font-medium mb-1">Restricted access to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Back-office operations and analytics</li>
                        <li>Management dashboards and reports</li>
                        <li>System administration features</li>
                        <li>User management and security settings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={handleGoHome} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                {getHomeLabel()}
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              {userCategory === 'food_vendor' && (
                <Button variant="outline" onClick={() => navigate('/profile')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              )}
            </div>

            {/* Support Notice */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                If you believe this is an error or need additional access, please contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Security Notice</p>
                <p className="mt-1">
                  This access attempt has been logged for security monitoring. Unauthorized access attempts may result in account restrictions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessDeniedPage;