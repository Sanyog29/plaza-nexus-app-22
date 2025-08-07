import React, { Suspense } from 'react';
import { useOptimizedAdminMetrics } from '@/hooks/useOptimizedAdminMetrics';
import OptimizedLoadingSpinner from '@/components/admin/OptimizedLoadingSpinner';
import OptimizedAccessRestricted from '@/components/admin/OptimizedAccessRestricted';
import UnifiedAdminDashboard from './UnifiedAdminDashboard';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { useAuth } from '@/components/AuthProvider';
import { Helmet } from 'react-helmet-async';

const AdminDashboardPage = () => {
  const { isAdmin } = useAuth();
  const { isLoading, error } = useOptimizedAdminMetrics();

  // Show access restricted if not admin
  if (!isAdmin) {
    return <OptimizedAccessRestricted />;
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | SS Plaza</title>
        <meta name="description" content="Admin Dashboard for SS Plaza: real-time operations, analytics, and management." />
        <link rel="canonical" href={`${window.location.origin}/admin/dashboard`} />
      </Helmet>
      <LoadingWrapper 
        loading={isLoading} 
        error={error ? new Error(error) : null}
        skeleton={<OptimizedLoadingSpinner showSkeletons />}
      >
        <Suspense fallback={<OptimizedLoadingSpinner />}>
          <UnifiedAdminDashboard />
        </Suspense>
      </LoadingWrapper>
    </>
  );
};

export default AdminDashboardPage;