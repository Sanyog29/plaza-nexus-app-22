import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { RequisitionWizard } from '@/components/requisition/RequisitionWizard';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';

const EditRequisitionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (!id) {
    return <Navigate to="/procurement/my-requisitions" replace />;
  }

  return (
    <>
      <SEOHead
        title="Edit Requisition"
        description="Edit your requisition draft"
        url={`${window.location.origin}/procurement/my-requisitions/edit/${id}`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Link to="/procurement/my-requisitions" className="mr-4">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Requisition</h1>
            <p className="text-muted-foreground mt-1">
              Update items and resubmit for approval
            </p>
          </div>
        </div>

        <RequisitionWizard requisitionId={id} />
      </div>
    </>
  );
};

export default EditRequisitionPage;
