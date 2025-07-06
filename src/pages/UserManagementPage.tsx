
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type UserData = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
};

const UserManagementPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      // Use the correct function signature based on available functions
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          role,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get auth users data separately
      const userIds = data?.map(profile => profile.id) || [];
      const authUsers = [];
      
      // For each user ID, get auth data (this is a simplified approach)
      for (const userId of userIds.slice(0, 20)) { // Limit to avoid too many requests
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(userId);
          if (authData.user) {
            authUsers.push({
              id: authData.user.id,
              email: authData.user.email || '',
              confirmed_at: authData.user.confirmed_at,
              last_sign_in_at: authData.user.last_sign_in_at,
            });
          }
        } catch (authError) {
          // Skip failed auth lookups
          console.warn('Failed to get auth data for user:', userId);
        }
      }

      // Combine profile and auth data
      const combinedUsers = data?.map(profile => {
        const authUser = authUsers.find(auth => auth.id === profile.id);
        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          created_at: profile.created_at,
          email: authUser?.email || 'N/A',
          confirmed_at: authUser?.confirmed_at || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      // Fallback: just get profiles without auth data
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profileError) throw profileError;

        const fallbackUsers = profiles?.map(profile => ({
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          created_at: profile.created_at,
          email: 'N/A',
          confirmed_at: null,
          last_sign_in_at: null,
        })) || [];

        setUsers(fallbackUsers);
      } catch (fallbackError: any) {
        toast({
          title: "Error fetching users",
          description: fallbackError.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Validate role against allowed values
      const allowedRoles = ['admin', 'ops_supervisor', 'field_staff', 'tenant_manager', 'vendor', 'staff'];
      if (!allowedRoles.includes(newRole)) {
        throw new Error('Invalid role selected');
      }

      // Direct update to profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole as 'admin' | 'ops_supervisor' | 'field_staff' | 'tenant_manager' | 'vendor' | 'staff',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
      
      // Refresh the users list
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Check if user is admin first
    const checkAdmin = async () => {
      try {
        // Check user role directly from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user?.id)
          .single();
        
        if (error) throw error;
        
        if (profile?.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this page.",
            variant: "destructive",
          });
          navigate('/admin/dashboard');
          return;
        }
        
        fetchUsers();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        navigate('/admin/dashboard');
      }
    };

    if (user) {
      checkAdmin();
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">User Management</h1>
      <Card className="bg-card/50 backdrop-blur">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="ops_supervisor">Operations Supervisor</SelectItem>
                        <SelectItem value="field_staff">Field Staff</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="tenant_manager">Tenant Manager</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at 
                      ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy')
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.confirmed_at ? "default" : "destructive"}
                    >
                      {user.confirmed_at ? 'Verified' : 'Unverified'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default UserManagementPage;
