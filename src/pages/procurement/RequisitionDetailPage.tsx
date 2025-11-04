import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { RequisitionHeader } from '@/components/requisition/RequisitionHeader';
import { RequisitionItemsTable } from '@/components/requisition/RequisitionItemsTable';
import { RequisitionTimeline } from '@/components/requisition/RequisitionTimeline';
import { RequisitionActions } from '@/components/requisition/RequisitionActions';
import { Card, CardContent } from '@/components/ui/card';

const RequisitionDetailPage = () => {
  const { id } = useParams();

  const { data: requisition, isLoading } = useQuery({
    queryKey: ['requisition', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisition_lists')
        .select(`
          *,
          property:properties(id, name),
          items:requisition_list_items(
            *,
            item:requisition_items_master(
              *,
              category:requisition_categories(name)
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Requisition not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`Requisition ${requisition.order_number}`}
        description="View requisition details"
        url={`${window.location.origin}/procurement/requisition/${id}`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center">
          <Link to="/procurement/my-requisitions" className="mr-4">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {requisition.order_number}
            </h1>
            <p className="text-muted-foreground mt-1">Requisition Details</p>
          </div>
        </div>

        <RequisitionHeader requisition={requisition} />
        
        <RequisitionItemsTable items={requisition.items} />
        
        <RequisitionTimeline requisitionId={requisition.id} />
        
        <RequisitionActions requisition={requisition} />
      </div>
    </>
  );
};

export default RequisitionDetailPage;
