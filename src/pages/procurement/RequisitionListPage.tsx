import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRequisitionList } from '@/hooks/useRequisitionList';
import { useAuth } from '@/components/AuthProvider';
import { Package, Search, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RequisitionListPage = () => {
  const navigate = useNavigate();
  const { user, userRole, isAdmin, isSuperAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { requisitions, isLoading, deleteRequisition } = useRequisitionList({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteRequisition(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending_manager_approval: 'bg-blue-100 text-blue-800 border-blue-200',
      manager_approved: 'bg-green-100 text-green-800 border-green-200',
      manager_rejected: 'bg-red-100 text-red-800 border-red-200',
      assigned_to_procurement: 'bg-purple-100 text-purple-800 border-purple-200',
      po_raised: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      in_transit: 'bg-orange-100 text-orange-800 border-orange-200',
      received: 'bg-teal-100 text-teal-800 border-teal-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    
    const labels = {
      draft: 'Draft',
      pending_manager_approval: 'Pending Approval',
      manager_approved: 'Approved',
      manager_rejected: 'Rejected',
      assigned_to_procurement: 'Assigned to Procurement',
      po_raised: 'PO Raised',
      in_transit: 'In Transit',
      received: 'Received',
      closed: 'Closed',
      cancelled: 'Cancelled',
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      normal: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge variant="outline" className={variants[priority as keyof typeof variants]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const canEdit = (requisition: any) => {
    return (
      (user?.id === requisition.created_by && requisition.status === 'draft') ||
      isAdmin ||
      isSuperAdmin
    );
  };

  const canDelete = (requisition: any) => {
    return (
      (user?.id === requisition.created_by && requisition.status === 'draft') ||
      isAdmin ||
      isSuperAdmin
    );
  };

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      setStatusFilter([]);
    } else {
      setStatusFilter([status]);
    }
  };

  return (
    <>
      <SEOHead
        title="Requisition List"
        description="View and manage all requisition lists"
        url={`${window.location.origin}/procurement/requisitions`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Requisition List</h1>
            <p className="text-muted-foreground">
              {userRole === 'fe' 
                ? 'View and manage your requisitions'
                : 'View and manage all requisition lists'}
            </p>
          </div>
          <Button onClick={() => navigate('/procurement/create-requisition')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Requisition
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Requisitions</CardTitle>
                <CardDescription>
                  {requisitions.length} total requisition{requisitions.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="mb-6">
              <TabsList>
                <TabsTrigger value="all" onClick={() => handleStatusFilter('all')}>
                  All
                </TabsTrigger>
                <TabsTrigger value="draft" onClick={() => handleStatusFilter('draft')}>
                  Draft
                </TabsTrigger>
                <TabsTrigger value="pending" onClick={() => handleStatusFilter('pending_manager_approval')}>
                  Pending
                </TabsTrigger>
                <TabsTrigger value="approved" onClick={() => handleStatusFilter('manager_approved')}>
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" onClick={() => handleStatusFilter('manager_rejected')}>
                  Rejected
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading requisitions...</p>
              </div>
            ) : requisitions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No requisitions found</p>
                <p className="text-sm">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'Create your first requisition to get started'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/procurement/create-requisition')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Requisition
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisitions.map((requisition) => (
                      <TableRow key={requisition.id}>
                        <TableCell className="font-medium">
                          {requisition.order_number}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(requisition.status)}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(requisition.priority)}
                        </TableCell>
                        <TableCell>
                          {requisition.property?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {requisition.created_by_profile
                            ? `${requisition.created_by_profile.first_name} ${requisition.created_by_profile.last_name}`
                            : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {new Date(requisition.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/procurement/requisitions/${requisition.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit(requisition) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/procurement/my-requisitions/edit/${requisition.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete(requisition) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(requisition.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this requisition? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RequisitionListPage;
