import React, { useEffect } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Navigate, useParams } from 'react-router-dom';

const EditRequisitionPage = () => {
  const { id } = useParams<{ id: string }>();

  // Redirect to my-requisitions since editing is now inline via Sheet
  if (!id) {
    return <Navigate to="/procurement/my-requisitions" replace />;
  }

  return <Navigate to="/procurement/my-requisitions" replace />;
};

export default EditRequisitionPage;
