import React, { Suspense } from 'react';
import { useOptimizedAdminMetrics } from '@/hooks/useOptimizedAdminMetrics';
import OptimizedLoadingSpinner from '@/components/admin/OptimizedLoadingSpinner';
import OptimizedAccessRestricted from '@/components/admin/OptimizedAccessRestricted';
import OptimizedAdminDashboard from './OptimizedAdminDashboard';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { useAuth } from '@/components/AuthProvider';

const AdminDashboardPage = () => {
  const { isAdmin } = useAuth();
  const { isLoading, error } = useOptimizedAdminMetrics();

  // Show access restricted if not admin
  if (!isAdmin) {
    return <OptimizedAccessRestricted />;
  }

  return (
    <LoadingWrapper 
      loading={isLoading} 
      error={error ? new Error(error) : null}
      skeleton={<OptimizedLoadingSpinner showSkeletons />}
    >
      <Suspense fallback={<OptimizedLoadingSpinner />}>
        <OptimizedAdminDashboard />
      </Suspense>
    </LoadingWrapper>
  );
};

export default AdminDashboardPage;