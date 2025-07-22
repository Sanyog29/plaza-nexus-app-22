
import React from 'react';
import { EnhancedUserManagement } from '@/components/admin/EnhancedUserManagement';

const UserManagementPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and monitor user accounts across the system
          </p>
        </div>
        
        <EnhancedUserManagement />
      </div>
    </div>
  );
};

export default UserManagementPage;
