import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Shield, LogIn } from 'lucide-react';

export const UserStatusDisplay: React.FC = () => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return (
      <Card className="mb-4 bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <LogIn className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Not Logged In</p>
              <p className="text-sm text-yellow-600">Please log in to access admin features</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
              Log In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">
                {user.email} 
                {isAdmin && (
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </p>
              <p className="text-sm text-blue-600">
                Role: {user.user_metadata?.role || 'User'} | 
                Status: {isAdmin ? 'Admin Access Granted' : 'Limited Access'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};