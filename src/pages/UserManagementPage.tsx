
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
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  updated_at: string;
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
      setIsLoading(true);
      
      // Enhanced retry logic with exponential backoff
      let retryCount = 0;
      const maxRetries = 5;
      let lastError;

      while (retryCount < maxRetries) {
        try {
          console.log(`Attempting to fetch user data - attempt ${retryCount + 1}/${maxRetries}`);
          
          // Check admin status first
          const { data: currentUser, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          
          if (!currentUser?.user) {
            throw new Error('User not authenticated');
          }

          // Call the RPC function with caller_id
          const { data, error } = await supabase.rpc('get_user_management_data', {
            caller_id: currentUser.user.id
          });
          
          if (error) {
            console.error('RPC error:', error);
            throw error;
          }
          
          console.log('Successfully fetched user data:', data?.length || 0, 'users');
          setUsers(data || []);
          return; // Success, exit retry loop
          
        } catch (rpcError: any) {
          lastError = rpcError;
          retryCount++;
          console.error(`RPC attempt ${retryCount} failed:`, rpcError);
          
          // If this is the last attempt, throw the error
          if (retryCount >= maxRetries) {
            throw rpcError;
          }
          
          // Exponential backoff: wait longer between retries
          const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          console.log(`Waiting ${waitTime}ms before retry ${retryCount + 1}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    } catch (error: any) {
      console.error('Final error after all retries:', error);
      
      // More specific error messages
      let errorMessage = "Failed to load user data. Please try again.";
      let errorTitle = "Error fetching users";
      
      if (error.message?.includes('Access denied') || error.message?.includes('Only administrators')) {
        errorTitle = "Access Denied";
        errorMessage = "You don't have permission to view user management data.";
      } else if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        errorTitle = "System Error";
        errorMessage = "User management function is not available. Please contact support.";
      } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
        errorTitle = "Network Error";
        errorMessage = "Please check your internet connection and try again.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
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
          .maybeSingle();
        
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
