import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { usePropertyPermissions, usePermissionManagement } from '@/hooks/usePropertyPermissions';
import { PermissionCategoryAccordion } from '@/components/permissions/PermissionCategoryAccordion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Shield, User } from 'lucide-react';
import { getRoleLabel } from '@/constants/roles';
import type { PermissionAction } from '@/hooks/usePropertyPermissions';

const PermissionManagementPage = () => {
  const { user, userRole } = useAuth();
  const { currentProperty, availableProperties } = usePropertyContext();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserRole, setSelectedUserRole] = useState<string>('');
  
  const selectedPropertyId = currentProperty?.id;

  const { categories, definitions, isLoading: permissionsLoading } = usePropertyPermissions();
  const { overrides, roleTemplates, togglePermission, removeOverride } = usePermissionManagement(selectedUserId);

  // Check if current user is super admin
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';

  // Fetch all users for the current property
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['property-users', selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return [];
      
      const { data, error } = await supabase.rpc('get_user_management_data', {
        filter_property_id: selectedPropertyId
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedPropertyId && isSuperAdmin
  });

  // Get selected user's role
  const selectedUser = users.find(u => u.id === selectedUserId);

  const handlePermissionChange = async (action: PermissionAction, granted: boolean, reason?: string) => {
    if (!selectedUserId || !selectedPropertyId) return;

    await togglePermission.mutateAsync({
      userId: selectedUserId,
      propertyId: selectedPropertyId,
      action,
      isGranted: granted,
      reason
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Access Restricted
            </CardTitle>
            <CardDescription>
              Only super administrators can manage user permissions
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (permissionsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedProperty = availableProperties.find(p => p.id === selectedPropertyId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Permission Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure user permissions for specific properties
            </p>
          </div>
        </div>

        {/* User Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select User & Property</CardTitle>
            <CardDescription>
              Choose a user and property to manage their permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {user.first_name} {user.last_name} ({user.email})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted">
                  {selectedProperty?.name || 'No property selected'}
                </div>
              </div>
            </div>

            {selectedUser && (
              <div className="flex items-center gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Current Role</p>
                  <p className="font-semibold">{getRoleLabel(selectedUser.role)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-semibold">{selectedProperty?.name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions Grid */}
        {selectedUserId && selectedPropertyId && (
          <div className="space-y-4">
            {categories.map(category => {
              const categoryPermissions = definitions.filter(
                def => def.category_id === category.id
              );

              return (
                <PermissionCategoryAccordion
                  key={category.id}
                  category={category}
                  permissions={categoryPermissions}
                  roleTemplates={roleTemplates}
                  userOverrides={overrides}
                  userRole={selectedUser?.role || ''}
                  onPermissionChange={handlePermissionChange}
                />
              );
            })}
          </div>
        )}

        {!selectedUserId && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">Select a user to begin</p>
              <p className="text-sm text-muted-foreground mt-2">
                Choose a user from the dropdown above to manage their permissions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PermissionManagementPage;
