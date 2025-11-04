import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { ArrowLeft, Plus, Package, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const MyRequisitionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: requisitions, isLoading } = useQuery({
    queryKey: ['my-requisitions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_lists')
        .select(`
          *,
          properties (name)
        `)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'pending_manager_approval':
        return 'default';
      case 'manager_approved':
        return 'default';
      case 'pending_procurement':
        return 'default';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_manager_approval':
        return 'Pending Approval';
      case 'manager_approved':
        return 'Approved by Manager';
      case 'pending_procurement':
        return 'With Procurement';
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <SEOHead
        title="My Requisitions"
        description="View and manage your requisition requests"
        url={`${window.location.origin}/staff/my-requisitions`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/staff/dashboard" className="mr-4">
              <ArrowLeft className="h-6 w-6 text-foreground hover:text-primary transition-colors" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Requisitions</h1>
              <p className="text-muted-foreground mt-1">
                Track your submitted requisition requests
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/staff/create-requisition')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Requisition
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : requisitions && requisitions.length > 0 ? (
          <div className="grid gap-4">
            {requisitions.map((req) => (
              <Card 
                key={req.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/procurement/requisitions/${req.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{req.order_number}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {req.properties?.name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusColor(req.status)}>
                        {getStatusLabel(req.status)}
                      </Badge>
                      <Badge variant={getPriorityColor(req.priority)}>
                        {req.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {format(new Date(req.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Items</p>
                      <p className="font-medium">{req.total_items || 0}</p>
                    </div>
                    {req.expected_delivery_date && (
                      <div>
                        <p className="text-muted-foreground">Expected Delivery</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(req.expected_delivery_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    {req.notes && (
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-muted-foreground">Notes</p>
                        <p className="font-medium truncate">{req.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No requisitions found</p>
                <Button onClick={() => navigate('/staff/create-requisition')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Requisition
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default MyRequisitionsPage;
