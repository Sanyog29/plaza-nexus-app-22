import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { usePropertyApprovers } from '@/hooks/usePropertyApprovers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Property {
  id: string;
  name: string;
  code: string;
}

interface AssignApproverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  currentApproverId?: string;
}

export const AssignApproverDialog = ({
  open,
  onOpenChange,
  property,
  currentApproverId
}: AssignApproverDialogProps) => {
  const [selectedUserId, setSelectedUserId] = useState(currentApproverId || '');
  const [notes, setNotes] = useState('');
  const { assignApprover, getPropertyApprover } = usePropertyApprovers();

  // Get current approver details
  const { data: currentApprover } = getPropertyApprover(property?.id || '');

  // Fetch available manager-level users
  const { data: availableApprovers = [], isLoading: loadingApprovers } = useQuery({
    queryKey: ['available-approvers'],
    queryFn: async () => {
      // First, get user IDs with admin or assistant_manager roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .or('role.eq.admin,role.eq.assistant_manager');

      if (!userRoles || userRoles.length === 0) return [];

      const userIds = userRoles.map(ur => ur.user_id);

      // Then, get profiles for those users
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, assigned_role_title')
        .in('id', userIds);

      if (error) throw error;
      return profiles || [];
    },
    enabled: open
  });

  // Get properties each user is currently approver for
  const { data: existingAssignments = [] } = useQuery({
    queryKey: ['approver-assignments'],
    queryFn: async () => {
      const { data: approvers } = await supabase
        .from('property_approvers')
        .select('approver_user_id, property_id')
        .eq('is_active', true);
      
      if (!approvers) return [];

      // Fetch property details separately
      const propertyIds = approvers.map(a => a.property_id);
      const { data: properties } = await supabase
        .from('properties')
        .select('id, name, code')
        .in('id', propertyIds);

      // Map properties to approvers
      return approvers.map(a => ({
        approver_user_id: a.approver_user_id,
        property: properties?.find(p => p.id === a.property_id) || null
      }));
    },
    enabled: open
  });

  const handleAssign = async () => {
    if (!property || !selectedUserId) return;

    const selectedUser = availableApprovers.find(u => u.id === selectedUserId);
    const roleTitle = selectedUser?.assigned_role_title || 'Manager';

    await assignApprover.mutateAsync({
      propertyId: property.id,
      userId: selectedUserId,
      roleTitle,
      notes
    });

    onOpenChange(false);
    setSelectedUserId('');
    setNotes('');
  };

  const getUserAssignments = (userId: string) => {
    return existingAssignments
      .filter(a => a.approver_user_id === userId)
      .map(a => a.property);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Approver - {property?.name}</DialogTitle>
          <DialogDescription>
            Select a manager to approve requisitions for this property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentApprover && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-sm font-medium mb-2">Current Approver:</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentApprover.approver?.avatar_url} />
                  <AvatarFallback>
                    {currentApprover.approver?.first_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {currentApprover.approver?.first_name} {currentApprover.approver?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentApprover.approver_role_title}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="approver">Select New Approver</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={loadingApprovers}
            >
              <SelectTrigger id="approver">
                <SelectValue placeholder="Select manager..." />
              </SelectTrigger>
              <SelectContent>
                {availableApprovers.map((user) => {
                  const assignments = getUserAssignments(user.id);
                  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                  return (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.first_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {fullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.assigned_role_title}
                          </span>
                          {assignments.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Currently: {assignments.map(p => p?.name).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedUserId || assignApprover.isPending}
          >
            {assignApprover.isPending ? 'Assigning...' : 'Assign Approver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
