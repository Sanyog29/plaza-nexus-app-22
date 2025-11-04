import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const ApprovalHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: requisitions, isLoading } = useQuery({
    queryKey: ['approval-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_lists')
        .select('*')
        .eq('manager_id', user?.id!)
        .order('manager_approved_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredRequisitions = requisitions?.filter((req) => {
    const matchesSearch =
      req.order_number.toLowerCase().includes(search.toLowerCase()) ||
      req.created_by_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    manager_approved: 'secondary',
    manager_rejected: 'destructive',
    draft: 'default',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approval History</h1>
        <p className="text-muted-foreground">
          View all requisitions you have reviewed
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or requester..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="manager_approved">Approved</SelectItem>
                <SelectItem value="manager_rejected">Rejected</SelectItem>
                <SelectItem value="draft">Returned for Clarification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !filteredRequisitions?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No approval history found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Reviewed On</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequisitions.map((req) => (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/procurement/requisitions/${req.id}`)}
                  >
                    <TableCell className="font-medium">
                      {req.order_number}
                    </TableCell>
                    <TableCell>{req.created_by_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[req.status] || 'default'}>
                        {req.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{req.total_items} items</TableCell>
                    <TableCell>
                      {req.manager_approved_at &&
                        format(new Date(req.manager_approved_at), 'PP')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {req.manager_remarks || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalHistoryPage;
