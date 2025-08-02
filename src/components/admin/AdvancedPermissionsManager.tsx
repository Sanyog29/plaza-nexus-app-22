import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Key,
  UserCheck,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface RolePermission {
  role: string;
  permissions: {
    can_manage_users: boolean;
    can_view_all_requests: boolean;
    can_assign_requests: boolean;
    can_configure_sla: boolean;
    can_view_analytics: boolean;
    can_manage_vendors: boolean;
  };
}

interface AccessLevel {
  name: string;
  description: string;
  permissions: string[];
  color: string;
}

const AdvancedPermissionsManager = () => {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([]);
  const [securityPermissions, setSecurityPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, user } = useAuth();

  const defaultRolePermissions: RolePermission[] = [
    {
      role: 'admin',
      permissions: {
        can_manage_users: true,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: true,
        can_view_analytics: true,
        can_manage_vendors: true,
      }
    },
    {
      role: 'ops_supervisor',
      permissions: {
        can_manage_users: false,
        can_view_all_requests: true,
        can_assign_requests: true,
        can_configure_sla: false,
        can_view_analytics: true,
        can_manage_vendors: false,
      }
    },
    {
      role: 'field_staff',
      permissions: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
      }
    },
    {
      role: 'tenant_manager',
      permissions: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
      }
    },
    {
      role: 'vendor',
      permissions: {
        can_manage_users: false,
        can_view_all_requests: false,
        can_assign_requests: false,
        can_configure_sla: false,
        can_view_analytics: false,
        can_manage_vendors: false,
      }
    }
  ];

  const predefinedAccessLevels: AccessLevel[] = [
    {
      name: 'Full Admin',
      description: 'Complete system access with all permissions',
      permissions: ['User Management', 'Analytics', 'SLA Config', 'Vendor Management', 'System Settings'],
      color: 'bg-red-100 text-red-800'
    },
    {
      name: 'Operations Manager',
      description: 'Request management and assignment capabilities',
      permissions: ['View All Requests', 'Assign Requests', 'Analytics'],
      color: 'bg-blue-100 text-blue-800'
    },
    {
      name: 'Field Technician',
      description: 'Basic request handling and completion',
      permissions: ['View Assigned Requests', 'Update Status'],
      color: 'bg-green-100 text-green-800'
    },
    {
      name: 'Tenant User',
      description: 'Standard tenant access for requests and bookings',
      permissions: ['Create Requests', 'View Own Requests', 'Room Booking'],
      color: 'bg-gray-100 text-gray-800'
    },
    {
      name: 'Vendor Partner',
      description: 'Limited access for external service providers',
      permissions: ['View Assigned Work', 'Update Progress'],
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  const getPermissionDescription = (key: string) => {
    const descriptions = {
      can_manage_users: 'Create, edit, and delete user accounts',
      can_view_all_requests: 'View maintenance requests from all users',
      can_assign_requests: 'Assign requests to staff members',
      can_configure_sla: 'Modify SLA rules and escalation policies',
      can_view_analytics: 'Access dashboard analytics and reports',
      can_manage_vendors: 'Manage vendor accounts and contracts',
    };
    return descriptions[key as keyof typeof descriptions] || key;
  };

  const getRoleDisplayName = (role: string) => {
    const names = {
      admin: 'Administrator',
      ops_supervisor: 'Operations Supervisor',
      field_staff: 'Field Staff',
      tenant_manager: 'Tenant Manager',
      vendor: 'Vendor Partner',
    };
    return names[role as keyof typeof names] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      ops_supervisor: 'bg-blue-100 text-blue-800',
      field_staff: 'bg-green-100 text-green-800',
      tenant_manager: 'bg-gray-100 text-gray-800',
      vendor: 'bg-orange-100 text-orange-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Fetch real security permissions from database
  const fetchSecurityPermissions = async () => {
    if (!user || !isAdmin) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('security_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSecurityPermissions(data || []);
    } catch (error: any) {
      console.error('Error fetching security permissions:', error);
      toast({
        title: "Error",
        description: "Failed to load security permissions: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setRolePermissions(defaultRolePermissions);
    setAccessLevels(predefinedAccessLevels);
    
    if (user && isAdmin) {
      fetchSecurityPermissions();
    }
  }, [user, isAdmin]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            You need administrator privileges to manage permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Permissions Management</h2>
          <p className="text-muted-foreground">Configure roles and access levels for different user types</p>
        </div>
        <Dialog open={showRoleEditor} onOpenChange={setShowRoleEditor}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Edit Permissions
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Role Permissions Editor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role to edit" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  {rolePermissions.map((rp) => (
                    <SelectItem key={rp.role} value={rp.role}>
                      {getRoleDisplayName(rp.role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedRole && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">
                    Permissions for {getRoleDisplayName(selectedRole)}
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(
                      rolePermissions.find(rp => rp.role === selectedRole)?.permissions || {}
                    ).map(([key, enabled]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{key.replace('can_', '').replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {getPermissionDescription(key)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {enabled ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Disabled
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Access Levels Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Access Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessLevels.map((level) => (
              <Card key={level.name} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{level.name}</h4>
                    <Badge className={level.color}>{level.name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{level.description}</p>
                  <div className="space-y-1">
                    {level.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {permission}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">User Mgmt</TableHead>
                  <TableHead className="text-center">All Requests</TableHead>
                  <TableHead className="text-center">Assign</TableHead>
                  <TableHead className="text-center">SLA Config</TableHead>
                  <TableHead className="text-center">Analytics</TableHead>
                  <TableHead className="text-center">Vendors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolePermissions.map((rolePermission) => (
                  <TableRow key={rolePermission.role}>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(rolePermission.role)}>
                        {getRoleDisplayName(rolePermission.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {rolePermission.permissions.can_manage_users ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <div className="h-5 w-5 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {rolePermission.permissions.can_view_all_requests ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <div className="h-5 w-5 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {rolePermission.permissions.can_assign_requests ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <div className="h-5 w-5 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {rolePermission.permissions.can_configure_sla ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <div className="h-5 w-5 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {rolePermission.permissions.can_view_analytics ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <div className="h-5 w-5 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {rolePermission.permissions.can_manage_vendors ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <div className="h-5 w-5 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Authentication Settings</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Email Verification Required</span>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Password Reset via Email</span>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Session Timeout (hours)</span>
                  <Badge variant="outline">24</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Access Control</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Role-Based Access Control</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Audit Logging</span>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Admin Actions Logged</span>
                  <Badge className="bg-green-100 text-green-800">Yes</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedPermissionsManager;