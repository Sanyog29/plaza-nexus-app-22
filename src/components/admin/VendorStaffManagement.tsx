import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, UserPlus, RotateCcw, Trash2 } from 'lucide-react';
import { VendorStaffAssignmentDialog } from './VendorStaffAssignmentDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/utils/formatters';

interface VendorStaffAssignment {
  assignment_id: string;
  user_id: string;
  vendor_id: string;
  vendor_name: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  is_active: boolean;
  assigned_at: string;
  is_orphaned: boolean;
}

export const VendorStaffManagement: React.FC = () => {
  const [assignments, setAssignments] = useState<VendorStaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_vendor_staff_assignments');

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching vendor staff assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor staff assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupOrphanedRecords = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_cleanup_orphaned_vendor_staff');
      if (error) throw error;
      
      const result = data as { message?: string; success?: boolean };
      
      toast({
        title: "Success",
        description: result?.message || 'Orphaned records cleaned up successfully',
      });
      fetchAssignments(); // Refresh the list
    } catch (error) {
      console.error('Error cleaning up orphaned records:', error);
      toast({
        title: "Error",
        description: 'Failed to clean up orphaned records',
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (userId: string, vendorId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase.rpc('admin_add_vendor_staff', {
        p_user_id: userId,
        p_vendor_id: vendorId,
        p_is_active: !currentStatus
      });

      if (error) throw error;

      const result = data as { error?: string; message?: string; success?: boolean };

      if (result?.error) {
        toast({
          title: "Update Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: result?.message || "Assignment status updated successfully",
      });

      fetchAssignments(); // Refresh the list
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Staff Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vendor Staff Assignments</span>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAssignments}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCleanupOrphanedRecords}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clean Orphaned
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowAssignmentDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Staff
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendor staff assignments</h3>
              <p className="text-gray-500 mb-4">
                Get started by assigning users to vendors for POS and portal access.
              </p>
              <Button onClick={() => setShowAssignmentDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Assign First Staff Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {assignments.map((assignment) => {
                   const displayName = formatUserName(assignment.user_first_name, assignment.user_last_name, assignment.user_email);
                   
                   return (
                     <TableRow key={assignment.assignment_id} className={assignment.is_orphaned ? "bg-red-50" : ""}>
                       <TableCell className="font-medium">
                         <div className="flex items-center gap-2">
                           {displayName}
                           {assignment.is_orphaned && (
                             <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                               ORPHANED
                             </span>
                           )}
                         </div>
                       </TableCell>
                       <TableCell>{assignment.user_email}</TableCell>
                       <TableCell>{assignment.vendor_name}</TableCell>
                       <TableCell>
                         <Badge variant={assignment.is_active ? 'default' : 'secondary'}>
                           {assignment.is_active ? 'Active' : 'Inactive'}
                         </Badge>
                       </TableCell>
                       <TableCell>{formatDate(assignment.assigned_at)}</TableCell>
                       <TableCell>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleToggleStatus(
                             assignment.user_id,
                             assignment.vendor_id,
                             assignment.is_active
                           )}
                           disabled={assignment.is_orphaned}
                         >
                           {assignment.is_active ? 'Deactivate' : 'Activate'}
                         </Button>
                       </TableCell>
                     </TableRow>
                   );
                 })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VendorStaffAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        onSuccess={fetchAssignments}
      />
    </>
  );
};