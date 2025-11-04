
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from './AuthProvider';
import { PageLoader } from './LoadingSpinner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, approvalStatus, isAdmin, userRole, userCategory, isFoodVendor } = useAuth();
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

  // Food vendor access control - STRICT RESTRICTIONS
  if (isFoodVendor || userCategory === 'food_vendor') {
    const allowedFoodVendorPaths = ['/pos', '/profile', '/auth'];
    const isAllowedPath = allowedFoodVendorPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    if (!isAllowedPath) {
      // Log unauthorized access attempt
      console.warn(`Food vendor attempted to access restricted path: ${location.pathname}`);
      return <Navigate to="/pos" replace />;
    }
  }

  // Regular vendor access control - restrict vendors to only their portal
  if (userRole === 'vendor' && !isFoodVendor) {
    const allowedVendorPaths = ['/vendor-portal', '/profile', '/auth'];
    const isAllowedPath = allowedVendorPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    if (!isAllowedPath) {
      return <Navigate to="/vendor-portal" replace />;
    }
  }

  // Procurement staff access control - STRICT RESTRICTIONS
  if (userRole === 'procurement_manager' || userRole === 'purchase_executive') {
    const allowedProcurementPaths = ['/procurement', '/profile', '/auth'];
    const isAllowedPath = allowedProcurementPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    if (!isAllowedPath) {
      console.warn(`Procurement staff attempted to access restricted path: ${location.pathname}`);
      return <Navigate to="/procurement" replace />;
    }
  }

return (
  <>
    <Helmet>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
    {children}
  </>
);
};

export default ProtectedRoute;
