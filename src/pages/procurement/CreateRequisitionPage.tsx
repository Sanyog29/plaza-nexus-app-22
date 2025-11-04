import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { RequisitionWizard } from '@/components/requisition/RequisitionWizard';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateRequisitionPage = () => {
  return (
    <>
      <SEOHead
        title="Create Requisition"
        description="Create a new requisition list"
        url={`${window.location.origin}/procurement/create-requisition`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Link to="/procurement" className="mr-4">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Requisition</h1>
            <p className="text-muted-foreground mt-1">
              Select items and submit for approval
            </p>
          </div>
        </div>

        <RequisitionWizard />
      </div>
    </>
  );
};

export default CreateRequisitionPage;
