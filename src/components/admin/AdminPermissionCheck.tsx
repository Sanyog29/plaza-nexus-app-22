import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, UserPlus } from 'lucide-react';

interface AdminPermissionCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminPermissionCheck: React.FC<AdminPermissionCheckProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Authentication Required</h3>
          <p className="text-gray-400 mb-4">Please log in to access this content.</p>
          <Button variant="outline" onClick={() => window.location.href = '/auth'}>
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return fallback || (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Admin Access Required</h3>
          <p className="text-gray-400 mb-4">
            You need administrator privileges to access this content management system.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Current role: <span className="font-medium text-white">{user.user_metadata?.role || 'User'}</span>
            </p>
            <Button variant="outline" className="mt-4">
              <UserPlus className="w-4 h-4 mr-2" />
              Request Admin Access
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};