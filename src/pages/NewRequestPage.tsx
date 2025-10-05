
import React from 'react';
import RequestFormHeader from '@/components/maintenance/RequestFormHeader';
import HierarchicalRequestForm from '@/components/maintenance/HierarchicalRequestForm';

const NewRequestPage = () => {
  return (
    <div className="w-full space-y-6 pb-24 md:pb-6">
      <RequestFormHeader />
      <div className="mt-6">
        <HierarchicalRequestForm />
      </div>
    </div>
  );
};

export default NewRequestPage;
