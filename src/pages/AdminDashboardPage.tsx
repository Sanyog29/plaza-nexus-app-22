import React, { Suspense } from 'react';
import { useOptimizedAdminMetrics } from '@/hooks/useOptimizedAdminMetrics';
import OptimizedLoadingSpinner from '@/components/admin/OptimizedLoadingSpinner';
import OptimizedAccessRestricted from '@/components/admin/OptimizedAccessRestricted';
import UnifiedAdminDashboard from './UnifiedAdminDashboard';
import { LoadingWrapper } from '@/components/common/LoadingWrapper';
import { useAuth } from '@/components/AuthProvider';
import { SEOHead } from '@/components/seo/SEOHead';

const AdminDashboardPage = () => {
  const { isAdmin, isStaff } = useAuth();
  const { isLoading, error } = useOptimizedAdminMetrics();

  // Show access restricted if not admin or staff
  if (!isAdmin && !isStaff) {
    return <OptimizedAccessRestricted />;
  }

  return (
    <>
      <SEOHead
        title="Admin Dashboard"
        description="Real-time operations, analytics, and management for AUTOPILOT."
        url={`${window.location.origin}/admin/dashboard`}
        type="website"
        noindex
      />
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