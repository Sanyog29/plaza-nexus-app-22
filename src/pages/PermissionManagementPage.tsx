import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { usePropertyPermissions, usePermissionManagement } from '@/hooks/usePropertyPermissions';
import { PermissionCategoryAccordion } from '@/components/permissions/PermissionCategoryAccordion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Shield, User, X } from 'lucide-react';
import { getRoleLabel } from '@/constants/roles';
import { toast } from '@/hooks/use-toast';
import type { PermissionAction } from '@/hooks/usePropertyPermissions';

const PermissionManagementPage = () => {
  const { user, userRole } = useAuth();
  const { currentProperty, availableProperties } = usePropertyContext();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(currentProperty?.id || '');
  const [pendingChanges, setPendingChanges] = useState<Map<PermissionAction, boolean>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { categories, definitions, isLoading: permissionsLoading } = usePropertyPermissions();
  const { overrides, roleTemplates, togglePermission, removeOverride } = usePermissionManagement(selectedUserId);

  // Reset pending changes when user or property changes
  useEffect(() => {
    setPendingChanges(new Map());
    setHasUnsavedChanges(false);
  }, [selectedUserId, selectedPropertyId]);

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

  const handlePermissionChange = (action: PermissionAction, granted: boolean) => {
    if (!selectedUserId || !selectedPropertyId) return;

    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(action, granted);
      return newMap;
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveAllChanges = async () => {
    if (!selectedUserId || !selectedPropertyId || pendingChanges.size === 0) return;

    try {
      // Save all pending changes sequentially
      for (const [action, granted] of pendingChanges.entries()) {
        await togglePermission.mutateAsync({
          userId: selectedUserId,
          propertyId: selectedPropertyId,
          action,
          isGranted: granted
        });
      }

      // Clear pending changes after successful save
      setPendingChanges(new Map());
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: `${pendingChanges.size} permission(s) updated successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save some permissions",
        variant: "destructive"
      });
    }
  };

  const handleCancelChanges = () => {
    setPendingChanges(new Map());
    setHasUnsavedChanges(false);
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
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? 's' : ''}
              </Badge>
              <Button
                onClick={handleCancelChanges}
                variant="outline"
                disabled={togglePermission.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveAllChanges}
                disabled={togglePermission.isPending}
              >
                {togglePermission.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
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
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  pendingChanges={pendingChanges}
                  onPermissionChange={handlePermissionChange}
                  disabled={togglePermission.isPending}
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
