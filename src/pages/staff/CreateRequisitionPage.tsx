import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { RequisitionWizard } from '@/components/requisition/RequisitionWizard';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const StaffCreateRequisitionPage = () => {
  return (
    <>
      <SEOHead
        title="Create Requisition"
        description="Submit a new requisition request for your property operations"
        url={`${window.location.origin}/staff/create-requisition`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Link to="/staff/dashboard" className="mr-4">
            <ArrowLeft className="h-6 w-6 text-foreground hover:text-primary transition-colors" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Requisition</h1>
            <p className="text-muted-foreground mt-1">
              Request items for your property operations
            </p>
          </div>
        </div>

        <RequisitionWizard />
      </div>
    </>
  );
};

export default StaffCreateRequisitionPage;
