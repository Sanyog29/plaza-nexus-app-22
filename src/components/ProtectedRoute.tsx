
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { PageLoader } from './LoadingSpinner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, approvalStatus, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check approval status - only admins bypass this check
  if (user && !isAdmin && approvalStatus !== 'approved') {
    const PendingApprovalPage = React.lazy(() => import('./auth/PendingApprovalPage'));
    return (
      <React.Suspense fallback={<PageLoader />}>
        <PendingApprovalPage />
      </React.Suspense>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
